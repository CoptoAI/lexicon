import React, { useState, useEffect } from 'react';
import { SavedWord, getSavedWords, removeSavedWord, clearSavedWords, subscribeSavedWords } from '../services/savedWords';
import { DictionaryEntry } from '../types/dictionary';
import { playSynthesizedCoptic } from '../utils/audio';
import { exportAnkiDeck } from '../services/api';
import { Bookmark, Trash2, Volume2, Download, Search, Sparkles, BookOpen } from 'lucide-react';
import { UiTranslations } from '../utils/i18n';

interface SavedWordsViewProps {
  onSelectEntry: (entry: DictionaryEntry) => void;
  onClose: () => void;
  t: UiTranslations;
}

export const SavedWordsView: React.FC<SavedWordsViewProps> = ({ onSelectEntry, onClose, t }) => {
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  useEffect(() => {
    setSavedWords(getSavedWords());
    const unsub = subscribeSavedWords(setSavedWords);
    return unsub;
  }, []);

  const handlePlayAudio = (e: React.MouseEvent, word: SavedWord) => {
    e.stopPropagation();
    const dialect = word.dialects.includes('B') && !word.dialects.includes('S') ? 'B' : 'S';
    setPlayingWord(word.coptic_name);
    playSynthesizedCoptic(word.coptic_name, dialect);
    setTimeout(() => setPlayingWord(null), 1000);
  };

  const handleRemove = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    removeSavedWord(id);
  };

  const handleExport = () => {
    if (savedWords.length === 0) return;
    const entries = savedWords.map((w) => w.entry);
    exportAnkiDeck(entries, 'coptolex_saved_vocabulary.csv');
  };

  const filtered = savedWords.filter((w) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      w.coptic_name.toLowerCase().includes(q) ||
      w.definition.toLowerCase().includes(q) ||
      w.pos.toLowerCase().includes(q) ||
      w.dialects.toLowerCase().includes(q)
    );
  });

  return (
    <div className="saved-words-container">
      <div className="saved-words-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="saved-icon-badge">
            <Bookmark size={20} color="var(--accent-gold)" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
              Saved Vocabulary ({savedWords.length})
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Available offline anytime for study &amp; revision
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {savedWords.length > 0 && (
            <>
              <button
                className="btn-nav"
                onClick={handleExport}
                style={{ borderColor: 'var(--border-gold)', padding: '6px 10px', fontSize: '12px' }}
                title="Export saved words to Anki CSV"
              >
                <Download size={14} color="var(--accent-gold)" />
                <span>Export Anki</span>
              </button>
              <button
                className="btn-icon"
                onClick={() => {
                  if (confirm('Clear all saved words?')) clearSavedWords();
                }}
                title="Clear all saved words"
                style={{ width: '32px', height: '32px' }}
              >
                <Trash2 size={15} color="var(--text-muted)" />
              </button>
            </>
          )}
        </div>
      </div>

      {savedWords.length > 0 && (
        <div className="saved-search-box">
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            className="saved-search-input"
            placeholder="Filter saved words..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
        </div>
      )}

      {savedWords.length === 0 ? (
        <div className="saved-empty-state">
          <BookOpen size={36} color="var(--accent-gold)" style={{ opacity: 0.8, marginBottom: '8px' }} />
          <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px' }}>
            No Saved Words Yet
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 16px auto' }}>
            Tap the star icon (⭐) on any dictionary entry to save words for offline flashcards and revision.
          </p>
          <button className="btn-nav" onClick={onClose} style={{ margin: '0 auto' }}>
            <span>Search the Lexicon</span>
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
          No saved words match "{filterQuery}"
        </div>
      ) : (
        <div className="saved-list">
          {filtered.map((item) => {
            const isPlaying = playingWord === item.coptic_name;
            return (
              <div
                key={item.id}
                className="saved-item-card"
                onClick={() => onSelectEntry(item.entry)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="saved-coptic-text">{item.coptic_name}</span>
                    <button
                      className={`btn-icon ${isPlaying ? 'active' : ''}`}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: isPlaying ? 'var(--accent-gold)' : 'var(--bg-surface-elevated)',
                        color: isPlaying ? '#0c0f17' : 'var(--accent-gold)'
                      }}
                      onClick={(e) => handlePlayAudio(e, item)}
                      title="Play pronunciation"
                    >
                      <Volume2 size={14} />
                    </button>
                    {item.pos && <span className="entry-pos-badge">{item.pos}</span>}
                    {item.dialects && (
                      <span className="dialect-tag" style={{ fontSize: '10px' }}>
                        {item.dialects}
                      </span>
                    )}
                  </div>

                  <button
                    className="btn-icon"
                    style={{ width: '28px', height: '28px' }}
                    onClick={(e) => handleRemove(e, item.id)}
                    title="Remove from saved"
                  >
                    <Trash2 size={13} color="var(--text-muted)" />
                  </button>
                </div>

                <div className="saved-def-text">{item.definition}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
