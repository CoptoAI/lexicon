import { WidgetConfig } from './types';
import { fetchWordLookup } from './api';
import { WidgetUI } from './ui';

// Regex matching Coptic Unicode character ranges (standard Coptic, Demotic additions, Greek-Coptic overlap)
const COPTIC_REGEX = /[\u2C80-\u2CFF\u03E2-\u03EF\u0370-\u03FF]/;

class CoptoLexWidget {
  private config: WidgetConfig;
  private ui: WidgetUI;
  private scannedElements = new WeakSet<HTMLElement>();
  private activeLookupWord: string | null = null;

  constructor() {
    this.config = this.parseConfig();
    this.ui = new WidgetUI(this.config);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  private parseConfig(): WidgetConfig {
    let scriptEl: HTMLScriptElement | null = null;

    if (typeof document !== 'undefined') {
      scriptEl =
        (document.currentScript as HTMLScriptElement) ||
        document.querySelector('script[src*="widget.js"]');
    }

    const getAttr = (name: string, fallback: string): string => {
      if (!scriptEl) return fallback;
      return scriptEl.getAttribute(name) || scriptEl.getAttribute(`data-${name}`) || fallback;
    };

    const globalCfg = (typeof window !== 'undefined' && (window as any).CoptoLexWidgetConfig) || {};

    const defaultApiUrl =
      typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? `${window.location.origin}/api`
        : 'https://lexicon.copto.org/api';

    return {
      theme: (getAttr('theme', globalCfg.theme || 'auto') as any),
      lang: (getAttr('lang', globalCfg.lang || 'en') as any),
      mode: (getAttr('mode', globalCfg.mode || 'hover') as any),
      audio: getAttr('audio', String(globalCfg.audio ?? 'true')) !== 'false',
      selectionLookup: getAttr('selection-lookup', String(globalCfg.selectionLookup ?? 'true')) !== 'false',
      selector: getAttr('selector', globalCfg.selector || '.coptic, [data-coptic], [data-coptic-lemma], coptic-word, coptic'),
      apiUrl: getAttr('api-url', globalCfg.apiUrl || defaultApiUrl),
      zIndex: parseInt(getAttr('z-index', String(globalCfg.zIndex || 999999)), 10)
    };
  }

  private init() {
    this.scanDocument();
    this.setupMutationObserver();

    if (this.config.selectionLookup) {
      this.setupSelectionListener();
    }

    // Dismiss on click outside
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#coptolex-widget-host') && !target.closest(this.config.selector)) {
        this.ui.hide();
      }
    });
  }

  public scanDocument(root: HTMLElement | Document = document) {
    try {
      const elements = root.querySelectorAll<HTMLElement>(this.config.selector);
      elements.forEach((el) => this.bindElement(el));
    } catch (err) {
      console.warn('[CoptoLex Widget] Scanner error:', err);
    }
  }

  private setupMutationObserver() {
    if (typeof MutationObserver === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (const m of mutations) {
        if (m.addedNodes.length > 0) {
          shouldScan = true;
          break;
        }
      }
      if (shouldScan) {
        this.scanDocument();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  private bindElement(el: HTMLElement) {
    if (this.scannedElements.has(el)) return;
    this.scannedElements.add(el);

    // Apply cursor styling
    el.style.cursor = 'help';
    el.style.textDecoration = 'underline dotted var(--accent-gold, #d4af37)';

    if (this.config.mode === 'hover') {
      let hoverTimer: number | null = null;

      el.addEventListener('mouseenter', () => {
        hoverTimer = window.setTimeout(() => {
          this.triggerLookup(el);
        }, 150);
      });

      el.addEventListener('mouseleave', () => {
        if (hoverTimer) clearTimeout(hoverTimer);
        this.ui.hideWithDelay(250);
      });
    } else {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.triggerLookup(el);
      });
    }
  }

  private async triggerLookup(el: HTMLElement) {
    const word =
      el.getAttribute('data-coptic-lemma') ||
      el.getAttribute('data-coptic') ||
      el.innerText ||
      el.textContent ||
      '';

    const clean = word.trim();
    if (!clean) return;

    const rect = el.getBoundingClientRect();
    this.activeLookupWord = clean;
    this.ui.showLoading(rect);

    const result = await fetchWordLookup(clean, this.config.apiUrl, this.config.lang);

    // Check if still the active requested word
    if (this.activeLookupWord === clean) {
      if (result && result.found) {
        this.ui.showResult(result, rect);
      } else {
        this.ui.showNotFound(clean, rect);
      }
    }
  }

  private setupSelectionListener() {
    let selectionTimer: number | null = null;

    document.addEventListener('mouseup', () => {
      if (selectionTimer) clearTimeout(selectionTimer);

      selectionTimer = window.setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        const text = selection.toString().trim();
        // Check if selected string is a single Coptic word (1-30 chars, contains Coptic chars)
        if (text && text.length <= 30 && COPTIC_REGEX.test(text)) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            this.activeLookupWord = text;
            this.ui.showLoading(rect);

            fetchWordLookup(text, this.config.apiUrl, this.config.lang).then((result) => {
              if (this.activeLookupWord === text) {
                if (result && result.found) {
                  this.ui.showResult(result, rect);
                } else {
                  this.ui.showNotFound(text, rect);
                }
              }
            });
          }
        }
      }, 200);
    });
  }

  // Public API methods exposed on window.CoptoLexWidget
  public lookup(word: string, target: HTMLElement | DOMRect) {
    const rect = target instanceof DOMRect ? target : target.getBoundingClientRect();
    this.activeLookupWord = word;
    this.ui.showLoading(rect);

    fetchWordLookup(word, this.config.apiUrl, this.config.lang).then((result) => {
      if (result && result.found) {
        this.ui.showResult(result, rect);
      } else {
        this.ui.showNotFound(word, rect);
      }
    });
  }

  public hide() {
    this.ui.hide();
  }

  public configure(newConfig: Partial<WidgetConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.ui.updateConfig(newConfig);
  }
}

// Auto-initialize and expose global API
let widgetInstance: CoptoLexWidget | null = null;
if (typeof window !== 'undefined') {
  widgetInstance = new CoptoLexWidget();
  (window as any).CoptoLexWidget = widgetInstance;
}

export default widgetInstance;
