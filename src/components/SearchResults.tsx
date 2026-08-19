import React, { useState, useEffect } from 'react';
import { DictionaryEntry, Sense } from '../types/dictionary';
import { DIALECT_DESCRIPTIONS, POS_DESCRIPTIONS } from '../utils/coptic';
import { playSynthesizedCoptic } from '../utils/audio';
import { isWordSaved, toggleSaveWord, subscribeSavedWords } from '../services/savedWords';
import { Share2, Sparkles, BookOpen, Volume2, Flame, Bookmark, ChevronRight } from 'lucide-react';
import { UiTranslations } from '../utils/i18n';
import { stripHtmlAndTags } from '../utils/richText';

interface SearchResultsProps {
  entries: DictionaryEntry[];
  totalCount: number;
  loading: boolean;
  onSelectEntry: (entry: DictionaryEntry) => void;
  onViewNetwork: (word: string) => void;
  t: UiTranslations;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  entries,
  totalCount,
  loading,
  onSelectEntry,
  onViewNetwork,
  t
}) => {
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const updateSaved = () => {
      const saved = new Set<number>();
      entries.forEach((e) => {
        if (isWordSaved(e.id)) saved.add(e.id);
      });
      setSavedIds(saved);
    };

    updateSaved();
    const unsub = subscribeSavedWords(() => updateSaved());
    return unsub;
  }, [entries]);

  const getParsedSenses = (entry: DictionaryEntry): Sense[] => {
    if (entry.en_json) {
      try {
        const parsed = JSON.parse(entry.en_json);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    if (entry.ar_json) {
      try {
        const parsed = JSON.parse(entry.ar_json);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    if (entry.de_json) {
      try {
        const parsed = JSON.parse(entry.de_json);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [];
  };

  const getArabicSense = (entry: DictionaryEntry): string | null => {
    if (entry.ar_json) {
      try {
        const parsed = JSON.parse(entry.ar_json);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].definition) {
          return parsed[0].definition;
        }
      } catch (e) {}
    }
    return null;
  };

  const getDialectList = (dialectsStr?: string): string[] => {
    if (!dialectsStr) return [];
    return dialectsStr.split(',').map((d) => d.trim()).filter(Boolean);
  };

  const handlePlayAudio = (e: React.MouseEvent, entry: DictionaryEntry) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(10); } catch (err) {}
    }
    const dialect = entry.dialects?.includes('B') && !entry.dialects?.includes('S') ? 'B' : 'S';
    setPlayingWord(entry.coptic_name);
    playSynthesizedCoptic(entry.coptic_name, dialect);
    setTimeout(() => setPlayingWord(null), 1000);
  };

  const handleToggleSave = (e: React.MouseEvent, entry: DictionaryEntry) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(15); } catch (err) {}
    }
    toggleSaveWord(entry);
  };

  const handleCardShare = async (e: React.MouseEvent, entry: DictionaryEntry) => {
    e.stopPropagation();
    const shareUrl = `https://lexicon.copto.org/?q=${encodeURIComponent(entry.coptic_name)}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `CoptoLex: ${entry.coptic_name}`,
          text: `${entry.coptic_name} (${entry.pos}) — Coptic Lexicon`,
          url: shareUrl
        });
      } catch (err) {
        navigator.clipboard.writeText(shareUrl);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '36px', fontFamily: 'var(--font-coptic)', marginBottom: '12px', color: 'var(--accent-gold)' }}>ⲁ...</div>
        <p style={{ fontSize: '14px' }}>Searching Coptic Lexicon &amp; Etymologies...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--text-muted)',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-subtle)'
        }}
      >
        <BookOpen size={40} style={{ margin: '0 auto 16px auto', color: 'var(--accent-gold)' }} />
        <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>{t.noResultsTitle}</h3>
        <p style={{ maxWidth: '500px', margin: '0 auto', fontSize: '14px' }}>{t.noResultsBody}</p>
      </div>
    );
  }

  return (
    <div className="search-results-wrapper">
      <div className="results-header">
        <span>{t.showingResults(entries.length, totalCount)}</span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.resultsHint}</span>
      </div>

      <div className="results-grid">
        {entries.map((entry) => {
          const senses = getParsedSenses(entry);
          const dialects = getDialectList(entry.dialects);
          const posDesc = POS_DESCRIPTIONS[entry.pos] || entry.pos;
          const isPlaying = playingWord === entry.coptic_name;
          const isSaved = savedIds.has(entry.id);

          return (
            <div
              key={entry.id || entry.xml_id}
              className="entry-card"
              onClick={() => onSelectEntry(entry)}
            >
              {/* Section 1: Prominent Headword & Action Buttons */}
              <div className="entry-card-header">
                <div className="entry-headword-wrap">
                  <span className="entry-coptic-headword">{entry.coptic_name}</span>
                  <button
                    className={`btn-card-audio ${isPlaying ? 'active' : ''}`}
                    onClick={(e) => handlePlayAudio(e, entry)}
                    title="Play Coptic pronunciation"
                    aria-label={`Play pronunciation for ${entry.coptic_name}`}
                  >
                    <Volume2 size={16} />
                  </button>
                </div>

                <div className="entry-header-actions">
                  {/* Bookmark Button */}
                  <button
                    className={`btn-card-action ${isSaved ? 'bookmarked' : ''}`}
                    onClick={(e) => handleToggleSave(e, entry)}
                    title={isSaved ? 'Remove from Saved' : 'Save for offline revision'}
                    aria-label="Save word offline"
                  >
                    <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                  </button>

                  {/* Native Share Button */}
                  <button
                    className="btn-card-action"
                    onClick={(e) => handleCardShare(e, entry)}
                    title="Share entry link"
                    aria-label="Share entry"
                  >
                    <Share2 size={15} />
                  </button>
                </div>
              </div>

              {/* Section 2: Auto-Wrapping Metadata Chips Row */}
              <div className="entry-card-meta">
                {entry.ipa_sahidic && (
                  <span className="entry-ipa-tag">
                    {entry.ipa_sahidic}
                  </span>
                )}

                <span className="entry-pos-badge" title={posDesc}>
                  {entry.pos}
                </span>

                {entry.origin === 'greek' ? (
                  <span
                    className="dialect-tag origin-greek-tag"
                    title="Greek Loanword in Coptic (DDGLC)"
                  >
                    🏛️ Greek
                  </span>
                ) : (
                  <span
                    className="dialect-tag origin-egyptian-tag"
                    title="Ancient Egyptian Heritage (BBAW)"
                  >
                    🏺 Egyptian
                  </span>
                )}

                {entry.freq_rank && entry.freq_rank < 1000 && (
                  <span
                    className="dialect-tag freq-rank-tag"
                    title={`Rank #${entry.freq_rank} in Coptic corpus`}
                  >
                    <Flame size={10} />
                    <span>#{entry.freq_rank}</span>
                  </span>
                )}

                {/* Dialect Tags */}
                {dialects.length > 0 && (
                  <div className="entry-dialects-cluster">
                    {dialects.map((d) => (
                      <span
                        key={d}
                        className="dialect-tag"
                        title={DIALECT_DESCRIPTIONS[d]?.name || d}
                        style={{ borderColor: DIALECT_DESCRIPTIONS[d]?.color ? `${DIALECT_DESCRIPTIONS[d]?.color}66` : undefined }}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: English / Primary Senses */}
              <div className="entry-senses">
                {senses.slice(0, 2).map((s, idx) => (
                  <div key={idx} className="sense-line">
                    <span className="sense-num">{idx + 1}. </span>
                    <span className="sense-text">{s.definition}</span>
                    {s.citations && s.citations.length > 0 && (
                      <span className="sense-citations">
                        ({s.citations.join('; ')})
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Section 4: Dedicated Arabic RTL Callout Block */}
              {getArabicSense(entry) && (
                <div className="entry-arabic-callout">
                  <div className="entry-arabic-callout-header">
                    <span className="arabic-badge">العربية</span>
                  </div>
                  <div className="entry-arabic-callout-text">
                    {getArabicSense(entry)}
                  </div>
                </div>
              )}

              {/* Section 5: Etymology Footer & Card Tap Affordance */}
              <div className="entry-card-footer">
                {entry.etym ? (
                  <div className="entry-etym-preview">
                    <Sparkles size={12} color="var(--accent-gold)" />
                    <span>{stripHtmlAndTags(entry.etym)}</span>
                  </div>
                ) : (
                  <div />
                )}
                <div className="entry-card-tap-hint">
                  <span>Details</span>
                  <ChevronRight size={13} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
