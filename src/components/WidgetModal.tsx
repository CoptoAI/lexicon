import React, { useState, useEffect } from 'react';
import { X, Code2, Copy, Check, ExternalLink, Sparkles, Play, Info } from 'lucide-react';
import { useSwipeGesture } from '../utils/useSwipeGesture';

interface WidgetModalProps {
  onClose: () => void;
}

export const WidgetModal: React.FC<WidgetModalProps> = ({ onClose }) => {
  const [theme, setTheme] = useState<'auto' | 'dark' | 'light'>('auto');
  const [mode, setMode] = useState<'hover' | 'click'>('hover');
  const [lang, setLang] = useState<'en' | 'de' | 'fr' | 'ar'>('en');
  const [audio, setAudio] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [demoHoveredWord, setDemoHoveredWord] = useState<{ coptic: string; en: string; ar: string; pos: string } | null>(null);

  const { dragOffset, isDragging, touchHandlers } = useSwipeGesture({
    onSwipeDown: onClose,
    threshold: 80,
    enableVerticalDrag: true
  });

  // Dynamically load widget script for live sandbox inside modal
  useEffect(() => {
    const scriptId = 'coptolex-live-widget-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = '/widget.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Sample Coptic demo words mapping for live interactive sandbox fallback preview
  const SAMPLE_DEMO_WORDS: Record<string, { en: string; ar: string; pos: string; translit: string }> = {
    'ⲧⲁⲣⲭⲏ': { en: 'the beginning, origin', ar: 'البداية، الأصل', pos: 'noun.f', translit: 't-arkhē' },
    'ⲡⲥⲁϫⲓ': { en: 'the word, speech, matter', ar: 'الكلمة، القول', pos: 'noun.m', translit: 'p-saji' },
    'ⲡⲛⲟⲩⲧⲉ': { en: 'God, the divine Lord', ar: 'الله، الرب الإله', pos: 'noun.m', translit: 'p-noute' },
    'ⲁⲅⲁⲡⲏ': { en: 'love, divine charity', ar: 'المحبة، المحبة الإلهية', pos: 'noun.f', translit: 'agapē' },
    'ⲟⲩⲱⲓⲛⲓ': { en: 'light, illumination', ar: 'النور، الضياء', pos: 'noun.m', translit: 'ouōini' }
  };

  // Generate Script Tag
  const generateScriptTag = (): string => {
    const attrs: string[] = ['src="https://lexicon.copto.org/widget.js"'];
    if (theme !== 'auto') attrs.push(`data-theme="${theme}"`);
    if (mode !== 'hover') attrs.push(`data-mode="${mode}"`);
    if (lang !== 'en') attrs.push(`data-lang="${lang}"`);
    if (!audio) attrs.push('data-audio="false"');
    attrs.push('async');

    return `<script ${attrs.join(' ')}></script>`;
  };

  const scriptCode = generateScriptTag();

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop modal-backdrop-sheet" onClick={onClose}>
      <div
        className="modal-content modal-content-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '820px',
          transform: isDragging && dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: isDragging && dragOffset > 40 ? Math.max(0.6, 1 - dragOffset / 400) : 1
        }}
      >
        {/* Mobile Drag Handle */}
        <div className="sheet-drag-handle-touch-zone" {...touchHandlers}>
          <div className="sheet-drag-handle" />
        </div>

        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {/* Modal Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '40px', marginBottom: '16px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid var(--border-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
              flexShrink: 0
            }}
          >
            <Code2 size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', margin: 0, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Embeddable Word Tooltip Widget
            </h2>
            <p style={{ fontSize: '13px', margin: '2px 0 0 0', color: 'var(--text-muted)' }}>
              Add instant Coptic dictionary tooltips to your website with a single <code>&lt;script&gt;</code> tag
            </p>
          </div>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Live Interactive Sandbox Section */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
              border: '1px solid var(--border-gold)',
              borderRadius: '12px',
              padding: '16px',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="#f59e0b" />
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Interactive Live Demo Sandbox / تجربة حية تفاعلية
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--accent-gold)', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: '12px' }}>
                Hover or tap any word below
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              Test how the dictionary widget responds live when hovering over Coptic text on your site:
            </p>

            {/* Interactive Coptic Sample Text Box */}
            <div
              className="coptic-font"
              style={{
                fontSize: '22px',
                lineHeight: 1.8,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '16px',
                color: 'var(--text-primary)',
                direction: 'ltr'
              }}
            >
              ϧⲉⲛ {' '}
              <span
                className="coptolex-word-interactive"
                style={{ cursor: 'pointer', color: '#f59e0b', textDecoration: 'underline dotted #f59e0b' }}
                onMouseEnter={() => setDemoHoveredWord({ coptic: 'ⲧⲁⲣⲭⲏ', ...SAMPLE_DEMO_WORDS['ⲧⲁⲣⲭⲏ'] })}
                onClick={() => setDemoHoveredWord({ coptic: 'ⲧⲁⲣⲭⲏ', ...SAMPLE_DEMO_WORDS['ⲧⲁⲣⲭⲏ'] })}
              >
                ⲧⲁⲣⲭⲏ
              </span>{' '}
              ⲛⲉ ϥϣⲟⲡ ⲛϫⲉ {' '}
              <span
                className="coptolex-word-interactive"
                style={{ cursor: 'pointer', color: '#f59e0b', textDecoration: 'underline dotted #f59e0b' }}
                onMouseEnter={() => setDemoHoveredWord({ coptic: 'ⲡⲥⲁϫⲓ', ...SAMPLE_DEMO_WORDS['ⲡⲥⲁϫⲓ'] })}
                onClick={() => setDemoHoveredWord({ coptic: 'ⲡⲥⲁϫⲓ', ...SAMPLE_DEMO_WORDS['ⲡⲥⲁϫⲓ'] })}
              >
                ⲡⲥⲁϫⲓ
              </span>{' '}
              ⲟⲩⲟϩ {' '}
              <span
                className="coptolex-word-interactive"
                style={{ cursor: 'pointer', color: '#f59e0b', textDecoration: 'underline dotted #f59e0b' }}
                onMouseEnter={() => setDemoHoveredWord({ coptic: 'ⲡⲛⲟⲩⲧⲉ', ...SAMPLE_DEMO_WORDS['ⲡⲛⲟⲩⲧⲉ'] })}
                onClick={() => setDemoHoveredWord({ coptic: 'ⲡⲛⲟⲩⲧⲉ', ...SAMPLE_DEMO_WORDS['ⲡⲛⲟⲩⲧⲉ'] })}
              >
                ⲡⲛⲟⲩⲧⲉ
              </span>{' '}
              ⲡⲉ {' '}
              <span
                className="coptolex-word-interactive"
                style={{ cursor: 'pointer', color: '#f59e0b', textDecoration: 'underline dotted #f59e0b' }}
                onMouseEnter={() => setDemoHoveredWord({ coptic: 'ⲁⲅⲁⲡⲏ', ...SAMPLE_DEMO_WORDS['ⲁⲅⲁⲡⲏ'] })}
                onClick={() => setDemoHoveredWord({ coptic: 'ⲁⲅⲁⲡⲏ', ...SAMPLE_DEMO_WORDS['ⲁⲅⲁⲡⲏ'] })}
              >
                ⲁⲅⲁⲡⲏ
              </span>
            </div>

            {/* Live Interactive Popover Card Preview */}
            {demoHoveredWord && (
              <div
                style={{
                  marginTop: '12px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid #f59e0b',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  animation: 'fadeIn 0.2s ease-out'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong className="coptic-font" style={{ fontSize: '20px', color: '#f59e0b' }}>
                    {demoHoveredWord.coptic}
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: '4px' }}>
                    {demoHoveredWord.pos}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  🇬🇧 <strong>{demoHoveredWord.en}</strong>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  🇪🇬 <strong>{demoHoveredWord.ar}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Configuration Options */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div className="filter-group" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <label className="filter-label" style={{ marginBottom: '4px', fontWeight: 600 }}>Theme:</label>
              <select className="dialect-pill" style={{ width: '100%', padding: '8px' }} value={theme} onChange={e => setTheme(e.target.value as any)}>
                <option value="auto">Auto (Detects Site Theme)</option>
                <option value="dark">Dark (Obsidian Gold)</option>
                <option value="light">Light (Papyrus Warm)</option>
              </select>
            </div>

            <div className="filter-group" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <label className="filter-label" style={{ marginBottom: '4px', fontWeight: 600 }}>Activation:</label>
              <select className="dialect-pill" style={{ width: '100%', padding: '8px' }} value={mode} onChange={e => setMode(e.target.value as any)}>
                <option value="hover">Hover (Desktop) / Tap (Mobile)</option>
                <option value="click">Click / Tap Only</option>
              </select>
            </div>

            <div className="filter-group" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <label className="filter-label" style={{ marginBottom: '4px', fontWeight: 600 }}>Language:</label>
              <select className="dialect-pill" style={{ width: '100%', padding: '8px' }} value={lang} onChange={e => setLang(e.target.value as any)}>
                <option value="en">English</option>
                <option value="ar">Arabic (العربية)</option>
              </select>
            </div>
          </div>

          {/* HTML Embed Code Snippet */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Copy HTML Script Tag:</span>
              <button className="btn-nav" onClick={handleCopy} style={{ padding: '4px 10px', fontSize: '12px', borderColor: 'var(--border-gold)' }}>
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Script'}</span>
              </button>
            </div>
            <pre style={{ background: '#0a0d14', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '12px', color: '#38bdf8', fontSize: '13px', overflowX: 'auto' }}>
              <code>{scriptCode}</code>
            </pre>
          </div>

          {/* Action Links */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <a
              href="/widget-demo.html"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-nav"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#f59e0b', borderColor: '#f59e0b' }}
            >
              <ExternalLink size={15} />
              <span>Open Standalone Full-Screen Demo Page</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
