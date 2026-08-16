import React from 'react';
import { X, HelpCircle, Sparkles, BookOpen, Layers } from 'lucide-react';
import { DIALECT_DESCRIPTIONS, POS_DESCRIPTIONS } from '../utils/coptic';

interface HowToModalProps {
  onClose: () => void;
  onSearchSample: (term: string) => void;
}

export const HowToModal: React.FC<HowToModalProps> = ({ onClose, onSearchSample }) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <HelpCircle size={26} color="var(--accent-gold)" />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px' }}>How to Search the Coptic Lexicon</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '14px', lineHeight: '1.6' }}>
          <div>
            <h3 style={{ color: 'var(--accent-gold)', fontSize: '16px', marginBottom: '8px' }}>1. Flexible Multi-lingual Search</h3>
            <p>
              You can search directly in <strong>Coptic Unicode characters</strong> (e.g. <span style={{ color: 'var(--accent-gold)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { onClose(); onSearchSample('ⲛⲟⲩⲧⲉ'); }}>ⲛⲟⲩⲧⲉ</span>, <span style={{ color: 'var(--accent-gold)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { onClose(); onSearchSample('ⲁⲅⲁⲡⲏ'); }}>ⲁⲅⲁⲡⲏ</span>), or in definition words in <strong>English</strong> (e.g. <em>&quot;god&quot;</em>, <em>&quot;love&quot;</em>), <strong>German (Deutsch)</strong> (e.g. <em>&quot;Gott&quot;</em>, <em>&quot;Liebe&quot;</em>), or <strong>French (Français)</strong>.
            </p>
          </div>

          <div>
            <h3 style={{ color: 'var(--accent-gold)', fontSize: '16px', marginBottom: '8px' }}>2. Coptic Virtual Keyboard &amp; Phonetic Mode</h3>
            <p>
              Click the <strong>&quot;Keyboard&quot;</strong> button on the search bar to toggle the on-screen Coptic keyboard.
              You can also turn on <strong>Phonetic Mode</strong> to type Coptic letters directly using your standard Latin keyboard (e.g. typing <code>sh</code> produces <code>ϣ</code>, <code>f</code> produces <code>ϥ</code>, <code>th</code> produces <code>ⲑ</code>).
            </p>
          </div>

          <div>
            <h3 style={{ color: 'var(--accent-gold)', fontSize: '16px', marginBottom: '8px' }}>3. Dialect Sigla &amp; Abbreviations</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginTop: '6px' }}>
              {Object.entries(DIALECT_DESCRIPTIONS).map(([siglum, info]) => (
                <div key={siglum} style={{ background: 'var(--bg-surface-elevated)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${info.color}` }}>
                  <strong style={{ color: info.color }}>{siglum}</strong> &ndash; <strong>{info.name}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{info.region}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ color: 'var(--accent-gold)', fontSize: '16px', marginBottom: '8px' }}>4. Part of Speech (POS) Tags</h3>
            <p>
              Entries can be filtered by Scriptorium grammatical part of speech tags:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {Object.entries(POS_DESCRIPTIONS).slice(0, 10).map(([tag, desc]) => (
                <span key={tag} className="dialect-tag" style={{ padding: '4px 8px' }}>
                  <strong>{tag}</strong>: {desc}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ color: 'var(--accent-gold)', fontSize: '16px', marginBottom: '8px' }}>5. Collocations &amp; Treebank Networks</h3>
            <p>
              Click the <span style={{ color: 'var(--accent-gold)' }}>Share / Network icon</span> on any entry to visualize its most common collocations and syntactic dependencies attested in the Coptic Universal Dependency Treebank.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
