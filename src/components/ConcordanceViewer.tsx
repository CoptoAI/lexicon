import React, { useState } from 'react';
import { ManuscriptExample, getConcordanceExamples, splitAndHighlightCoptic } from '../services/concordance';
import { BookOpen, ExternalLink, Copy, Check, Filter, ScrollText, Sparkles } from 'lucide-react';

interface ConcordanceViewerProps {
  coptic_name: string;
  xml_id?: string;
  isArabicUi?: boolean;
}

export const ConcordanceViewer: React.FC<ConcordanceViewerProps> = ({
  coptic_name,
  isArabicUi = false
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const examples = getConcordanceExamples(coptic_name);

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
        return { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', text: '#34d399', label: isArabicUi ? 'كتابي (عهد جديد/قديم)' : 'Biblical Corpus' };
      case 'monastic':
        return { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', text: '#fbbf24', label: isArabicUi ? 'رهباني (شنودة وبصا)' : 'Monastic (Shenoute/Besa)' };
      case 'patristic':
        return { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.4)', text: '#a78bfa', label: isArabicUi ? 'آبائي (بستان الرهبان)' : 'Desert Fathers (Apophthegmata)' };
      case 'martyrdom':
        return { bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.4)', text: '#fb7185', label: isArabicUi ? 'سير الشهداء' : 'Martyrdoms' };
      default:
        return { bg: 'var(--bg-surface-elevated)', border: 'var(--border-subtle)', text: 'var(--text-secondary)', label: genre };
    }
  };

  return (
    <div className="concordance-container">
      {/* Header Controls */}
      <div className="concordance-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ScrollText size={18} color="var(--accent-gold)" />
          <span style={{ fontWeight: 600, fontSize: '15px' }}>
            {isArabicUi ? 'شواهد المخطوطات والآيات المتوازية' : 'Inline Manuscript & Biblical Concordance'}
          </span>
          <span className="concordance-badge-count">
            {filteredExamples.length} {isArabicUi ? 'شواهد' : 'citations'}
          </span>
        </div>

        {/* Genre Filter Pills */}
        <div className="concordance-filter-group">
          {[
            { id: 'all', label: isArabicUi ? 'الكل' : 'All' },
            { id: 'biblical', label: isArabicUi ? 'كتاب مقدس' : 'Biblical' },
            { id: 'monastic', label: isArabicUi ? 'نصوص شنودة' : 'Shenoute & Monastic' },
            { id: 'patristic', label: isArabicUi ? 'بستان الرهبان' : 'Patristic' }
          ].map((f) => (
            <button
              key={f.id}
              className={`concordance-filter-pill ${selectedGenre === f.id ? 'active' : ''}`}
              onClick={() => setSelectedGenre(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Examples List */}
      {filteredExamples.length > 0 ? (
        <div className="concordance-list">
          {filteredExamples.map((ex) => {
            const genreStyle = getGenreColor(ex.genre);
            const tokens = splitAndHighlightCoptic(ex.coptic_text, coptic_name);

            return (
              <div key={ex.id} className="concordance-card">
                {/* Card Top Meta */}
                <div className="concordance-card-meta">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="concordance-ref-badge">{ex.reference}</span>
                    <span
                      className="concordance-genre-badge"
                      style={{ background: genreStyle.bg, borderColor: genreStyle.border, color: genreStyle.text }}
                    >
                      {genreStyle.label}
                    </span>
                    <span className="dialect-tag">{ex.dialect}</span>
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
                  <div className="concordance-translation-col">
                    <div className="concordance-lang-label">
                      <span>🇬🇧 English</span>
                    </div>
                    <div className="concordance-translation-text">{ex.english_translation}</div>
                  </div>

                  <div className="concordance-translation-col text-rtl" dir="rtl">
                    <div className="concordance-lang-label">
                      <span>🇪🇬 العربية</span>
                    </div>
                    <div className="concordance-translation-text arabic-definition">{ex.arabic_translation}</div>
                  </div>
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
        <div className="concordance-empty">
          <BookOpen size={32} color="var(--accent-gold)" style={{ opacity: 0.6, marginBottom: '8px' }} />
          <div style={{ fontWeight: 600, fontSize: '15px' }}>
            {isArabicUi ? 'لم يتم العثور على شواهد مخطوطات مباشرة لهذا المدخل' : 'No direct manuscript concordance citations found'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '400px' }}>
            {isArabicUi
              ? 'يمكنك البحث في نصوص Coptic Scriptorium الرقمية الكاملة عبر الرابط التالي:'
              : 'You can explore all occurrences in the complete digital corpus on Coptic Scriptorium:'}
          </div>
          <a
            href={`https://copticscriptorium.org/corpora/#search=${encodeURIComponent(coptic_name)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-nav"
            style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ExternalLink size={14} />
            <span>{isArabicUi ? 'بحث في Coptic Scriptorium' : 'Search Coptic Scriptorium Corpus'}</span>
          </a>
        </div>
      )}
    </div>
  );
};
