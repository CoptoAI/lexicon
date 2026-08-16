import React, { useState } from 'react';
import { DictionaryEntry, Sense, FormItem, EgyptianEtymology, InflectionParadigm, ManuscriptCitation } from '../types/dictionary';
import { DIALECT_DESCRIPTIONS, POS_DESCRIPTIONS } from '../utils/coptic';
import { playSynthesizedCoptic } from '../utils/audio';
import { exportAnkiDeck } from '../services/api';
import { X, Copy, Check, ExternalLink, Share2, Sparkles, BookOpen, Volume2, Download, Quote, ScrollText, Grid } from 'lucide-react';

interface EntryDetailModalProps {
  entry: DictionaryEntry | null;
  onClose: () => void;
  onViewNetwork: (word: string) => void;
  onSearchWord: (word: string) => void;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  entry,
  onClose,
  onViewNetwork,
  onSearchWord
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeDialectIpa, setActiveDialectIpa] = useState<'S' | 'B'>('S');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'dialects'>('details');

  if (!entry) return null;

  const parseJsonSafe = <T,>(jsonStr?: string, fallback: T | null = null): T | null => {
    if (!jsonStr) return fallback;
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      return fallback;
    }
  };

  const enSenses = parseJsonSafe<Sense[]>(entry.en_json, []) || [];
  const deSenses = parseJsonSafe<Sense[]>(entry.de_json, []) || [];
  const frSenses = parseJsonSafe<Sense[]>(entry.fr_json, []) || [];
  const forms = parseJsonSafe<FormItem[]>(entry.forms_json, []) || [];
  const egyptianRoot = parseJsonSafe<EgyptianEtymology>(entry.egyptian_json, null);
  const inflectionParadigm = parseJsonSafe<InflectionParadigm>(entry.inflection_json, null);
  const citations = parseJsonSafe<ManuscriptCitation[]>(entry.citations_json, []) || [];

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handlePlayAudio = (dialect: 'S' | 'B') => {
    setIsPlayingAudio(true);
    playSynthesizedCoptic(entry.coptic_name, dialect);
    setTimeout(() => setIsPlayingAudio(false), 1000);
  };

  const handleCopyBibtex = () => {
    const bibtex = `@misc{cdo_${entry.xml_id},
  title = {${entry.coptic_name} - Comprehensive Coptic Lexicon Entry ${entry.xml_id}},
  author = {Burns, Dylan and Feder, Frank and John, Katrin and Kupreyev, Maxim},
  publisher = {Coptic Dictionary Online, BBAW, DDGLC, Coptic Scriptorium},
  url = {https://coptic-dictionary.pages.dev/entry.py?tla=${entry.xml_id}},
  year = {2026}
}`;
    handleCopy(bibtex, 'bibtex');
  };

  const posDesc = POS_DESCRIPTIONS[entry.pos] || entry.pos;

  // Build dialect matrix mapping
  const dialectMatrix: Record<string, string[]> = {
    S: [],
    B: [],
    F: [],
    A: [],
    L: [],
    M: []
  };

  forms.forEach((f) => {
    if (f.dialect && dialectMatrix[f.dialect] !== undefined) {
      if (!dialectMatrix[f.dialect].includes(f.orth)) {
        dialectMatrix[f.dialect].push(f.orth);
      }
    }
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Headword Section */}
        <div className="detail-headword-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="detail-coptic-title">{entry.coptic_name}</div>
            <button
              className={`btn-icon ${isPlayingAudio ? 'active' : ''}`}
              style={{
                borderRadius: '50%',
                background: isPlayingAudio ? 'var(--accent-gold)' : 'var(--bg-surface-elevated)',
                color: isPlayingAudio ? '#0c0f17' : 'var(--accent-gold)',
                transform: isPlayingAudio ? 'scale(1.15)' : 'none',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handlePlayAudio(activeDialectIpa)}
              title="Play Pronunciation"
            >
              <Volume2 size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="entry-pos-badge" title={posDesc}>
              {entry.pos} – {posDesc}
            </span>

            {entry.origin === 'greek' ? (
              <span className="dialect-tag" style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#818cf8' }}>
                🏛️ Greek Loanword (DDGLC)
              </span>
            ) : (
              <span className="dialect-tag" style={{ borderColor: 'rgba(212, 175, 55, 0.4)', color: 'var(--accent-gold)' }}>
                🏺 Egyptian Heritage (BBAW)
              </span>
            )}

            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              TLA ID: {entry.xml_id}
            </span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              className="btn-nav"
              onClick={() => handleCopy(entry.coptic_name, 'word')}
              title="Copy Coptic Word"
            >
              {copied === 'word' ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
              <span>{copied === 'word' ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              className="btn-nav"
              onClick={handleCopyBibtex}
              title="Copy BibTeX Academic Citation"
            >
              {copied === 'bibtex' ? <Check size={14} color="var(--accent-emerald)" /> : <Quote size={14} />}
              <span>{copied === 'bibtex' ? 'BibTeX Copied' : 'Cite'}</span>
            </button>

            <button
              className="btn-nav"
              onClick={() => exportAnkiDeck([entry], `coptic_${entry.coptic_name}.csv`)}
              title="Export entry to Anki Flashcard CSV"
            >
              <Download size={14} color="var(--accent-gold)" />
              <span>Anki</span>
            </button>

            <button
              className="btn-nav"
              onClick={() => {
                onClose();
                onViewNetwork(entry.coptic_name);
              }}
              title="View Word Collocation Network Graph"
            >
              <Share2 size={14} />
              <span>Network</span>
            </button>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
          <button
            className={`btn-nav ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <BookOpen size={14} />
            <span>Lexicon &amp; Grammar</span>
          </button>
          <button
            className={`btn-nav ${activeTab === 'dialects' ? 'active' : ''}`}
            onClick={() => setActiveTab('dialects')}
          >
            <Grid size={14} />
            <span>Dialect Comparison Matrix</span>
          </button>
        </div>

        {activeTab === 'dialects' ? (
          /* Multi-Dialect Comparison Matrix View */
          <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '18px 20px' }}>
            <h3 style={{ fontSize: '15px', color: 'var(--accent-gold)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Grid size={16} />
              <span>Comparative Dialectal Distribution</span>
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Orthographic variations attested across major Coptic literary and regional traditions:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              {Object.entries(dialectMatrix).map(([code, attestedForms]) => {
                const dial = DIALECT_DESCRIPTIONS[code];
                return (
                  <div
                    key={code}
                    style={{
                      background: 'var(--bg-surface)',
                      border: `1px solid ${dial?.color ? dial.color + '44' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 'bold', color: dial?.color || 'var(--text-primary)', fontSize: '13px' }}>
                        {code} – {dial?.name || code}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {attestedForms.length} forms
                      </span>
                    </div>
                    {attestedForms.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                        {attestedForms.map((form, i) => (
                          <span
                            key={i}
                            style={{
                              fontFamily: 'var(--font-coptic)',
                              fontSize: '16px',
                              background: 'var(--bg-surface-elevated)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-subtle)'
                            }}
                          >
                            {form}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No direct dialect forms attested in lexicon
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Standard Details View */
          <>
            {/* IPA Pronunciation bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-surface-elevated)', padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: '13px', flexWrap: 'wrap' }}>
              <strong style={{ color: 'var(--accent-gold)' }}>IPA Phonetics &amp; Audio:</strong>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  className={`btn-nav ${activeDialectIpa === 'S' ? 'active' : ''}`}
                  style={{ padding: '3px 10px', fontSize: '12px' }}
                  onClick={() => {
                    setActiveDialectIpa('S');
                    handlePlayAudio('S');
                  }}
                >
                  <Volume2 size={13} />
                  <span>Sahidic: <code style={{ fontFamily: 'monospace' }}>{entry.ipa_sahidic || '/--/'}</code></span>
                </button>
                <button
                  className={`btn-nav ${activeDialectIpa === 'B' ? 'active' : ''}`}
                  style={{ padding: '3px 10px', fontSize: '12px' }}
                  onClick={() => {
                    setActiveDialectIpa('B');
                    handlePlayAudio('B');
                  }}
                >
                  <Volume2 size={13} />
                  <span>Bohairic: <code style={{ fontFamily: 'monospace' }}>{entry.ipa_bohairic || '/--/'}</code></span>
                </button>
              </div>
            </div>

            {/* Ancient Egyptian & Demotic Origin Card (if attested) */}
            {egyptianRoot && (
              <div style={{ background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(21, 26, 36, 0.95))', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="var(--accent-gold)" />
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--accent-gold)', margin: 0 }}>
                      Ancient Egyptian &amp; Demotic Root
                    </h3>
                  </div>
                  {egyptianRoot.tla_link && (
                    <a
                      href={egyptianRoot.tla_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-nav"
                      style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex' }}
                    >
                      <span>TLA Egyptian Lexicon</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '13px' }}>
                  {egyptianRoot.egy_lemma && (
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Hieroglyphic / Hieratic Transliteration:</div>
                      <div style={{ fontFamily: 'serif', fontSize: '17px', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '2px' }}>
                        {egyptianRoot.egy_lemma}
                      </div>
                      {egyptianRoot.egy_num && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TLA Lemma No: {egyptianRoot.egy_num}</div>
                      )}
                    </div>
                  )}

                  {egyptianRoot.demo_lemma && (
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Demotic Root &amp; Transliteration:</div>
                      <div style={{ fontFamily: 'serif', fontSize: '17px', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '2px' }}>
                        {egyptianRoot.demo_lemma}
                      </div>
                      {egyptianRoot.demo_num && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Demotic ID: {egyptianRoot.demo_num}</div>
                      )}
                    </div>
                  )}

                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Ancient Meaning:</div>
                    <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>
                      {egyptianRoot.english || egyptianRoot.german || '&ndash;'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Morphological Conjugation / Inflection Paradigm Table (if available) */}
            {inflectionParadigm && (
              <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px 20px' }}>
                <div className="detail-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={16} />
                  <span>Morphological Conjugation &amp; Inflection Paradigm</span>
                </div>
                <table className="forms-table" style={{ marginTop: '8px' }}>
                  <thead>
                    <tr>
                      <th>Infinitive</th>
                      <th>Nominal State (Prenominal <code>-</code>)</th>
                      <th>Pronominal State (Prepronominal <code>⸗</code>)</th>
                      <th>Qualitative / Stative (<code>+</code>)</th>
                      <th>Imperative</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="form-coptic">{inflectionParadigm.lemma}</td>
                      <td className="form-coptic">{inflectionParadigm.prenominal || '&ndash;'}</td>
                      <td className="form-coptic">{inflectionParadigm.prepronominal || '&ndash;'}</td>
                      <td className="form-coptic">{inflectionParadigm.stative || '&ndash;'}</td>
                      <td className="form-coptic">{inflectionParadigm.imperative || '&ndash;'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Definitions Section */}
            <div>
              <div className="detail-section-title">Definitions &amp; Lexicon Senses</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {enSenses.length > 0 && (
                  <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
                    <strong style={{ color: 'var(--accent-blue)', fontSize: '12px', textTransform: 'uppercase' }}>English:</strong>
                    <ol style={{ paddingLeft: '20px', marginTop: '6px', fontSize: '14px' }}>
                      {enSenses.map((s, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>
                          <span>{s.definition}</span>
                          {s.citations?.length > 0 && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: '6px' }}>
                              [{s.citations.join('; ')}]
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {deSenses.length > 0 && (
                  <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
                    <strong style={{ color: 'var(--accent-amber)', fontSize: '12px', textTransform: 'uppercase' }}>Deutsch (German):</strong>
                    <ol style={{ paddingLeft: '20px', marginTop: '6px', fontSize: '14px' }}>
                      {deSenses.map((s, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>
                          <span>{s.definition}</span>
                          {s.citations?.length > 0 && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: '6px' }}>
                              [{s.citations.join('; ')}]
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {frSenses.length > 0 && (
                  <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
                    <strong style={{ color: 'var(--accent-emerald)', fontSize: '12px', textTransform: 'uppercase' }}>Français (French):</strong>
                    <ol style={{ paddingLeft: '20px', marginTop: '6px', fontSize: '14px' }}>
                      {frSenses.map((s, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>
                          <span>{s.definition}</span>
                          {s.citations?.length > 0 && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: '6px' }}>
                              [{s.citations.join('; ')}]
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* Manuscript Citations from Coptic Scriptorium */}
            {citations.length > 0 && (
              <div>
                <div className="detail-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ScrollText size={16} />
                  <span>Attested Manuscript Citations ({citations.length})</span>
                </div>
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '14px 16px', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {citations.map((c, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: idx < citations.length - 1 ? '1px solid var(--border-subtle)' : 'none', paddingBottom: '8px', fontSize: '13px' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>{c.urn}</span>
                        {c.chapter && <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>Chapter {c.chapter}</span>}
                        {c.verse && <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>Verse {c.verse}</span>}
                        {c.notes && <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: '8px', fontStyle: 'italic' }}>({c.notes})</span>}
                      </div>
                      <a
                        href={`https://data.copticscriptorium.org/urn/${encodeURIComponent(c.urn)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-nav"
                        style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex' }}
                      >
                        <span>View Manuscript</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attested Dialectal Forms Table */}
            {forms.length > 0 && (
              <div>
                <div className="detail-section-title">Attested Dialectal Forms ({forms.length})</div>
                <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <table className="forms-table">
                    <thead>
                      <tr>
                        <th>Form</th>
                        <th>Dialect</th>
                        <th>Form ID</th>
                        <th>Grammar / Notes</th>
                        <th>Attestation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forms.map((f, idx) => {
                        const dialInfo = DIALECT_DESCRIPTIONS[f.dialect];
                        const annisQuery = `https://tools.copticscriptorium.org/annis/#_q=${encodeURIComponent(`pos="${entry.pos}" & norm="${f.orth}"`)}`;
                        return (
                          <tr key={idx}>
                            <td className="form-coptic">{f.orth}</td>
                            <td>
                              {f.dialect ? (
                                <span
                                  className="dialect-tag"
                                  title={dialInfo?.name || f.dialect}
                                  style={{ borderColor: dialInfo?.color ? `${dialInfo.color}88` : undefined }}
                                >
                                  {f.dialect} – {dialInfo?.name || f.dialect}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>&ndash;</span>
                              )}
                            </td>
                            <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                              {f.form_id || '&ndash;'}
                            </td>
                            <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {f.gram || '&ndash;'}
                            </td>
                            <td>
                              <a
                                href={annisQuery}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-nav"
                                style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex' }}
                                title="Search attestation in Coptic Scriptorium corpus"
                              >
                                <span>Corpus</span>
                                <ExternalLink size={11} />
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Greek Loanword & Cross-references */}
            {(entry.etym || entry.grk_id) && (
              <div>
                <div className="detail-section-title">Etymology &amp; Lexicon Cross-References</div>
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '14px 16px', borderRadius: 'var(--radius-sm)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {entry.etym && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Sparkles size={16} color="var(--accent-gold)" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <strong>Cross-references: </strong>
                        <span>
                          {entry.etym.split('#').map((part, i) => {
                            if (i % 2 === 1) {
                              return (
                                <span
                                  key={i}
                                  style={{ color: 'var(--accent-gold)', cursor: 'pointer', textDecoration: 'underline', margin: '0 2px', fontFamily: 'var(--font-coptic)', fontSize: '15px' }}
                                  onClick={() => {
                                    onClose();
                                    onSearchWord(part);
                                  }}
                                  title={`Search for related word "${part}"`}
                                >
                                  {part}
                                </span>
                              );
                            }
                            return <span key={i}>{part}</span>;
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  {entry.grk_id && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600 }}>Greek Loanword References:</span>
                      <a
                        href={`http://stephanus.tlg.uci.edu/lsj/#eid=${entry.grk_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-nav"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                      >
                        <span>Perseus Tufts LSJ #{entry.grk_id}</span>
                        <ExternalLink size={12} />
                      </a>
                      <a
                        href={`https://logeion.uchicago.edu/${encodeURIComponent(entry.coptic_name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-nav"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                      >
                        <span>Logeion (Chicago)</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
