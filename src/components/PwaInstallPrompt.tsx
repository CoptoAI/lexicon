import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, Check } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed / standalone
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    setIsStandalone(isRunningStandalone);
    if (isRunningStandalone) return;

    // Check if iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    setIsIos(isIosDevice && isSafari);

    // Dismissed previously check (within 7 days)
    const dismissed = localStorage.getItem('coptolex_pwa_dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If iOS and not dismissed, show prompt after 3s
    if (isIosDevice && isSafari && !dismissed) {
      const timer = setTimeout(() => setShowPrompt(true), 3500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt');
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosGuide(false);
    localStorage.setItem('coptolex_pwa_dismissed', String(Date.now()));
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <>
      <div className="pwa-install-banner animate-slide-up">
        <div className="pwa-install-content">
          <div className="pwa-app-icon">ⲁ</div>
          <div className="pwa-install-text">
            <strong>Install CoptoLex</strong>
            <p>Full offline access, instant Coptic keyboard &amp; pronunciation</p>
          </div>
        </div>

        <div className="pwa-install-actions">
          <button className="btn-pwa-install" onClick={handleInstallClick}>
            <Download size={14} />
            <span>Install</span>
          </button>
          <button className="btn-icon" onClick={handleDismiss} style={{ width: '32px', height: '32px' }} title="Dismiss">
            <X size={16} />
          </button>
        </div>
      </div>

      {showIosGuide && (
        <div className="modal-backdrop" onClick={() => setShowIosGuide(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center' }}>
            <button className="modal-close-btn" onClick={() => setShowIosGuide(false)}>
              <X size={20} />
            </button>

            <div className="pwa-app-icon" style={{ margin: '0 auto 12px auto', width: '64px', height: '64px', fontSize: '36px' }}>ⲁ</div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Install on iPhone / iPad</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Add CoptoLex to your Home Screen for full offline dictionary access without opening Safari:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', background: 'var(--bg-surface-elevated)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                <span className="step-num">1</span>
                <span>Tap the <strong>Share</strong> button <Share size={15} style={{ display: 'inline', verticalAlign: 'middle' }} /> in Safari toolbar.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                <span className="step-num">2</span>
                <span>Scroll down and select <strong>Add to Home Screen</strong> <PlusSquare size={15} style={{ display: 'inline', verticalAlign: 'middle' }} />.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                <span className="step-num">3</span>
                <span>Tap <strong>Add</strong> in the top-right corner.</span>
              </div>
            </div>

            <button className="btn-nav" onClick={handleDismiss} style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
              <Check size={16} />
              <span>Got it</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
