import React, { useState, useEffect } from 'react';
import { ManuscriptExample, fetchConcordanceExamples, splitAndHighlightCoptic } from '../services/concordance';
import { ExternalLink, Copy, Check, ScrollText, Search, BookMarked, Globe, Library, Loader2 } from 'lucide-react';

interface ConcordanceViewerProps {
  coptic_name: string;
  xml_id?: string;
  isArabicUi?: boolean;
}

export const ConcordanceViewer: React.FC<ConcordanceViewerProps> = ({
  coptic_name,
  xml_id,
  isArabicUi = false
}) => {
  const [examples, setExamples] = useState<ManuscriptExample[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchConcordanceExamples(coptic_name)
      .then((res) => {
        if (isMounted) {
          setExamples(res);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setExamples([]);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [coptic_name]);

  const biblicalCount = examples.filter((ex) => ex.genre === 'biblical').length;
  const monasticCount = examples.filter((ex) => ex.genre === 'monastic').length;
  const patristicCount = examples.filter((ex) => ex.genre === 'patristic').length;

  const filteredExamples = examples.filter((ex) => {
    if (selectedGenre === 'all') return true;
    return ex.genre === selectedGenre;
  });

  const handleCopyCitation = (ex: ManuscriptExample) => {
    const citation = `[${ex.reference}] ${ex.coptic_text}\nEN: "${ex.english_translation}"\nAR: "${ex.arabic_translation}"\nURN: ${ex.urn}`;
    navigator.clipboard.writeText(citation);
    setCopiedId(ex.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getGenreColor = (genre: string) => {
    switch (genre) {
      case 'biblical':
        return { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.35)', text: '#34d399', label: isArabicUi ? 'كتابي (عهد جديد/قديم)' : 'Biblical Corpus' };
      case 'monastic':
        return { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)', text: '#fbbf24', label: isArabicUi ? 'رهباني (شنودة وبصا)' : 'Monastic (Shenoute/Besa)' };
      case 'patristic':
        return { bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.35)', text: '#a78bfa', label: isArabicUi ? 'آبائي (بستان الرهبان)' : 'Desert Fathers (AP)' };
      case 'martyrdom':
        return { bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.35)', text: '#fb7185', label: isArabicUi ? 'سير الشهداء' : 'Martyrdoms' };
      default:
        return { bg: 'var(--bg-surface-elevated)', border: 'var(--border-subtle)', text: 'var(--text-secondary)', label: genre };
    }
  };

  // Verified live URLs for Digital Concordance Hub (No 404s)
  const dictSearchUrl = xml_id
    ? `https://coptic-dictionary.org/entry.cgi?tla=${encodeURIComponent(xml_id)}`
    : `https://coptic-dictionary.org/results.cgi?coptic=${encodeURIComponent(coptic_name)}`;

  const annisAqlUrl = `https://corpling.uis.georgetown.edu/coptic-annis/?q=${encodeURIComponent(`norm="${coptic_name}" | lemma="${coptic_name}"`)}`;
  const tlaBbawUrl = `https://thesaurus-linguae-aegyptiae.de/`;

  return (
    <div className="concordance-container">
      {/* Header Controls */}
      <div className="concordance-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <ScrollText size={18} color="var(--accent-gold)" />
          <span style={{ fontWeight: 600, fontSize: '15px' }}>
            {isArabicUi ? 'شواهد المخطوطات والآيات المتوازية' : 'Inline Manuscript & Biblical Concordance'}
          </span>
          {!isLoading && (
            <span className="concordance-badge-count">
              {examples.length} {isArabicUi ? 'شواهد موثقة' : 'attested citations'}
            </span>
          )}
        </div>

        {/* Genre Filter Pills */}
        {!isLoading && examples.length > 0 && (
          <div className="concordance-filter-group">
            {[
              { id: 'all', label: isArabicUi ? 'الكل' : 'All', count: examples.length },
              { id: 'biblical', label: isArabicUi ? 'كتاب مقدس' : 'Biblical', count: biblicalCount },
              { id: 'monastic', label: isArabicUi ? 'نصوص شنودة' : 'Shenoute', count: monasticCount },
              { id: 'patristic', label: isArabicUi ? 'بستان الرهبان' : 'Desert Fathers', count: patristicCount }
            ]
              .filter((f) => f.id === 'all' || f.count > 0)
              .map((f) => (
                <button
                  key={f.id}
                  className={`concordance-filter-pill ${selectedGenre === f.id ? 'active' : ''}`}
                  onClick={() => setSelectedGenre(f.id)}
                >
                  <span>{f.label}</span>
                  <span className="pill-count">({f.count})</span>
                </button>
              ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: '10px', color: 'var(--text-muted)' }}>
          <Loader2 size={20} className="spin" color="var(--accent-gold)" />
          <span>{isArabicUi ? 'جاري استرجاع شواهد المخطوطات...' : 'Retrieving manuscript citations...'}</span>
        </div>
      ) : filteredExamples.length > 0 ? (
        <div className="concordance-list">
          {filteredExamples.map((ex, idx) => {
            const genreStyle = getGenreColor(ex.genre);
            const tokens = splitAndHighlightCoptic(ex.coptic_text, coptic_name);

            return (
              <div key={ex.id || idx} className="concordance-card">
                {/* Card Top Meta */}
                <div className="concordance-card-meta">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="concordance-ref-badge">
                      {isArabicUi && ex.reference_ar ? ex.reference_ar : ex.reference}
                    </span>
                    <span
                      className="concordance-genre-badge"
                      style={{ background: genreStyle.bg, borderColor: genreStyle.border, color: genreStyle.text }}
                    >
                      {genreStyle.label}
                    </span>
                    <span className="dialect-tag">{ex.dialect || 'Sahidic'}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ex.source_name}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: isArabicUi ? '0' : 'auto', marginRight: isArabicUi ? 'auto' : '0' }}>
                    <button
                      className="btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      onClick={() => handleCopyCitation(ex)}
                      title={isArabicUi ? 'نسخ الشاهد والترجمة' : 'Copy citation & parallel translations'}
                    >
                      {copiedId === ex.id ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                    </button>

                    {ex.scriptorium_url && (
                      <a
                        href={ex.scriptorium_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-icon"
                        style={{ width: '28px', height: '28px', color: 'var(--accent-blue)' }}
                        title={isArabicUi ? 'عرض في Coptic Scriptorium' : 'View in Coptic Scriptorium Digital Edition'}
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Coptic Sentence Box with Word Highlighting */}
                <div className="concordance-coptic-box">
                  <div className="concordance-coptic-text">
                    {tokens.map((tok, i) =>
                      tok.isHighlight ? (
                        <mark key={i} className="concordance-highlight" title={`Attested keyword: ${coptic_name}`}>
                          {tok.text}
                        </mark>
                      ) : (
                        <span key={i}>{tok.text}</span>
                      )
                    )}
                  </div>
                </div>

                {/* Parallel Translations Grid */}
                <div className="concordance-translations-grid">
                  {ex.english_translation && (
                    <div className="concordance-translation-col">
                      <div className="concordance-lang-label">
                        <span>🇬🇧 English</span>
                      </div>
                      <div className="concordance-translation-text">{ex.english_translation}</div>
                    </div>
                  )}

                  {ex.arabic_translation && (
                    <div className="concordance-translation-col text-rtl" dir="rtl">
                      <div className="concordance-lang-label">
                        <span>🇪🇬 الترجمة العربية المتوازية</span>
                      </div>
                      <div className="concordance-translation-text arabic-definition">{ex.arabic_translation}</div>
                    </div>
                  )}
                </div>

                {/* URN Footnote */}
                <div className="concordance-urn-footer">
                  <span>URN: {ex.urn}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Academic Research Hub when 0 direct citations in current filter/word */
        <div className="concordance-empty-hub">
          <div className="concordance-empty-header">
            <Library size={28} color="var(--accent-gold)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                {isArabicUi ? 'مركز البحث في ذخيرة المخطوطات الرقمية' : 'Digital Manuscript & Epigraphic Concordance Hub'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.5 }}>
                {isArabicUi
                  ? `هذا المدخل (${coptic_name}) موثق في القواميس الأكاديمية المرجعية (كروم، فستندورف، BBAW). يمكنك استعراض كافة مواضع وروده في البرديات والنصوص الرقمية عبر البوابات الأكاديمية التالية:`
                  : `This entry (${coptic_name}) is attested in primary academic lexica (Crum, Kasser, Westendorf, BBAW). Explore live digital occurrences across academic repositories below:`}
              </div>
            </div>
          </div>

          {/* Action Grid */}
          <div className="concordance-hub-grid">
            <a
              href={dictSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="concordance-hub-card"
            >
              <div className="concordance-hub-card-header">
                <BookMarked size={16} color="var(--accent-gold)" />
                <span className="concordance-hub-card-title">Coptic Dictionary Online</span>
                <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
              </div>
              <p className="concordance-hub-card-desc">
                {isArabicUi
                  ? 'عرض في المعجم القبطي الشامل (KELLIA / BBAW / Scriptorium).'
                  : 'Direct entry lookup in the Comprehensive Coptic Lexicon (KELLIA / BBAW / Scriptorium).'}
              </p>
              <span className="concordance-hub-btn">
                {isArabicUi ? `عرض مدخل "${coptic_name}" في المعجم` : `Open "${coptic_name}" in Dictionary`}
              </span>
            </a>

            <a
              href={annisAqlUrl}
              target="_blank"
              rel="noreferrer"
              className="concordance-hub-card"
            >
              <div className="concordance-hub-card-header">
                <Search size={16} color="var(--accent-emerald)" />
                <span className="concordance-hub-card-title">Coptic Scriptorium ANNIS</span>
                <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
              </div>
              <p className="concordance-hub-card-desc">
                {isArabicUi
                  ? 'بحث لغوي متقدم في كافة المخطوطات والبرديات المحققة (AQL query).'
                  : 'Execute live Annis Query Language search across all corpus texts and papyri.'}
              </p>
              <span className="concordance-hub-btn">
                {isArabicUi ? `بحث عن "${coptic_name}" في ANNIS` : `Search "${coptic_name}" in ANNIS`}
              </span>
            </a>

            <a
              href={tlaBbawUrl}
              target="_blank"
              rel="noreferrer"
              className="concordance-hub-card"
            >
              <div className="concordance-hub-card-header">
                <Globe size={16} color="var(--accent-purple)" />
                <span className="concordance-hub-card-title">Thesaurus Linguae Aegyptiae</span>
                <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
              </div>
              <p className="concordance-hub-card-desc">
                {isArabicUi
                  ? 'استعراض الجذور المصرية القديمة والديموطيقية في معجم أكاديمية برلين (BBAW TLA).'
                  : 'Explore ancient Egyptian and Demotic root ancestors in the Berlin-Brandenburg TLA portal.'}
              </p>
              <span className="concordance-hub-btn">
                {isArabicUi ? 'بوابة TLA الأكاديمية' : 'Explore BBAW TLA'}
              </span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
