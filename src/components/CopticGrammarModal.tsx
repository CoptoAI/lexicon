import React, { useState } from 'react';
import { X, Volume2, Sparkles, Copy, Check, Search, Layers, Table, BookOpen } from 'lucide-react';
import { COPTIC_TENSES, SAMPLE_BIBLICAL_VERBS, conjugateCopticVerb } from '../utils/copticGrammar';
import { playSynthesizedCoptic } from '../utils/audio';

interface CopticGrammarModalProps {
  onClose: () => void;
  initialVerb?: string;
  isArabicUi?: boolean;
}

export const CopticGrammarModal: React.FC<CopticGrammarModalProps> = ({
  onClose,
  initialVerb = 'ⲥⲁϫⲓ',
  isArabicUi = false
}) => {
  const [selectedVerb, setSelectedVerb] = useState<string>(initialVerb);
  const [customInput, setCustomInput] = useState<string>('');
  const [dialect, setDialect] = useState<'B' | 'S'>('B');
  const [selectedTense, setSelectedTense] = useState<string>('present1');
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  const activeVerbLemma = customInput.trim() || selectedVerb;
  const conjugationResult = conjugateCopticVerb(activeVerbLemma, selectedTense, dialect);

  const handleCopyCell = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCell(id);
    setTimeout(() => setCopiedCell(null), 1500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container grammar-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="grammar-modal-header">
          <div className="grammar-title-group">
            <div className="grammar-icon-box">
              <Table size={24} color="#f59e0b" />
            </div>
            <div>
              <h2>{isArabicUi ? 'قواعد وتصاريف الأفعال القبطية' : 'Interactive Coptic Verb Conjugator'}</h2>
              <p>{isArabicUi ? 'تطبيق تفاعلي لتوليد تصاريف الأفعال في اللهجتين البحيرية والصعيدية' : 'Full verb paradigm generator across Bohairic & Sahidic tenses'}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="grammar-controls-bar">
          {/* Verb Selector & Custom Search */}
          <div className="grammar-verb-picker">
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {isArabicUi ? 'اختر الفعل:' : 'Select Verb:'}
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {SAMPLE_BIBLICAL_VERBS.map(verb => (
                <button
                  key={verb.lemma}
                  type="button"
                  className={`grammar-verb-pill ${selectedVerb === verb.lemma && !customInput ? 'active' : ''}`}
                  onClick={() => { setSelectedVerb(verb.lemma); setCustomInput(''); }}
                >
                  <span className="coptic-font">{verb.lemma}</span>
                  <span className="verb-translation-hint">({isArabicUi ? verb.ar : verb.en})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                className="grammar-search-input coptic-font"
                placeholder={isArabicUi ? 'أو أدخل أي جذر فعل قبطي (مثال: ⲥⲱⲧⲙ)...' : 'Or type any custom Coptic verb stem (e.g. ⲥⲱⲧⲙ)...'}
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
              />
              <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>

            {/* Dialect Switcher */}
            <div className="grammar-dialect-toggle">
              <button
                type="button"
                className={`dialect-btn ${dialect === 'B' ? 'active' : ''}`}
                onClick={() => setDialect('B')}
              >
                Ϧ {isArabicUi ? 'بحيري' : 'Bohairic'}
              </button>
              <button
                type="button"
                className={`dialect-btn ${dialect === 'S' ? 'active' : ''}`}
                onClick={() => setDialect('S')}
              >
                Ϩ {isArabicUi ? 'صعيدي' : 'Sahidic'}
              </button>
            </div>
          </div>

          {/* Tense Filter Tabs */}
          <div className="grammar-tense-tabs">
            {COPTIC_TENSES.map(tense => (
              <button
                key={tense.id}
                type="button"
                className={`tense-tab-btn ${selectedTense === tense.id ? 'active' : ''}`}
                onClick={() => setSelectedTense(tense.id)}
              >
                <Layers size={14} />
                <span>{isArabicUi ? tense.ar : tense.en}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body: Conjugation Paradigm Table */}
        <div className="grammar-modal-body">
          {conjugationResult && (
            <div className="grammar-matrix-card">
              <div className="grammar-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#f59e0b" />
                  <h3 className="coptic-font" style={{ margin: 0, fontSize: '24px', color: '#f59e0b' }}>
                    {conjugationResult.verbLemma}
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    ({isArabicUi ? conjugationResult.translationAr : conjugationResult.translationEn})
                  </span>
                </div>
                <span className="grammar-dialect-badge">
                  {dialect === 'B' ? 'Ϧ Bohairic' : 'Ϩ Sahidic'} • {isArabicUi ? conjugationResult.tenseAr : conjugationResult.tenseEn}
                </span>
              </div>

              {/* Grid Table */}
              <div className="grammar-table-wrapper">
                <table className="grammar-matrix-table">
                  <thead>
                    <tr>
                      <th>{isArabicUi ? 'الضمير والفاعل' : 'Grammatical Person'}</th>
                      <th>{isArabicUi ? 'الصيغة المصرفة' : 'Conjugated Coptic Form'}</th>
                      <th>{isArabicUi ? 'النطق والنسخ' : 'Phonetic Transliteration'}</th>
                      <th>{isArabicUi ? 'استماع ونقحرة' : 'Audio & Copy'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conjugationResult.forms.map((form) => (
                      <tr key={form.personKey} className="grammar-table-row">
                        <td className="grammar-person-cell">
                          <strong>{isArabicUi ? form.personAr : form.personEn}</strong>
                        </td>
                        <td className="grammar-coptic-cell coptic-font">
                          <span className="coptic-verb-highlight">{form.copticForm}</span>
                        </td>
                        <td className="grammar-phonetic-cell">
                          <span>{form.phonetic}</span>
                        </td>
                        <td className="grammar-actions-cell">
                          <button
                            type="button"
                            className="btn-icon-small"
                            onClick={() => playSynthesizedCoptic(form.copticForm, dialect)}
                            title="Play Audio Pronunciation"
                          >
                            <Volume2 size={16} color="#f59e0b" />
                          </button>
                          <button
                            type="button"
                            className="btn-icon-small"
                            onClick={() => handleCopyCell(form.copticForm, form.personKey)}
                            title="Copy Form"
                          >
                            {copiedCell === form.personKey ? (
                              <Check size={16} color="#10b981" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
