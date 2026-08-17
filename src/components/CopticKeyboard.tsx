import React, { useState } from 'react';
import { COPTIC_ALPHABET } from '../utils/coptic';
import { Sparkles, Delete, ArrowUp, X } from 'lucide-react';

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

  const specialChars = [
    { label: '⸗', desc: 'Double dash / pronominal' },
    { label: '-', desc: 'Hyphen / nominal' },
    { label: '̀', desc: 'Jinkim (combining)' },
    { label: '̄', desc: 'Supralinear stroke (combining)' },
    { label: '·', desc: 'Middle dot' },
    { label: 'ⳉ', desc: 'Akhmimic Horori' },
    { label: 'ϧ', desc: 'Bohairic Khai' }
  ];

  return (
    <div className="keyboard-dock">
      <div className="keyboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>ⲁⲃⲅ Coptic Keyboard</span>
          <span className="keyboard-hint-text">• Touch to type</span>
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
              onClick={onClose}
              title="Close keyboard"
              style={{ width: '28px', height: '28px' }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

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

        {specialChars.map((s) => (
          <button
            key={s.label}
            className="key-btn"
            onClick={() => handleKeyClick(s.label)}
            title={s.desc}
          >
            <span>{s.label}</span>
            <span className="key-sub">diac</span>
          </button>
        ))}

        <button
          className="key-btn"
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
