import React, { useState, useEffect, useRef } from 'react';
import { DictionaryEntry, Sense, FormItem, EgyptianEtymology, InflectionParadigm, ManuscriptCitation } from '../types/dictionary';
import { DIALECT_DESCRIPTIONS, POS_DESCRIPTIONS } from '../utils/coptic';
import { playSynthesizedCoptic } from '../utils/audio';
import { exportAnkiDeck } from '../services/api';
import { isWordSaved, toggleSaveWord, subscribeSavedWords } from '../services/savedWords';
import { RichEtymology } from '../utils/richText';
import { ConcordanceViewer } from './ConcordanceViewer';
import { fetchConcordanceExamples, ManuscriptExample } from '../services/concordance';
import { useSwipeGesture } from '../utils/useSwipeGesture';
import { X, Copy, Check, ExternalLink, Share2, Sparkles, BookOpen, Volume2, Download, Quote, ScrollText, Grid, Bookmark, ArrowUp } from 'lucide-react';

interface EntryDetailModalProps {
  entry: DictionaryEntry | null;
  onClose: () => void;
  onViewNetwork: (word: string) => void;
  onSearchWord: (word: string) => void;
  isArabicUi?: boolean;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  entry,
  onClose,
  onViewNetwork,
  onSearchWord,
  isArabicUi = false
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeDialectIpa, setActiveDialectIpa] = useState<'S' | 'B'>('S');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'dialects' | 'concordance'>('details');
  const [concordanceExamples, setConcordanceExamples] = useState<ManuscriptExample[]>([]);
  const [isSaved, setIsSaved] = useState(entry ? isWordSaved(entry.id) : false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Mobile Touch Swipe-Down-To-Dismiss
  const { dragOffset, isDragging, touchHandlers } = useSwipeGesture({
    onSwipeDown: onClose,
    threshold: 90,
    enableVerticalDrag: true
  });

  useEffect(() => {
    if (!entry) return;
    setIsSaved(isWordSaved(entry.id));
    const unsub = subscribeSavedWords(() => {
      setIsSaved(isWordSaved(entry.id));
    });
    return unsub;
  }, [entry?.id]);

  useEffect(() => {
    if (!entry) return;
    let isMounted = true;
    fetchConcordanceExamples(entry.coptic_name).then((res) => {
      if (isMounted) setConcordanceExamples(res);
    });
    return () => {
      isMounted = false;
    };
  }, [entry?.coptic_name]);

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
  const arSenses = parseJsonSafe<Sense[]>(entry.ar_json, []) || [];
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
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(10); } catch (e) {}
    }
    setIsPlayingAudio(true);
    playSynthesizedCoptic(entry.coptic_name, dialect);
    setTimeout(() => setIsPlayingAudio(false), 1000);
  };

  const handleToggleSave = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(15); } catch (e) {}
    }
    toggleSaveWord(entry);
  };

  const handleNativeShare = async () => {
    const shareUrl = `https://lexicon.copto.org/?q=${encodeURIComponent(entry.coptic_name)}`;
    const shareText = `${entry.coptic_name} (${entry.pos}) — Comprehensive Coptic Lexicon`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `CoptoLex: ${entry.coptic_name}`,
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        handleCopy(shareUrl, 'share');
      }
    } else {
      handleCopy(shareUrl, 'share');
    }
  };

  const handleCopyBibtex = () => {
    const bibtex = `@misc{coptolex_${entry.xml_id},
  title = {${entry.coptic_name} - Comprehensive Coptic Lexicon Entry ${entry.xml_id}},
  author = {Burns, Dylan and Feder, Frank and John, Katrin and Kupreyev, Maxim and Copto.org},
  publisher = {CoptoLex, Copto.org, BBAW, DDGLC, Coptic Scriptorium},
  url = {https://lexicon.copto.org/?q=${encodeURIComponent(entry.coptic_name)}},
  year = {2026}
}`;
    handleCopy(bibtex, 'bibtex');
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setShowScrollTop(target.scrollTop > 240);
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
    <div className="modal-backdrop modal-backdrop-sheet" onClick={onClose}>
      <div
        className="modal-content modal-content-sheet detail-modal-wrapper"
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: isDragging && dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: isDragging && dragOffset > 40 ? Math.max(0.6, 1 - dragOffset / 400) : 1
        }}
      >
        {/* Mobile Swipe / Drag Handle */}
        <div
          className="sheet-drag-handle-touch-zone"
          {...touchHandlers}
        >
          <div className="sheet-drag-handle" />
        </div>

        <button className="modal-close-btn" onClick={onClose} aria-label="Close details">
          <X size={20} />
        </button>

        {/* Section 1: Hero Header (Headword + Metadata + Action Toolbar) */}
        <div className="detail-hero-card">
          <div className="detail-hero-top">
            <div className="detail-coptic-title-wrap">
              <span className="detail-coptic-title">{entry.coptic_name}</span>
              <button
                className={`btn-hero-audio ${isPlayingAudio ? 'active' : ''}`}
                onClick={() => handlePlayAudio(activeDialectIpa)}
                title="Play Coptic pronunciation"
                aria-label="Play Coptic pronunciation"
              >
                <Volume2 size={18} />
              </button>
            </div>

            {/* Metadata Chips */}
            <div className="detail-hero-meta">
              <span className="entry-pos-badge" title={posDesc}>
                {entry.pos} – {posDesc}
              </span>

              {entry.origin === 'greek' ? (
                <span className="dialect-tag origin-greek-tag">
                  🏛️ Greek Loanword (DDGLC)
                </span>
              ) : (
                <span className="dialect-tag origin-egyptian-tag">
                  🏺 Egyptian Heritage (BBAW)
                </span>
              )}

              <span className="detail-tla-id-badge">
                TLA ID: {entry.xml_id}
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="detail-action-toolbar">
            <button
              className={`btn-detail-action ${isSaved ? 'active' : ''}`}
              onClick={handleToggleSave}
              title={isSaved ? 'Remove from Saved' : 'Save for offline revision'}
            >
              <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              className="btn-detail-action"
              onClick={handleNativeShare}
              title="Share entry link"
            >
              {copied === 'share' ? <Check size={14} color="var(--accent-emerald)" /> : <Share2 size={14} />}
              <span>{copied === 'share' ? 'Copied' : 'Share'}</span>
            </button>

            <button
              className="btn-detail-action"
              onClick={() => handleCopy(entry.coptic_name, 'word')}
              title="Copy Coptic word"
            >
              {copied === 'word' ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
              <span>{copied === 'word' ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              className="btn-detail-action"
              onClick={handleCopyBibtex}
              title="Copy BibTeX academic citation"
            >
              {copied === 'bibtex' ? <Check size={14} color="var(--accent-emerald)" /> : <Quote size={14} />}
              <span>{copied === 'bibtex' ? 'BibTeX' : 'Cite'}</span>
            </button>

            <button
              className="btn-detail-action"
              onClick={() => exportAnkiDeck([entry], `coptic_${entry.coptic_name}.csv`)}
              title="Export entry to Anki Flashcard CSV"
            >
              <Download size={14} />
              <span>Anki</span>
            </button>

            <button
              className="btn-detail-action"
              onClick={() => {
                onClose();
                onViewNetwork(entry.coptic_name);
              }}
              title="View Word Collocation Network Graph"
            >
              <Grid size={14} />
              <span>Network</span>
            </button>
          </div>
        </div>

        {/* Section 2: Zero-Clipping Sticky Segmented Tabs */}
        <div className="detail-tabs-sticky-bar">
          <div className="detail-segmented-tabs">
            <button
              className={`detail-tab-btn ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              <BookOpen size={14} />
              <span>{isArabicUi ? 'المعجم وقواعد اللغة' : 'Lexicon & Grammar'}</span>
            </button>
            <button
              className={`detail-tab-btn ${activeTab === 'dialects' ? 'active' : ''}`}
              onClick={() => setActiveTab('dialects')}
            >
              <Grid size={14} />
              <span>{isArabicUi ? 'مصفوفة اللهجات' : 'Dialect Matrix'}</span>
            </button>
            <button
              className={`detail-tab-btn ${activeTab === 'concordance' ? 'active' : ''}`}
              onClick={() => setActiveTab('concordance')}
            >
              <ScrollText size={14} />
              <span>{isArabicUi ? 'شواهد المخطوطات' : 'Manuscripts'}</span>
              {concordanceExamples.length > 0 && (
                <span className="concordance-mini-badge">{concordanceExamples.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Full Concordance Citations */}
        {activeTab === 'concordance' && (
          <div className="detail-tab-pane">
            <ConcordanceViewer
              coptic_name={entry.coptic_name}
              xml_id={entry.xml_id}
              isArabicUi={isArabicUi}
            />
          </div>
        )}

        {/* Tab 2: Dialect Matrix Grid */}
        {activeTab === 'dialects' && (
          <div className="detail-tab-pane">
            <div className="detail-section-card">
              <h3 className="detail-pane-heading">
                Coptic Dialect Attestation &amp; Orthographic Matrix
              </h3>
              <p className="detail-pane-subheading">
                Phonological variations attested across early Sahidic, Bohairic, Akhmimic, Fayyumic, Lycopolitan, and Mesokemic manuscripts:
              </p>

              <div className="dialect-matrix-grid">
                {Object.entries(DIALECT_DESCRIPTIONS).map(([siglum, desc]) => {
                  const attestedForms = dialectMatrix[siglum] || [];
                  const isAttested = attestedForms.length > 0 || (entry.dialects && entry.dialects.includes(siglum));

                  return (
                    <div
                      key={siglum}
                      className={`dialect-card ${isAttested ? 'attested' : 'unattested'}`}
                      style={{ borderLeftColor: desc.color }}
                    >
                      <div className="dialect-card-header">
                        <div>
                          <strong style={{ color: desc.color, fontSize: '15px' }}>{siglum}</strong>
                          <span style={{ fontSize: '13px', marginLeft: '6px', fontWeight: 600 }}>{desc.name}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{desc.region}</span>
                      </div>

                      <div className="dialect-card-body">
                        {attestedForms.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                            {attestedForms.map((orth, i) => (
                              <span key={i} className="coptic-tag-pill">
                                {orth}
                              </span>
                            ))}
                          </div>
                        ) : isAttested ? (
                          <span style={{ fontSize: '12px', color: 'var(--accent-gold)' }}>Attested in corpus</span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No direct attestation</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Core Lexicon Details */}
        {activeTab === 'details' && (
          <div className="detail-tab-pane">
            {/* Arabic Definition Box */}
            {arSenses.length > 0 && (
              <div className="detail-lang-card detail-arabic-card">
                <div className="detail-lang-header">
                  <span className="arabic-badge">العربية (المعنى والترجمة)</span>
                  <button
                    className="btn-copy-mini"
                    onClick={() => handleCopy(arSenses.map(s => s.definition).join('; '), 'ar')}
                    title="نسخ المعنى العربي"
                  >
                    {copied === 'ar' ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                    <span>{copied === 'ar' ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
                <div className="detail-senses-list">
                  {arSenses.map((s, idx) => (
                    <div key={idx} className="detail-sense-row-ar">
                      <span className="detail-sense-num-ar">{idx + 1}.</span>
                      <div className="detail-sense-content-ar">
                        <span className="detail-def-text-ar">{s.definition}</span>
                        {s.citations && s.citations.length > 0 && (
                          <div className="detail-citations-chip-ar">
                            <span>الشواهد: {s.citations.join(' • ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* English Definitions */}
            {enSenses.length > 0 && (
              <div className="detail-lang-card detail-english-card">
                <div className="detail-lang-header">
                  <span className="detail-lang-badge en-badge">English Definitions &amp; Senses</span>
                  <button
                    className="btn-copy-mini"
                    onClick={() => handleCopy(enSenses.map(s => s.definition).join('; '), 'en')}
                    title="Copy English definitions"
                  >
                    {copied === 'en' ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                    <span>{copied === 'en' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="detail-senses-list">
                  {enSenses.map((s, idx) => (
                    <div key={idx} className="detail-sense-row">
                      <span className="detail-sense-num">{idx + 1}.</span>
                      <div className="detail-sense-content">
                        <span className="detail-def-text">{s.definition}</span>
                        {s.citations && s.citations.length > 0 && (
                          <span className="detail-citations-inline">
                            ({s.citations.join('; ')})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* German & French Translations Grid */}
            {(deSenses.length > 0 || frSenses.length > 0) && (
              <div className="detail-lang-grid-2col">
                {deSenses.length > 0 && (
                  <div className="detail-lang-card">
                    <div className="detail-lang-header">
                      <span className="detail-lang-badge de-badge">German (Deutsch)</span>
                    </div>
                    <div className="detail-senses-list">
                      {deSenses.map((s, idx) => (
                        <div key={idx} className="detail-sense-row">
                          <span className="detail-sense-num">{idx + 1}.</span>
                          <div className="detail-sense-content">
                            <span className="detail-def-text">{s.definition}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {frSenses.length > 0 && (
                  <div className="detail-lang-card">
                    <div className="detail-lang-header">
                      <span className="detail-lang-badge fr-badge">French (Français)</span>
                    </div>
                    <div className="detail-senses-list">
                      {frSenses.map((s, idx) => (
                        <div key={idx} className="detail-sense-row">
                          <span className="detail-sense-num">{idx + 1}.</span>
                          <div className="detail-sense-content">
                            <span className="detail-def-text">{s.definition}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Phonetic Pronunciation Matrix */}
            <div className="detail-section-block">
              <div className="detail-section-title">IPA Phonetic Pronunciations</div>
              <div className="detail-ipa-grid">
                <div
                  className={`detail-ipa-card ${activeDialectIpa === 'S' ? 'active' : ''}`}
                  onClick={() => setActiveDialectIpa('S')}
                >
                  <div className="detail-ipa-card-top">
                    <span className="detail-ipa-label">Sahidic (Late Classical)</span>
                    <button
                      className="btn-ipa-play"
                      onClick={(e) => { e.stopPropagation(); handlePlayAudio('S'); }}
                      title="Play Sahidic pronunciation"
                    >
                      <Volume2 size={15} />
                    </button>
                  </div>
                  <div className="detail-ipa-transcription">{entry.ipa_sahidic || '/—/'}</div>
                </div>

                <div
                  className={`detail-ipa-card ${activeDialectIpa === 'B' ? 'active' : ''}`}
                  onClick={() => setActiveDialectIpa('B')}
                >
                  <div className="detail-ipa-card-top">
                    <span className="detail-ipa-label">Bohairic (Ecclesiastical)</span>
                    <button
                      className="btn-ipa-play"
                      onClick={(e) => { e.stopPropagation(); handlePlayAudio('B'); }}
                      title="Play Bohairic pronunciation"
                    >
                      <Volume2 size={15} />
                    </button>
                  </div>
                  <div className="detail-ipa-transcription">{entry.ipa_bohairic || '/—/'}</div>
                </div>
              </div>
            </div>

            {/* Ancient Egyptian & Demotic Root Heritage */}
            {egyptianRoot && (
              <div className="detail-section-block">
                <div className="detail-section-title">Egyptian Ancestry &amp; Hieroglyphic Root</div>
                <div className="egyptian-heritage-card">
                  <div className="egyptian-header">
                    <Sparkles size={18} color="var(--accent-gold)" />
                    <strong>Egyptian Root: {egyptianRoot.egy_lemma || egyptianRoot.demo_lemma || egyptianRoot.tla}</strong>
                  </div>
                  <div className="egyptian-meta-grid">
                    {egyptianRoot.egy_num && (
                      <div>
                        <span className="egyptian-meta-label">TLA Hieroglyphic ID</span>
                        <span className="hieroglyph-text" style={{ fontSize: '16px', fontWeight: 600 }}>{egyptianRoot.egy_num}</span>
                      </div>
                    )}
                    {egyptianRoot.demo_lemma && (
                      <div>
                        <span className="egyptian-meta-label">Demotic Root</span>
                        <strong>{egyptianRoot.demo_lemma} {egyptianRoot.demo_num ? `(#${egyptianRoot.demo_num})` : ''}</strong>
                      </div>
                    )}
                    {(egyptianRoot.english || egyptianRoot.german) && (
                      <div>
                        <span className="egyptian-meta-label">Root Meaning</span>
                        <span>{egyptianRoot.english || egyptianRoot.german}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Attested Morphological Forms Table */}
            {forms.length > 0 && (
              <div className="detail-section-block">
                <div className="detail-section-title">Attested Morphological Forms ({forms.length})</div>
                <div className="table-responsive-wrapper">
                  <table className="forms-table">
                    <thead>
                      <tr>
                        <th>Orthography</th>
                        <th>Dialect</th>
                        <th>ID</th>
                        <th>Grammar</th>
                        <th>Corpus Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forms.map((f, idx) => {
                        const annisQuery = `https://corpling.uis.georgetown.edu/coptic-annis/?q=${encodeURIComponent(`norm="${f.orth}"`)}`;
                        return (
                          <tr key={idx}>
                            <td className="coptic-font" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-coptic)' }}>
                              {f.orth}
                            </td>
                            <td>
                              <span className="dialect-tag" style={{ borderColor: DIALECT_DESCRIPTIONS[f.dialect || '']?.color ? `${DIALECT_DESCRIPTIONS[f.dialect || '']?.color}88` : undefined }}>
                                {f.dialect || 'Any'}
                              </span>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                              {f.form_id || '—'}
                            </td>
                            <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {f.gram || '—'}
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
              <div className="detail-section-block">
                <div className="detail-section-title">Etymology &amp; Lexicon Cross-References</div>
                <div className="detail-etym-box">
                  {entry.etym && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Sparkles size={16} color="var(--accent-gold)" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <strong style={{ marginRight: '6px' }}>Cross-references:</strong>
                        <RichEtymology etym={entry.etym} onSearchWord={(word) => {
                          onClose();
                          onSearchWord(word);
                        }} />
                      </div>
                    </div>
                  )}

                  {entry.grk_id && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
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
          </div>
        )}

        {/* Floating Scroll to Top Button */}
        {showScrollTop && (
          <button
            className="floating-scroll-top-btn"
            onClick={scrollToTop}
            aria-label="Scroll to top of entry"
          >
            <ArrowUp size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
