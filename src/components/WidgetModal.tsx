import React, { useState } from 'react';
import { X, Code2, Copy, Check, ExternalLink, Sparkles, Volume2, Moon, Sun, Layers } from 'lucide-react';

interface WidgetModalProps {
  onClose: () => void;
}

export const WidgetModal: React.FC<WidgetModalProps> = ({ onClose }) => {
  const [theme, setTheme] = useState<'auto' | 'dark' | 'light'>('auto');
  const [mode, setMode] = useState<'hover' | 'click'>('hover');
  const [lang, setLang] = useState<'en' | 'de' | 'fr' | 'ar'>('en');
  const [audio, setAudio] = useState<boolean>(true);
  const [selectionLookup, setSelectionLookup] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Generate Script Tag
  const generateScriptTag = (): string => {
    const attrs: string[] = ['src="https://lexicon.copto.org/widget.js"'];
    if (theme !== 'auto') attrs.push(`data-theme="${theme}"`);
    if (mode !== 'hover') attrs.push(`data-mode="${mode}"`);
    if (lang !== 'en') attrs.push(`data-lang="${lang}"`);
    if (!audio) attrs.push('data-audio="false"');
    if (!selectionLookup) attrs.push('data-selection-lookup="false"');
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
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '780px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '40px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid var(--border-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-gold)',
              flexShrink: 0
            }}
          >
            <Code2 size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', margin: 0, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Embeddable Word Tooltip Widget
            </h2>
            <p style={{ fontSize: '13px', margin: '2px 0 0 0', color: 'var(--text-muted)' }}>
              Add instant Coptic dictionary tooltips to your website with one script tag
            </p>
          </div>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Introduction Card */}
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6
            }}
          >
            <p style={{ margin: 0 }}>
              Allow visitors on your <strong>Coptic Bible reader, Agpeya app, blog, or church portal</strong> to hover or tap on any Coptic word for instant definitions, grammatical parts of speech, phonetic audio pronunciations, and morphological stem breakdowns.
            </p>
          </div>

          {/* Configuration Builder */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {/* Theme Selector */}
            <div className="filter-group" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <label className="filter-label" style={{ marginBottom: '4px', fontWeight: 600 }}>
                Theme:
              </label>
              <select
                className="filter-select"
                style={{ width: '100%' }}
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
              >
                <option value="auto">Auto (Matches User/Page)</option>
                <option value="dark">Obsidian Gold (Dark)</option>
                <option value="light">Papyrus Linen (Light)</option>
              </select>
            </div>

            {/* Language Selector */}
            <div className="filter-group" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <label className="filter-label" style={{ marginBottom: '4px', fontWeight: 600 }}>
                Definition Language:
              </label>
              <select
                className="filter-select"
                style={{ width: '100%' }}
                value={lang}
                onChange={(e) => setLang(e.target.value as any)}
              >
                <option value="en">English (Primary)</option>
                <option value="ar">Arabic (العربية)</option>
                <option value="de">German (Deutsch)</option>
                <option value="fr">French (Français)</option>
              </select>
            </div>

            {/* Mode Selector */}
            <div className="filter-group" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <label className="filter-label" style={{ marginBottom: '4px', fontWeight: 600 }}>
                Trigger Mode:
              </label>
              <select
                className="filter-select"
                style={{ width: '100%' }}
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
              >
                <option value="hover">Hover (with Tap support)</option>
                <option value="click">Click / Tap Only</option>
              </select>
            </div>
          </div>

          {/* Feature Toggles */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={audio}
                onChange={(e) => setAudio(e.target.checked)}
                style={{ accentColor: 'var(--accent-gold)' }}
              />
              <Volume2 size={16} color="var(--accent-gold)" />
              <span>Enable Audio Pronunciation Button</span>
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectionLookup}
                onChange={(e) => setSelectionLookup(e.target.checked)}
                style={{ accentColor: 'var(--accent-gold)' }}
              />
              <Sparkles size={16} color="var(--accent-gold)" />
              <span>Enable Double-Click / Text Selection Lookup</span>
            </label>
          </div>

          {/* Generated Code Snippet */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                1. Embed Code Snippet
              </span>
              <button
                className="btn-nav"
                onClick={handleCopy}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  borderColor: copied ? '#10b981' : 'var(--border-gold)',
                  color: copied ? '#10b981' : 'var(--accent-gold)'
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
              </button>
            </div>

            <div
              style={{
                background: '#080b11',
                border: '1px solid var(--border-gold)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '13px',
                color: '#e2e8f0',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}
            >
              {scriptCode}
            </div>
          </div>

          {/* HTML Usage Guide */}
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
              2. How to mark up Coptic words on your website
            </span>
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '12px',
                fontFamily: 'ui-monospace, monospace',
                color: 'var(--text-secondary)',
                lineHeight: 1.6
              }}
            >
              <div>&lt;!-- Automatic Scanner: wraps any element with class="coptic" --&gt;</div>
              <div style={{ color: 'var(--accent-gold)' }}>&lt;span class="coptic"&gt;ⲡⲛⲟⲩⲧⲉ&lt;/span&gt;</div>
              <div style={{ marginTop: '6px' }}>&lt;!-- Explicit Lemma Override for conjugated verbs / compound words --&gt;</div>
              <div style={{ color: 'var(--accent-gold)' }}>&lt;span class="coptic" data-coptic-lemma="ⲛⲟⲩⲧⲉ"&gt;ⲡⲛⲟⲩⲧⲉ&lt;/span&gt;</div>
            </div>
          </div>

          {/* Live Playground Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(56, 189, 248, 0.05))',
              border: '1px solid var(--border-gold)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                Explore Full Interactive Demo
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Test with real Sahidic Gospel of John and Bohairic Agpeya passages
              </div>
            </div>

            <a
              href="/widget-demo.html"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Open Live Demo</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
