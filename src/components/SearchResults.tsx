import React, { useState, useEffect } from 'react';
import { DictionaryEntry, Sense } from '../types/dictionary';
import { DIALECT_DESCRIPTIONS, POS_DESCRIPTIONS } from '../utils/coptic';
import { playSynthesizedCoptic } from '../utils/audio';
import { isWordSaved, toggleSaveWord, subscribeSavedWords } from '../services/savedWords';
import { Share2, Sparkles, BookOpen, Volume2, Flame, Bookmark } from 'lucide-react';
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '32px', fontFamily: 'var(--font-coptic)', marginBottom: '12px' }}>ⲁ...</div>
        <p>Searching Coptic Lexicon &amp; Etymologies...</p>
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
    <div>
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
              <div className="entry-card-top">
                <div className="entry-word-group">
                  <span className="entry-coptic-headword">{entry.coptic_name}</span>

                  <button
                    className={`btn-icon ${isPlaying ? 'active' : ''}`}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isPlaying ? 'var(--accent-gold)' : 'var(--bg-surface-elevated)',
                      color: isPlaying ? '#0c0f17' : 'var(--accent-gold)',
                      border: '1px solid var(--border-gold)',
                      transform: isPlaying ? 'scale(1.1)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={(e) => handlePlayAudio(e, entry)}
                    title="Play Coptic pronunciation"
                  >
                    <Volume2 size={15} />
                  </button>

                  {entry.ipa_sahidic && (
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {entry.ipa_sahidic}
                    </span>
                  )}

                  <span className="entry-pos-badge" title={posDesc}>
                    {entry.pos}
                  </span>

                  {entry.origin === 'greek' ? (
                    <span
                      className="dialect-tag"
                      style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#818cf8' }}
                      title="Greek Loanword in Coptic (DDGLC)"
                    >
                      🏛️ Greek
                    </span>
                  ) : (
                    <span
                      className="dialect-tag"
                      style={{ borderColor: 'rgba(212, 175, 55, 0.4)', color: 'var(--accent-gold)' }}
                      title="Ancient Egyptian Heritage (BBAW)"
                    >
                      🏺 Egyptian
                    </span>
                  )}

                  {entry.freq_rank && entry.freq_rank < 1000 && (
                    <span
                      className="dialect-tag"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        color: 'var(--accent-amber)',
                        borderColor: 'rgba(251, 191, 36, 0.4)'
                      }}
                      title={`Rank #${entry.freq_rank} in Coptic corpus`}
                    >
                      <Flame size={10} />
                      <span>#{entry.freq_rank}</span>
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className="entry-dialects-row">
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

                  {/* Bookmark Button */}
                  <button
                    className={`btn-icon ${isSaved ? 'bookmarked' : ''}`}
                    style={{
                      width: '32px',
                      height: '32px',
                      color: isSaved ? 'var(--accent-gold)' : 'var(--text-muted)',
                      background: isSaved ? 'rgba(212, 175, 55, 0.15)' : undefined,
                      borderColor: isSaved ? 'var(--accent-gold)' : undefined
                    }}
                    onClick={(e) => handleToggleSave(e, entry)}
                    title={isSaved ? 'Remove from Saved' : 'Save for offline revision'}
                  >
                    <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    className="btn-icon"
                    style={{ width: '32px', height: '32px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewNetwork(entry.coptic_name);
                    }}
                    title="View Collocation Network Graph"
                  >
                    <Share2 size={14} />
                  </button>
                </div>
              </div>

              {/* Definitions */}
              <div className="entry-senses">
                {senses.slice(0, 2).map((s, idx) => (
                  <div key={idx} style={{ marginBottom: '4px' }}>
                    <span style={{ fontWeight: 500 }}>{idx + 1}. </span>
                    <span>{s.definition}</span>
                    {s.citations && s.citations.length > 0 && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        ({s.citations.join('; ')})
                      </span>
                    )}
                  </div>
                ))}

                {/* Arabic Gloss */}
                {getArabicSense(entry) && (
                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="arabic-badge">العربية</span>
                    <span className="arabic-definition" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                      {getArabicSense(entry)}
                    </span>
                  </div>
                )}
              </div>

              {/* Etymology / Cross-reference info */}
              {entry.etym && (
                <div className="entry-etym-preview">
                  <Sparkles size={12} color="var(--accent-gold)" />
                  <span>{stripHtmlAndTags(entry.etym)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
