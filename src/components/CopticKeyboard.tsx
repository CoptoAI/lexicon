import React, { useState } from 'react';
import { COPTIC_ALPHABET } from '../utils/coptic';
import { Sparkles, Delete, ArrowUp } from 'lucide-react';

interface CopticKeyboardProps {
  onInsertChar: (char: string) => void;
  onBackspace: () => void;
  phoneticMode: boolean;
  onTogglePhonetic: () => void;
}

export const CopticKeyboard: React.FC<CopticKeyboardProps> = ({
  onInsertChar,
  onBackspace,
  phoneticMode,
  onTogglePhonetic
}) => {
  const [uppercase, setUppercase] = useState(false);

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
          <span style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>ⲁⲃⲅ Coptic Virtual Keyboard</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>• Touch or click to type</span>
        </div>
        <button
          className={`btn-keyboard-toggle ${phoneticMode ? 'active' : ''}`}
          onClick={onTogglePhonetic}
          title="Enable direct phonetic typing from Latin keyboard"
        >
          <Sparkles size={13} />
          <span>{phoneticMode ? 'Phonetic Mode: ON' : 'Phonetic Mode: OFF'}</span>
        </button>
      </div>

      <div className="keyboard-grid">
        <button
          className={`key-btn ${uppercase ? 'active' : ''}`}
          onClick={() => setUppercase(!uppercase)}
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
              onClick={() => onInsertChar(charToInsert)}
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
            onClick={() => onInsertChar(s.label)}
            title={s.desc}
          >
            <span>{s.label}</span>
            <span className="key-sub">diac</span>
          </button>
        ))}

        <button
          className="key-btn"
          onClick={onBackspace}
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
