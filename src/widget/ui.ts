import { WidgetConfig, WidgetLookupResult } from './types';
import { playWidgetAudio } from './api';

const WIDGET_I18N: Record<string, any> = {
  en: {
    loading: 'Looking up Coptic word...',
    openInCoptoLex: 'Open in CoptoLex',
    searchOnCoptoLex: 'Search on CoptoLex ↗',
    noMatch: 'No exact lexicon match found.',
    noDefinition: 'No definition found.',
    listen: 'Listen to pronunciation',
    greek: '🏛️ Greek',
    egyptian: '🏺 Egyptian',
    greekTitle: 'Greek Loanword in Coptic',
    egyptianTitle: 'Ancient Egyptian Heritage',
    stem: 'Stem',
    from: 'from'
  },
  ar: {
    loading: 'جاري البحث عن الكلمة القبطية...',
    openInCoptoLex: 'افتح في CoptoLex',
    searchOnCoptoLex: 'ابحث في CoptoLex ↗',
    noMatch: 'لم يتم العثور على تطابق معجمي دقيق.',
    noDefinition: 'لم يتم العثور على تعريف.',
    listen: 'استمع إلى النطق',
    greek: '🏛️ يوناني',
    egyptian: '🏺 مصري',
    greekTitle: 'لفظ دخيل من اليونانية إلى القبطية',
    egyptianTitle: 'أصل مصري قديم',
    stem: 'الأصل',
    from: 'من'
  },
  de: {
    loading: 'Koptisches Wort wird nachgeschlagen...',
    openInCoptoLex: 'In CoptoLex öffnen',
    searchOnCoptoLex: 'Auf CoptoLex suchen ↗',
    noMatch: 'Kein genauer Wörterbucheintrag gefunden.',
    noDefinition: 'Keine Definition gefunden.',
    listen: 'Aussprache anhören',
    greek: '🏛️ Griechisch',
    egyptian: '🏺 Ägyptisch',
    greekTitle: 'Griechisches Lehnwort im Koptischen',
    egyptianTitle: 'Altägyptisches Erbe',
    stem: 'Stamm',
    from: 'aus'
  },
  fr: {
    loading: 'Recherche du mot copte...',
    openInCoptoLex: 'Ouvrir dans CoptoLex',
    searchOnCoptoLex: 'Rechercher sur CoptoLex ↗',
    noMatch: 'Aucune correspondance exacte trouvée.',
    noDefinition: 'Aucune définition trouvée.',
    listen: 'Écouter la prononciation',
    greek: '🏛️ Grec',
    egyptian: '🏺 Égyptien',
    greekTitle: 'Emprunt grec en copte',
    egyptianTitle: 'Héritage égyptien ancien',
    stem: 'Radical',
    from: 'de'
  }
};

export class WidgetUI {
  private host: HTMLElement | null = null;
  private shadow: ShadowRoot | null = null;
  private popover: HTMLElement | null = null;
  private config: WidgetConfig;
  private hideTimeout: number | null = null;
  private currentTarget: HTMLElement | null = null;

  constructor(config: WidgetConfig) {
    this.config = config;
    this.initShadowDOM();
  }

  private getLabels() {
    const lang = this.config.lang || 'en';
    return WIDGET_I18N[lang] || WIDGET_I18N.en;
  }

  public updateConfig(newConfig: Partial<WidgetConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.applyTheme();
  }

  private initShadowDOM() {
    if (typeof document === 'undefined') return;

    let existingHost = document.getElementById('coptolex-widget-host');
    if (!existingHost) {
      existingHost = document.createElement('div');
      existingHost.id = 'coptolex-widget-host';
      existingHost.style.position = 'absolute';
      existingHost.style.top = '0';
      existingHost.style.left = '0';
      existingHost.style.width = '100%';
      existingHost.style.height = '0';
      existingHost.style.overflow = 'visible';
      existingHost.style.pointerEvents = 'none';
      existingHost.style.zIndex = String(this.config.zIndex || 999999);
      document.body.appendChild(existingHost);
    }

    this.host = existingHost;
    this.shadow = this.host.attachShadow({ mode: 'open' });

    // Inject Styles
    const styleEl = document.createElement('style');
    styleEl.textContent = this.getStyles();
    this.shadow.appendChild(styleEl);

    // Create Popover Element
    this.popover = document.createElement('div');
    this.popover.className = 'coptolex-popover hidden';
    this.popover.setAttribute('role', 'dialog');
    this.popover.setAttribute('aria-label', 'Coptic Word Definition');
    this.shadow.appendChild(this.popover);

    // Keep popover visible on mouseenter, hide on mouseleave
    this.popover.addEventListener('mouseenter', () => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
    });

