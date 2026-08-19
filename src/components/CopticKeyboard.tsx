import React, { useState } from 'react';
import { COPTIC_ALPHABET } from '../utils/coptic';
import { Sparkles, Delete, ArrowUp, X, ChevronDown } from 'lucide-react';
import { useSwipeGesture } from '../utils/useSwipeGesture';

interface CopticKeyboardProps {
  onInsertChar: (char: string) => void;
  onBackspace: () => void;
  phoneticMode: boolean;
  onTogglePhonetic: () => void;
  onClose?: () => void;
}

export const CopticKeyboard: React.FC<CopticKeyboardProps> = ({
  onInsertChar,
  onBackspace,
  phoneticMode,
  onTogglePhonetic,
  onClose
}) => {
  const [uppercase, setUppercase] = useState(false);

  const { dragOffset, isDragging, touchHandlers } = useSwipeGesture({
    onSwipeDown: onClose,
    threshold: 60,
    enableVerticalDrag: true
  });

  const triggerHaptic = (duration = 8) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch (e) {}
    }
  };

  const handleKeyClick = (char: string) => {
    triggerHaptic(10);
    onInsertChar(char);
  };

  const handleBackspaceClick = () => {
    triggerHaptic(15);
    onBackspace();
  };

  // Quick Diacritics & Special Glyphs
  const quickDiacritics = [
    { label: 'ⲁ̄', val: 'ⲁ̄', desc: 'Alpha + Macron' },
    { label: 'ⲉ̄', val: 'ⲉ̄', desc: 'Ei + Macron' },
    { label: 'ⲓ̄', val: 'ⲓ̄', desc: 'Iota + Macron' },
    { label: 'ⲟ̄', val: 'ⲟ̄', desc: 'Ou + Macron' },
    { label: 'ⲱ̄', val: 'ⲱ̄', desc: 'Omega + Macron' },
    { label: '̀', val: '̀', desc: 'Djinkim (combining)' },
    { label: '̄', val: '̄', desc: 'Supralinear stroke' },
    { label: '⸗', val: '⸗', desc: 'Double hyphen (pronominal)' },
    { label: '-', val: '-', desc: 'Hyphen (nominal)' },
    { label: '·', val: '·', desc: 'Middle dot' },
    { label: 'ϧ', val: 'ϧ', desc: 'Bohairic Khai' },
    { label: 'ⳉ', val: 'ⳉ', desc: 'Akhmimic Horori' }
  ];

  return (
    <div
      className="keyboard-dock"
      style={{
        transform: isDragging && dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
        transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Mobile Drag / Dismiss Handle */}
      <div className="sheet-drag-handle-touch-zone" {...touchHandlers}>
        <div className="sheet-drag-handle" style={{ margin: '0 auto 8px auto' }} />
      </div>

      <div className="keyboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, color: 'var(--accent-gold)', fontSize: '14px' }}>ⲁⲃⲅ Coptic Keyboard</span>
          <span className="keyboard-hint-text">• Tap to type</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className={`btn-keyboard-toggle ${phoneticMode ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic(12);
              onTogglePhonetic();
            }}
            title="Enable direct phonetic typing from Latin keyboard"
          >
            <Sparkles size={13} />
            <span>{phoneticMode ? 'Phonetic: ON' : 'Phonetic'}</span>
          </button>

          {onClose && (
            <button
              className="btn-icon keyboard-close-btn"
              onClick={() => {
                triggerHaptic(10);
                onClose();
              }}
              title="Minimize keyboard"
              style={{ width: '32px', height: '32px' }}
            >
              <ChevronDown size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Quick Diacritics Bar for Mobile */}
      <div className="keyboard-diacritics-row">
        {quickDiacritics.map((d) => (
          <button
            key={d.label}
            className="diacritic-quick-key"
            onClick={() => handleKeyClick(d.val)}
            title={d.desc}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Main Alphabet Grid */}
      <div className="keyboard-grid">
        <button
          className={`key-btn ${uppercase ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic(12);
            setUppercase(!uppercase);
          }}
          title="Shift Uppercase"
          style={{ gridColumn: 'span 2', fontSize: '13px' }}
        >
          <ArrowUp size={16} />
          <span className="key-sub">Shift</span>
        </button>

        {COPTIC_ALPHABET.map((c) => {
          const charToInsert = uppercase ? c.upper : c.lower;
          return (
            <button
              key={c.name}
              className="key-btn"
              onClick={() => handleKeyClick(charToInsert)}
              title={`${c.name} (${c.translit}) - Key: ${c.key}`}
            >
              <span>{charToInsert}</span>
              <span className="key-sub">{c.key}</span>
            </button>
          );
        })}

        <button
          className="key-btn key-btn-backspace"
          onClick={handleBackspaceClick}
          title="Backspace"
          style={{ gridColumn: 'span 2', fontSize: '13px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}
        >
          <Delete size={16} />
          <span className="key-sub" style={{ color: '#f87171' }}>Del</span>
        </button>
      </div>
    </div>
  );
};
