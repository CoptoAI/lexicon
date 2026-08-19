import React from 'react';
import { X, HelpCircle, Sparkles, BookOpen, Layers } from 'lucide-react';
import { DIALECT_DESCRIPTIONS, POS_DESCRIPTIONS } from '../utils/coptic';
import { useSwipeGesture } from '../utils/useSwipeGesture';

interface HowToModalProps {
  onClose: () => void;
  onSearchSample: (term: string) => void;
}

export const HowToModal: React.FC<HowToModalProps> = ({ onClose, onSearchSample }) => {
  const { dragOffset, isDragging, touchHandlers } = useSwipeGesture({
    onSwipeDown: onClose,
    threshold: 80,
    enableVerticalDrag: true
  });

  return (
    <div className="modal-backdrop modal-backdrop-sheet" onClick={onClose}>
      <div
        className="modal-content modal-content-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: isDragging && dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: isDragging && dragOffset > 40 ? Math.max(0.6, 1 - dragOffset / 400) : 1
        }}
      >
        {/* Mobile Swipe / Drag Handle */}
        <div className="sheet-drag-handle-touch-zone" {...touchHandlers}>
          <div className="sheet-drag-handle" />
        </div>

        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <HelpCircle size={26} color="var(--accent-gold)" />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: 0 }}>How to Search the Coptic Lexicon</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', lineHeight: '1.6' }}>
          <div>
            <h3 style={{ color: 'var(--accent-gold)', fontSize: '15px', marginBottom: '6px' }}>1. Flexible Multi-lingual Search</h3>
            <p>
              Search directly in <strong>Coptic Unicode characters</strong> (e.g. <span style={{ color: 'var(--accent-gold)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }} onClick={() => { onClose(); onSearchSample('ⲛⲟⲩⲧⲉ'); }}>ⲛⲟⲩⲧⲉ</span>, <span style={{ color: 'var(--accent-gold)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }} onClick={() => { onClose(); onSearchSample('ⲁⲅⲁⲡⲏ'); }}>ⲁⲅⲁⲡⲏ</span>), or in definition words in <strong>Arabic</strong> (e.g. <em>&quot;الله&quot;</em>, <em>&quot;محبة&quot;</em>), <strong>English</strong> (e.g. <em>&quot;god&quot;</em>, <em>&quot;love&quot;</em>), <strong>German</strong>, or <strong>French</strong>.
            </p>
          </div>

          <div>
            <h3 style={{ color: 'var(--accent-gold)', fontSize: '15px', marginBottom: '6px' }}>2. Coptic Virtual Keyboard &amp; Phonetic Mode</h3>
            <p>
              Tap the <strong>&quot;Keyboard&quot;</strong> icon on the bottom navigation bar or search bar to toggle the on-screen Coptic keyboard.
              Enable <strong>Phonetic Mode</strong> to type Coptic letters directly using your standard Latin keyboard (e.g. typing <code>sh</code> produces <code>ϣ</code>, <code>f</code> produces <code>ϥ</code>, <code>th</code> produces <code>ⲑ</code>).
            </p>
          </div>

          <div>
            <h3 style={{ color: 'var(--accent-gold)', fontSize: '15px', marginBottom: '6px' }}>3. Dialect Sigla &amp; Abbreviations</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginTop: '6px' }}>
              {Object.entries(DIALECT_DESCRIPTIONS).map(([siglum, info]) => (
                <div key={siglum} style={{ background: 'var(--bg-surface-elevated)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${info.color}` }}>
                  <strong style={{ color: info.color }}>{siglum}</strong> &ndash; <strong>{info.name}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{info.region}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ color: 'var(--accent-gold)', fontSize: '15px', marginBottom: '6px' }}>4. Part of Speech (POS) Tags</h3>
            <p>
              Filter entries by Scriptorium grammatical part of speech tags:
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
            <h3 style={{ color: 'var(--accent-gold)', fontSize: '15px', marginBottom: '6px' }}>5. Collocations &amp; Treebank Networks</h3>
            <p>
              Click the <span style={{ color: 'var(--accent-gold)' }}>Network icon</span> on any entry to visualize its most common collocations and syntactic dependencies attested in the Coptic Universal Dependency Treebank.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