    this.popover.addEventListener('mouseleave', () => {
      if (this.config.mode === 'hover') {
        this.hideWithDelay(250);
      }
    });

    this.applyTheme();
  }

  private applyTheme() {
    if (!this.popover) return;
    const isDark =
      this.config.theme === 'dark' ||
      (this.config.theme === 'auto' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    this.popover.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }

  public showLoading(targetRect: DOMRect) {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    if (!this.popover) return;

    const t = this.getLabels();
    this.applyTheme();
    this.popover.innerHTML = `
      <div class="coptolex-loading">
        <div class="coptolex-spinner">ⲁ</div>
        <span>${t.loading}</span>
      </div>
    `;

    this.positionPopover(targetRect);
    this.popover.classList.remove('hidden');
    this.popover.classList.add('visible');
  }

  public showResult(result: WidgetLookupResult, targetRect: DOMRect) {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    if (!this.popover) return;

    const t = this.getLabels();
    this.applyTheme();

    const dialectsHtml = (result.dialects || [])
      .map((d) => `<span class="coptolex-badge coptolex-dialect">${d}</span>`)
      .join('');

    const originBadge =
      result.origin === 'greek'
        ? `<span class="coptolex-badge coptolex-origin-greek" title="${t.greekTitle}">${t.greek}</span>`
        : `<span class="coptolex-badge coptolex-origin-egyptian" title="${t.egyptianTitle}">${t.egyptian}</span>`;

    const morphologyNotice =
      result.matched_stem &&
      result.original_query &&
      result.matched_stem !== result.original_query.toLowerCase().trim()
        ? `<div class="coptolex-morph-hint">${t.stem}: <strong>${result.matched_stem}</strong> (${t.from} <em>${result.original_query}</em>)</div>`
        : '';

    const etymHtml = result.etym
      ? `<div class="coptolex-etym">✨ ${this.sanitizeDefinitionHtml(result.etym)}</div>`
      : '';

    const audioButton = this.config.audio
      ? `
        <button class="coptolex-audio-btn" id="coptolex-audio-trigger" title="${t.listen}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        </button>
      `
      : '';

    const deepLink = result.url || `https://lexicon.copto.org/?q=${encodeURIComponent(result.coptic_name || '')}`;

    this.popover.innerHTML = `
      <div class="coptolex-card">
        <div class="coptolex-header">
          <div class="coptolex-word-row">
            <span class="coptolex-headword">${this.escapeHtml(result.coptic_name || '')}</span>
            ${audioButton}
            ${result.ipa ? `<span class="coptolex-ipa">${this.escapeHtml(result.ipa)}</span>` : ''}
          </div>
          <div class="coptolex-badges">
            ${result.pos ? `<span class="coptolex-badge coptolex-pos">${this.escapeHtml(result.pos)}</span>` : ''}
            ${originBadge}
            ${dialectsHtml}
          </div>
        </div>

        ${morphologyNotice}

        <div class="coptolex-body">
          <div class="coptolex-definition ${/[\u0600-\u06FF\u0750-\u077F]/.test(result.definition || '') ? 'coptolex-arabic' : ''}" ${/[\u0600-\u06FF\u0750-\u077F]/.test(result.definition || '') ? 'dir="rtl"' : ''}>
            ${this.sanitizeDefinitionHtml(result.definition || t.noDefinition)}
          </div>
          ${etymHtml}
        </div>

        <div class="coptolex-footer">
          <a href="${deepLink}" target="_blank" rel="noopener noreferrer" class="coptolex-link">
            <span>${t.openInCoptoLex}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      </div>
    `;

    // Attach Audio Listener
    if (this.config.audio) {
      const audioBtn = this.popover.querySelector('#coptolex-audio-trigger');
      if (audioBtn && result.coptic_name) {
        audioBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const dialect = result.dialects?.includes('B') && !result.dialects?.includes('S') ? 'B' : 'S';
          playWidgetAudio(result.coptic_name!, dialect);
        });
      }
    }

    this.positionPopover(targetRect);
    this.popover.classList.remove('hidden');
    this.popover.classList.add('visible');
  }

  public showNotFound(query: string, targetRect: DOMRect) {
    if (!this.popover) return;
    const t = this.getLabels();
    this.applyTheme();

    const searchUrl = `https://lexicon.copto.org/?q=${encodeURIComponent(query)}`;

    this.popover.innerHTML = `
      <div class="coptolex-card">
        <div class="coptolex-header">
          <span class="coptolex-headword">${this.escapeHtml(query)}</span>
        </div>
        <div class="coptolex-body">
          <p style="margin:0; font-size:13px; color:var(--text-muted);">${t.noMatch}</p>
        </div>
        <div class="coptolex-footer">
          <a href="${searchUrl}" target="_blank" rel="noopener noreferrer" class="coptolex-link">
            <span>${t.searchOnCoptoLex}</span>
          </a>
        </div>
      </div>
    `;

    this.positionPopover(targetRect);
    this.popover.classList.remove('hidden');
    this.popover.classList.add('visible');
  }

  public hide() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    if (this.popover) {
      this.popover.classList.remove('visible');
      this.popover.classList.add('hidden');
    }
  }

  public hideWithDelay(ms: number = 250) {
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
    this.hideTimeout = window.setTimeout(() => {
      this.hide();
    }, ms);
  }

  private positionPopover(targetRect: DOMRect) {
    if (!this.popover) return;

    const popoverWidth = Math.min(320, window.innerWidth - 24);
    this.popover.style.width = `${popoverWidth}px`;

    const scrollX = window.pageXOffset || document.documentElement.scrollLeft || 0;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

    // Calculate center horizontal position
    let left = targetRect.left + targetRect.width / 2 - popoverWidth / 2 + scrollX;
    left = Math.max(scrollX + 12, Math.min(left, scrollX + window.innerWidth - popoverWidth - 12));

    const popoverHeight = 160; // Estimated height for boundary check
    const spaceAbove = targetRect.top;
    const spaceBelow = window.innerHeight - targetRect.bottom;

    let top = 0;
    if (spaceBelow >= popoverHeight || spaceBelow >= spaceAbove) {
      // Place below
      top = targetRect.bottom + scrollY + 8;
      this.popover.setAttribute('data-placement', 'bottom');
    } else {
      // Place above
      top = targetRect.top + scrollY - popoverHeight - 8;
      this.popover.setAttribute('data-placement', 'top');
    }

    this.popover.style.left = `${Math.round(left)}px`;
    this.popover.style.top = `${Math.round(top)}px`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private sanitizeDefinitionHtml(htmlText: string): string {
    if (!htmlText) return '';
    // Strip dangerous tags (script, iframe, object, embed, style, form, on* handlers)
    let cleaned = htmlText
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:[^"']*/gi, '');

    // Allow safe tags: <i>, <b>, <em>, <strong>, <span>, <br>, <small>, <u>
    return cleaned;
  }

  private getStyles(): string {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

      @font-face {
        font-family: 'Antinoou';
        src: local('Antinoou'), local('Antinoou Coptic'),
             url('https://lexicon.copto.org/fonts/Antinoou.woff2') format('woff2'),
             url('https://lexicon.copto.org/fonts/Antinoou.woff') format('woff'),
             url('https://lexicon.copto.org/fonts/Antinoou.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }

      :host {
        all: initial;
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      }

      .coptolex-popover {
        position: absolute;
        pointer-events: auto;
        box-sizing: border-box;
        border-radius: 12px;
        box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2);
        transition: opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 999999;
        line-height: 1.4;
      }

      .coptolex-popover.hidden {
        opacity: 0;
        transform: translateY(4px) scale(0.97);
        pointer-events: none;
      }

      .coptolex-popover.visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      /* Dark Theme (Obsidian Gold) */
      .coptolex-popover[data-theme="dark"] {
        --bg: #121824;
        --bg-elevated: #1a2233;
        --text: #f1f5f9;
        --text-muted: #94a3b8;
        --gold: #d4af37;
        --border: rgba(212, 175, 55, 0.25);
        --border-subtle: rgba(255, 255, 255, 0.08);
        background: rgba(18, 24, 36, 0.96);
        backdrop-filter: blur(12px);
        color: var(--text);
        border: 1px solid var(--border);
      }

      /* Light Theme (Papyrus Linen) */
      .coptolex-popover[data-theme="light"] {
        --bg: #fbf9f4;
        --bg-elevated: #f3ede2;
        --text: #1e293b;
        --text-muted: #64748b;
        --gold: #b38600;
        --border: rgba(179, 134, 0, 0.3);
        --border-subtle: rgba(0, 0, 0, 0.08);
        background: rgba(251, 249, 244, 0.98);
        backdrop-filter: blur(12px);
        color: var(--text);
        border: 1px solid var(--border);
      }

      .coptolex-card {
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .coptolex-header {
        display: flex;
        flex-direction: column;
        gap: 6px;
        border-bottom: 1px solid var(--border-subtle);
        padding-bottom: 8px;
      }

      .coptolex-word-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .coptolex-headword {
        font-family: 'Antinoou', 'Segoe UI Historic', 'Athena', sans-serif;
        font-size: 20px;
        font-weight: bold;
        color: var(--gold);
        letter-spacing: 0.5px;
      }

      .coptolex-ipa {
        font-family: ui-monospace, monospace;
        font-size: 11px;
        color: var(--text-muted);
      }

      .coptolex-audio-btn {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        color: var(--gold);
        border-radius: 50%;
        width: 22px;
        height: 22px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.15s ease;
        padding: 0;
      }

      .coptolex-audio-btn:hover {
        transform: scale(1.1);
        background: var(--gold);
        color: #0c0f17;
      }

      .coptolex-badges {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
      }

      .coptolex-badge {
        font-size: 10px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .coptolex-pos {
        background: rgba(56, 189, 248, 0.15);
        color: #38bdf8;
        border: 1px solid rgba(56, 189, 248, 0.3);
      }

      .coptolex-dialect {
        background: rgba(168, 85, 247, 0.15);
        color: #c084fc;
        border: 1px solid rgba(168, 85, 247, 0.3);
      }

      .coptolex-origin-egyptian {
        background: rgba(212, 175, 55, 0.15);
        color: var(--gold);
        border: 1px solid var(--border);
      }

      .coptolex-origin-greek {
        background: rgba(99, 102, 241, 0.15);
        color: #818cf8;
        border: 1px solid rgba(99, 102, 241, 0.3);
      }

      .coptolex-morph-hint {
        font-size: 11px;
        color: var(--text-muted);
        background: var(--bg-elevated);
        padding: 4px 8px;
        border-radius: 4px;
      }

      .coptolex-body {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .coptolex-definition {
        font-size: 13px;
        font-weight: 500;
        color: var(--text);
      }

      .coptolex-definition.coptolex-arabic {
        font-family: 'Noto Sans Arabic', 'Amiri', 'Traditional Arabic', -apple-system, sans-serif;
        text-align: right;
        direction: rtl;
        font-size: 14px;
        line-height: 1.6;
      }

      .coptolex-etym {
        font-size: 11px;
        color: var(--text-muted);
        font-style: italic;
      }

      .coptolex-footer {
        display: flex;
        justify-content: flex-end;
        border-top: 1px solid var(--border-subtle);
        padding-top: 6px;
        margin-top: 2px;
      }

      .coptolex-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        font-weight: 600;
        color: var(--gold);
        text-decoration: none;
        transition: opacity 0.15s ease;
      }

      .coptolex-link:hover {
        opacity: 0.8;
        text-decoration: underline;
      }

      .coptolex-loading {
        padding: 18px 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--text-muted);
        font-size: 12px;
      }

      .coptolex-spinner {
        font-family: 'Antinoou', sans-serif;
        font-size: 20px;
        color: var(--gold);
        animation: pulse 1s infinite alternate;
      }

      @keyframes pulse {
        0% { transform: scale(0.9); opacity: 0.6; }
        100% { transform: scale(1.15); opacity: 1; }
      }
    `;
  }
}
