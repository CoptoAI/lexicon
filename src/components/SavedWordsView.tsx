import React, { useState, useEffect } from 'react';
import { SavedWord, getSavedWords, removeSavedWord, clearSavedWords, subscribeSavedWords } from '../services/savedWords';
import { DictionaryEntry } from '../types/dictionary';
import { playSynthesizedCoptic } from '../utils/audio';
import { exportAnkiDeck } from '../services/api';
import { useSwipeGesture } from '../utils/useSwipeGesture';
import { Bookmark, Trash2, Volume2, Download, Search, Sparkles, BookOpen, Layers, CheckCircle2, RotateCw, ArrowLeft, ArrowRight, Shuffle, Check, X } from 'lucide-react';
import { UiTranslations } from '../utils/i18n';

interface SavedWordsViewProps {
  onSelectEntry: (entry: DictionaryEntry) => void;
  onClose: () => void;
  t: UiTranslations;
}

export const SavedWordsView: React.FC<SavedWordsViewProps> = ({ onSelectEntry, onClose, t }) => {
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedDialect, setSelectedDialect] = useState<string>('all');
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'flashcards'>('list');

  // Flashcard State
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [masteredIds, setMasteredIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setSavedWords(getSavedWords());
    const unsub = subscribeSavedWords(setSavedWords);
    return unsub;
  }, []);

  const handlePlayAudio = (e: React.MouseEvent | null, word: SavedWord) => {
    if (e) e.stopPropagation();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(10); } catch (err) {}
    }
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
    const matchesQuery =
      !filterQuery ||
      w.coptic_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      w.definition.toLowerCase().includes(filterQuery.toLowerCase()) ||
      w.pos.toLowerCase().includes(filterQuery.toLowerCase());

    const matchesDialect =
      selectedDialect === 'all' ||
      w.dialects.split(',').map((d) => d.trim()).includes(selectedDialect);

    return matchesQuery && matchesDialect;
  });

  // Flashcard Next / Prev controls
  const handleNextCard = () => {
    if (filtered.length === 0) return;
    setIsFlipped(false);
    setCardIndex((prev) => (prev + 1) % filtered.length);
  };

  const handlePrevCard = () => {
    if (filtered.length === 0) return;
    setIsFlipped(false);
    setCardIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
  };

  const handleMarkMastered = (id: number) => {
    setMasteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    handleNextCard();
  };

  const handleShuffle = () => {
    if (filtered.length <= 1) return;
    const randomIdx = Math.floor(Math.random() * filtered.length);
    setIsFlipped(false);
    setCardIndex(randomIdx);
  };

  // Card Swipe Gesture (Swipe Left = Next, Swipe Right = Prev/Mastered)
  const { touchHandlers } = useSwipeGesture({
    onSwipeLeft: handleNextCard,
    onSwipeRight: handlePrevCard,
    threshold: 50
  });

  const currentCard = filtered[cardIndex % Math.max(1, filtered.length)];

  return (
    <div className="saved-words-container">
      {/* Header Bar */}
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
              Offline study deck &amp; flashcards
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {savedWords.length > 0 && (
            <>
              {/* View Mode Toggle: List vs Flashcards */}
              <div className="view-mode-toggle-group">
                <button
                  className={`btn-view-mode ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  <BookOpen size={14} />
                  <span>List</span>
                </button>
                <button
                  className={`btn-view-mode ${viewMode === 'flashcards' ? 'active' : ''}`}
                  onClick={() => {
                    setViewMode('flashcards');
                    setCardIndex(0);
                    setIsFlipped(false);
                  }}
                  title="Flashcards Study Mode"
                >
                  <Layers size={14} />
                  <span>Flashcards</span>
                </button>
              </div>

              <button
                className="btn-nav"
                onClick={handleExport}
                style={{ borderColor: 'var(--border-gold)', padding: '6px 10px', fontSize: '12px' }}
                title="Export saved words to Anki CSV"
              >
                <Download size={14} color="var(--accent-gold)" />
                <span className="hide-mobile-sm">Export</span>
              </button>

              <button
                className="btn-icon"
                onClick={() => {
                  if (confirm('Clear all saved words from offline storage?')) clearSavedWords();
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

      {/* Search and Dialect Filter Bar */}
      {savedWords.length > 0 && (
        <div className="saved-filter-row">
          <div className="saved-search-box" style={{ flex: 1 }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              className="saved-search-input"
              placeholder="Filter saved words..."
              value={filterQuery}
              onChange={(e) => {
                setFilterQuery(e.target.value);
                setCardIndex(0);
              }}
            />
            {filterQuery && (
              <button className="btn-clear" onClick={() => setFilterQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="dialect-pills scrollable-pills" style={{ padding: '0 2px' }}>
            {['all', 'S', 'B', 'A', 'F', 'M', 'L'].map((d) => (
              <button
                key={d}
                className={`dialect-pill ${selectedDialect === d ? 'active' : ''}`}
                onClick={() => {
                  setSelectedDialect(d);
                  setCardIndex(0);
                }}
                style={{ padding: '4px 10px', fontSize: '11px' }}
              >
                {d === 'all' ? 'All' : d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {savedWords.length === 0 ? (
        <div className="saved-empty-state">
          <BookOpen size={40} color="var(--accent-gold)" style={{ opacity: 0.8, marginBottom: '8px' }} />
          <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px' }}>
            No Saved Words Yet
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 16px auto' }}>
            Tap the bookmark star (⭐) on any dictionary entry to build your custom offline study deck and review vocabulary with flashcards.
          </p>
          <button className="btn-nav" onClick={onClose} style={{ margin: '0 auto' }}>
            <span>Search the Lexicon</span>
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
          No saved words match your filters.
        </div>
      ) : viewMode === 'flashcards' ? (
        /* ==========================================================================
           Interactive 3D Flashcard Study Mode
           ========================================================================== */
        <div className="flashcard-study-container">
          {/* Flashcard Progress */}
          <div className="flashcard-progress-bar-wrap">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>Card {cardIndex + 1} of {filtered.length}</span>
              <span>{masteredIds.size} Mastered</span>
            </div>
            <div className="flashcard-progress-track">
              <div
                className="flashcard-progress-fill"
                style={{ width: `${((cardIndex + 1) / filtered.length) * 100}%` }}
              />
            </div>
          </div>

          {/* 3D Flip Card */}
          {currentCard && (
            <div
              className={`flashcard-3d-card ${isFlipped ? 'flipped' : ''}`}
              onClick={() => setIsFlipped((prev) => !prev)}
              {...touchHandlers}
            >
              <div className="flashcard-inner">
                {/* Front of Flashcard */}
                <div className="flashcard-face flashcard-front">
                  <div className="flashcard-badge-top">
                    <span className="entry-pos-badge">{currentCard.pos}</span>
                    <span className="dialect-tag">{currentCard.dialects}</span>
                  </div>

                  <div className="flashcard-headword-coptic">
                    {currentCard.coptic_name}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                    <button
                      className="btn-icon"
                      style={{ borderRadius: '50%', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--accent-gold)', borderColor: 'var(--border-gold)', width: '40px', height: '40px' }}
                      onClick={(e) => handlePlayAudio(e, currentCard)}
                      title="Play Pronunciation"
                    >
                      <Volume2 size={20} />
                    </button>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Tap card to reveal definition</span>
                  </div>
                </div>

                {/* Back of Flashcard */}
                <div className="flashcard-face flashcard-back">
                  <div className="flashcard-badge-top">
                    <span className="entry-pos-badge">{currentCard.pos}</span>
                    <span style={{ fontSize: '12px', color: 'var(--accent-gold)', fontWeight: 600 }}>
                      {currentCard.coptic_name}
                    </span>
                  </div>

                  <div className="flashcard-definition">
                    {currentCard.definition}
                  </div>

                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <button
                      className="btn-nav"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEntry(currentCard.entry);
                      }}
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      <span>Full Details &amp; Citations</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Flashcard Action Controls */}
          <div className="flashcard-controls-row">
            <button
              className="btn-flashcard-action"
              onClick={handlePrevCard}
              title="Previous Card"
            >
              <ArrowLeft size={18} />
              <span>Prev</span>
            </button>

            <button
              className="btn-flashcard-action"
              onClick={handleShuffle}
              title="Shuffle Cards"
            >
              <Shuffle size={18} />
            </button>

            <button
              className={`btn-flashcard-action ${currentCard && masteredIds.has(currentCard.id) ? 'active-mastered' : ''}`}
              onClick={() => currentCard && handleMarkMastered(currentCard.id)}
              title="Mark as Mastered"
            >
              <CheckCircle2 size={18} color="var(--accent-emerald)" />
              <span>{currentCard && masteredIds.has(currentCard.id) ? 'Mastered' : 'Master'}</span>
            </button>

            <button
              className="btn-flashcard-action primary"
              onClick={handleNextCard}
              title="Next Card"
            >
              <span>Next</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      ) : (
        /* ==========================================================================
           Standard List View
           ========================================================================== */
        <div className="saved-list">
          {filtered.map((item) => {
            const isPlaying = playingWord === item.coptic_name;
            return (
              <div
                key={item.id}
                className="saved-item-card"
                onClick={() => onSelectEntry(item.entry)}
              >
                <div className="entry-card-header">
                  <div className="entry-headword-wrap">
                    <span className="saved-coptic-text">{item.coptic_name}</span>
                    <button
                      className={`btn-card-audio ${isPlaying ? 'active' : ''}`}
                      onClick={(e) => handlePlayAudio(e, item)}
                      title="Play Pronunciation"
                      aria-label="Play pronunciation"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>

                  <button
                    className="btn-card-action"
                    onClick={(e) => handleRemove(e, item.id)}
                    title="Remove from saved words"
                    aria-label="Remove word"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="entry-card-meta">
                  <span className="entry-pos-badge">{item.pos}</span>
                  <span className="dialect-tag">{item.dialects}</span>
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
