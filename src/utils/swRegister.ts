/**
 * Service Worker Registration & PWA Lifecycle Helpers
 */

export interface PwaUpdateListener {
  (updateAvailable: boolean): void;
}

let registration: ServiceWorkerRegistration | null = null;
const listeners: Set<PwaUpdateListener> = new Set();

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        registration = reg;
        console.log('[PWA] Service Worker registered with scope:', reg.scope);

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New content is available; please refresh.');
                notifyListeners(true);
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn('[PWA] Service Worker registration failed:', error);
      });

    // Handle controller change (when skipWaiting activates new SW)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

export function subscribeToPwaUpdates(listener: PwaUpdateListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(updateAvailable: boolean): void {
  listeners.forEach((l) => l(updateAvailable));
}

export function updatePwa(): void {
  if (registration && registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}
