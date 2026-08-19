import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BibleBookInfo, ParallelBibleVerse } from '../types/dictionary';
import { fetchBibleBooks, fetchBibleChapter, searchBibleVerses } from '../services/bible';
import { useSwipeGesture } from '../utils/useSwipeGesture';

import { Search, Copy, Check, ChevronLeft, ChevronRight, BookOpen, ScrollText, Globe, X } from 'lucide-react';
import { getCopticTokenGloss } from '../utils/coptic';

interface ParallelScriptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWord?: (word: string) => void;
  initialBook?: string;
  initialChapter?: number;
  isArabicUi?: boolean;
}

export const ParallelScriptureModal: React.FC<ParallelScriptureModalProps> = ({
  isOpen,
  onClose,
  onSelectWord,
  initialBook = 'JOH',
  initialChapter = 1,
  isArabicUi = false,
}) => {
  const [books, setBooks] = useState<BibleBookInfo[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>(initialBook);
  const [selectedChapter, setSelectedChapter] = useState<number>(initialChapter);
  const [verses, setVerses] = useState<ParallelBibleVerse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search within Scripture
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<ParallelBibleVerse[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchMode, setSearchMode] = useState<boolean>(false);

  // Column Visibility Toggles
  const [showSahidic, setShowSahidic] = useState<boolean>(true);
  const [showBohairicVocalized, setShowBohairicVocalized] = useState<boolean>(true);
  const [showBohairicPlain, setShowBohairicPlain] = useState<boolean>(false);
  const [showArabicNav, setShowArabicNav] = useState<boolean>(true);
  const [showArabicSvd, setShowArabicSvd] = useState<boolean>(false);
  const [showEnglishKjv, setShowEnglishKjv] = useState<boolean>(true);

  // Layout View Mode (table vs parallel cards)
  const [viewMode, setViewMode] = useState<'cards' | 'interlinear'>('cards');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  const contentRef = useRef<HTMLDivElement>(null);

  // Load books list on mount
  useEffect(() => {
    fetchBibleBooks().then(data => {
      if (data && data.length > 0) {
        setBooks(data);
      }
    });
  }, []);

  // Update selected book/chapter when props change
  useEffect(() => {
    if (initialBook) setSelectedBook(initialBook);
    if (initialChapter) setSelectedChapter(initialChapter);
  }, [initialBook, initialChapter]);

  // Load chapter verses whenever selected book or chapter changes
  useEffect(() => {
    if (!isOpen || searchMode) return;
    setLoading(true);
    fetchBibleChapter(selectedBook, selectedChapter)
      .then(res => {
        if (res && res.verses) {
          setVerses(res.verses);
        } else {
          setVerses([]);
        }
      })
      .finally(() => {
        setLoading(false);
        if (contentRef.current) {
          contentRef.current.scrollTop = 0;
        }
      });
  }, [isOpen, selectedBook, selectedChapter, searchMode]);

  // Current Book Metadata
  const currentBook = useMemo(() => {
    return books.find(b => b.code.toUpperCase() === selectedBook.toUpperCase()) || {
      code: selectedBook,
      canon_order: 1,
      name_en: selectedBook,
      name_ar: selectedBook,
      name_cop: selectedBook,
      chapters: 1
    };
  }, [books, selectedBook]);

  // Navigation handlers
  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(prev => prev - 1);
    } else {
      // Go to previous book if available
      const currentIdx = books.findIndex(b => b.code === selectedBook);
      if (currentIdx > 0) {
        const prevBook = books[currentIdx - 1];
        setSelectedBook(prevBook.code);
        setSelectedChapter(prevBook.chapters);
      }
    }
  };

  const handleNextChapter = () => {
    if (selectedChapter < currentBook.chapters) {
      setSelectedChapter(prev => prev + 1);
    } else {
      // Go to next book if available
      const currentIdx = books.findIndex(b => b.code === selectedBook);
      if (currentIdx >= 0 && currentIdx < books.length - 1) {
        const nextBook = books[currentIdx + 1];
        setSelectedBook(nextBook.code);
        setSelectedChapter(1);
      }
    }
  };

  // Scripture Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchMode(true);
    searchBibleVerses(searchQuery)
      .then(res => {
        setSearchResults(res);
      })
      .finally(() => {
        setIsSearching(false);
      });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchMode(false);
  };

  // Copy verse to clipboard
  const handleCopyVerse = (v: ParallelBibleVerse) => {
    const lines = [
      `[${v.book_name_en} ${v.chapter}:${v.verse} / ${v.book_name_ar} ${v.chapter}:${v.verse}]`,
      showSahidic && v.coptic_sahidic ? `(Ϩ Sahidic): ${v.coptic_sahidic}` : null,
      showBohairicVocalized && v.coptic_bohairic ? `(Ϧ Bohairic): ${v.coptic_bohairic}` : null,
      showArabicNav && v.arabic_nav ? `(عربي - الحياة): ${v.arabic_nav}` : null,
      showArabicSvd && v.arabic_svd ? `(عربي - فانديك): ${v.arabic_svd}` : null,
      showEnglishKjv && v.english_kjv ? `(English - KJV): ${v.english_kjv}` : null,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines).then(() => {
      setCopiedId(v.verse_id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Helper to render clickable Coptic word tokens with Interlinear glossing
  const renderCopticTokens = (text: string) => {
    if (!text) return null;
    const tokens = text.split(/([\s\.\,\;\:\-\—\(\)\[\]\⸗\·]+)/);
    return tokens.map((tok, idx) => {
      const isWord = /[\w\u0300-\u036f\ufe20-\ufe2f\u2cfd\u2cfe]+/.test(tok) && tok.trim().length > 0;
      if (isWord) {
        const gloss = getCopticTokenGloss(tok, isArabicUi);
        return (
          <span
            key={idx}
            className={`bible-clickable-word ${viewMode === 'interlinear' ? 'interlinear-block' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectWord) {
                const clean = tok.replace(/[\.\,\;\:\-\—\(\)\[\]\⸗\·]/g, '').trim();
                onSelectWord(clean);
              }
            }}
            title={isArabicUi ? `انقر للبحث عن "${tok}" في المعجم` : `Click to look up "${tok}" in lexicon`}
          >
            <span className="coptic-word-surface">{tok}</span>
            {viewMode === 'interlinear' && (
              <span className="interlinear-gloss-pill">
                {gloss ? gloss.text : (isArabicUi ? 'معجم' : 'lexicon')}
              </span>
            )}
          </span>
        );
      }
      return <span key={idx} className={viewMode === 'interlinear' ? 'interlinear-punct' : ''}>{tok}</span>;
    });
  };

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Mobile swipe gestures
  const { touchHandlers } = useSwipeGesture({
    onSwipeLeft: () => (isArabicUi ? handlePrevChapter() : handleNextChapter()),
    onSwipeRight: () => (isArabicUi ? handleNextChapter() : handlePrevChapter()),
    threshold: 60,
  });

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container bible-reader-modal"
        onClick={(e) => e.stopPropagation()}
        {...touchHandlers}
      >
        {/* Modal Header */}
        <div className="bible-modal-header">
          <div className="bible-header-left">
            <div className="bible-icon-badge">📖</div>
            <div>
              <h2 className="bible-modal-title">
                {isArabicUi ? 'العهد الجديد القبطي المقارن' : 'Parallel Coptic New Testament'}
              </h2>
              <p className="bible-modal-subtitle">
                {isArabicUi
                  ? 'مقارنة دقيقة: الصعيدي والبحيري المشكول مع الترجمة العربية والإنجليزية'
                  : 'Sahidic & Liturgical Bohairic aligned with Arabic and King James English'}
              </p>
            </div>
          </div>

          <div className="bible-header-actions">
            {/* View Mode Switcher */}
            <div className="bible-toggle-group">
              <button
                type="button"
                className={`bible-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                title={isArabicUi ? 'عرض البطاقات المتوازية' : 'Parallel Card View'}
              >
                📑 {isArabicUi ? 'بطاقات' : 'Cards'}
              </button>
              <button
                type="button"
                className={`bible-toggle-btn ${viewMode === 'interlinear' ? 'active' : ''}`}
                onClick={() => setViewMode('interlinear')}
                title={isArabicUi ? 'عرض متداخل سطراً بسطر' : 'Interlinear Verse-by-Verse'}
              >
                📜 {isArabicUi ? 'متداخل' : 'Interlinear'}
              </button>
            </div>

            {/* Font Size Toggle */}
            <div className="bible-toggle-group">
              <button
                type="button"
                className={`bible-toggle-btn ${fontSize === 'normal' ? 'active' : ''}`}
                onClick={() => setFontSize('normal')}
                title="Font Size: Normal"
              >
                A
              </button>
              <button
                type="button"
                className={`bible-toggle-btn ${fontSize === 'large' ? 'active' : ''}`}
                onClick={() => setFontSize('large')}
                title="Font Size: Large"
              >
                A+
              </button>
              <button
                type="button"
                className={`bible-toggle-btn ${fontSize === 'xlarge' ? 'active' : ''}`}
                onClick={() => setFontSize('xlarge')}
                title="Font Size: Extra Large"
              >
                A++
              </button>
            </div>

            <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        {/* Navigation & Filters Bar */}
        <div className="bible-controls-bar">
          {/* Book & Chapter Selectors */}
          <div className="bible-selectors-row">
            <div className="bible-select-wrapper">
              <label htmlFor="bible-book-select" className="bible-select-label">
                {isArabicUi ? 'السفر:' : 'Book:'}
              </label>
              <select
                id="bible-book-select"
                className="bible-select"
                value={selectedBook}
                onChange={(e) => {
                  setSelectedBook(e.target.value);
                  setSelectedChapter(1);
                  setSearchMode(false);
                }}
              >
                {books.map((b) => (
                  <option key={b.code} value={b.code}>
                    {isArabicUi ? `${b.name_ar} (${b.name_cop})` : `${b.name_en} (${b.name_cop})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="bible-select-wrapper">
              <label htmlFor="bible-chapter-select" className="bible-select-label">
                {isArabicUi ? 'الإصحاح:' : 'Chapter:'}
              </label>
              <select
                id="bible-chapter-select"
                className="bible-select"
                value={selectedChapter}
                onChange={(e) => {
                  setSelectedChapter(parseInt(e.target.value, 10));
                  setSearchMode(false);
                }}
              >
                {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map((ch) => (
                  <option key={ch} value={ch}>
                    {isArabicUi ? `الإصحاح ${ch}` : `Chapter ${ch}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter Steppers */}
            <div className="bible-stepper-btns">
              <button
                type="button"
                className="bible-nav-arrow"
                onClick={handlePrevChapter}
                disabled={selectedBook === books[0]?.code && selectedChapter === 1}
                title={isArabicUi ? 'الإصحاح السابق' : 'Previous Chapter'}
              >
                <ChevronLeft size={16} />
                <span>{isArabicUi ? 'السابق' : 'Prev'}</span>
              </button>
              <button
                type="button"
                className="bible-nav-arrow"
                onClick={handleNextChapter}
                disabled={selectedBook === books[books.length - 1]?.code && selectedChapter === currentBook.chapters}
                title={isArabicUi ? 'الإصحاح التالي' : 'Next Chapter'}
              >
                <span>{isArabicUi ? 'التالي' : 'Next'}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Search Bar within Scripture */}
          <form className="bible-search-form" onSubmit={handleSearch}>
            <input
              type="text"
              className="bible-search-input coptic-font"
              placeholder={
                isArabicUi
                  ? 'ابحث في نصوص الإنجيل (مثال: ⲛⲟⲩⲧⲉ، ⲁⲅⲁⲡⲏ، النور...)'
                  : 'Search in Scripture (e.g. ⲛⲟⲩⲧⲉ, ⲁⲅⲁⲡⲏ, light...)'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="bible-search-clear" onClick={clearSearch}>
                <X size={14} />
              </button>
            )}
            <button type="submit" className="bible-search-submit">
              <Search size={15} />
              <span>{isArabicUi ? 'بحث' : 'Search'}</span>
            </button>
          </form>
        </div>

        {/* Translation & Dialect Column Toggles */}
        <div className="bible-toggles-bar">
          <span className="bible-toggles-title">
            {isArabicUi ? 'الترجمات واللهجات المعروضة:' : 'Visible Columns & Dialects:'}
          </span>

          <label className={`bible-pill-checkbox ${showSahidic ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={showSahidic}
              onChange={(e) => setShowSahidic(e.target.checked)}
            />
            <span>Ϩ {isArabicUi ? 'صعيدي' : 'Sahidic'}</span>
          </label>

          <label className={`bible-pill-checkbox ${showBohairicVocalized ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={showBohairicVocalized}
              onChange={(e) => setShowBohairicVocalized(e.target.checked)}
            />
            <span>Ϧ̇ {isArabicUi ? 'بحيري مشكول' : 'Bohairic (Vocalized)'}</span>
          </label>

          <label className={`bible-pill-checkbox ${showBohairicPlain ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={showBohairicPlain}
              onChange={(e) => setShowBohairicPlain(e.target.checked)}
            />
            <span>Ϧ {isArabicUi ? 'بحيري قياسي' : 'Bohairic (Plain)'}</span>
          </label>

          <label className={`bible-pill-checkbox ${showArabicNav ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={showArabicNav}
              onChange={(e) => setShowArabicNav(e.target.checked)}
            />
            <BookOpen size={14} style={{ color: 'var(--accent-gold)' }} />
            <span>{isArabicUi ? 'عربي (كتاب الحياة)' : 'Arabic (Ketab El Hayat)'}</span>
          </label>

          <label className={`bible-pill-checkbox ${showArabicSvd ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={showArabicSvd}
              onChange={(e) => setShowArabicSvd(e.target.checked)}
            />
            <ScrollText size={14} style={{ color: 'var(--accent-gold)' }} />
            <span>{isArabicUi ? 'عربي (فانديك)' : 'Arabic (Van Dyck)'}</span>
          </label>

          <label className={`bible-pill-checkbox ${showEnglishKjv ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={showEnglishKjv}
              onChange={(e) => setShowEnglishKjv(e.target.checked)}
            />
            <Globe size={14} style={{ color: 'var(--accent-blue)' }} />
            <span>English (KJV)</span>
          </label>
        </div>

        {/* Content Area */}
        <div ref={contentRef} className={`bible-modal-body font-${fontSize}`}>
          {searchMode ? (
            /* Search Results View */
            <div className="bible-search-view">
              <div className="bible-search-header">
                <h3>
                  {isArabicUi ? `نتائج البحث عن: "${searchQuery}"` : `Scripture search results for: "${searchQuery}"`}
                </h3>
                <span className="bible-result-count">
                  {searchResults.length} {isArabicUi ? 'آية مطابقة' : 'matching verses'}
                </span>
                <button type="button" className="bible-back-btn" onClick={clearSearch}>
                  ← {isArabicUi ? 'العودة لقراءة الإصحاح' : 'Back to Chapter'}
                </button>
              </div>

              {isSearching ? (
                <div className="bible-loading-state">
                  <div className="spinner"></div>
                  <span>{isArabicUi ? 'جاري البحث في الآيات...' : 'Searching verses...'}</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="bible-empty-state">
                  <span className="empty-icon">🔍</span>
                  <p>{isArabicUi ? 'لم يتم العثور على آيات مطابقة.' : 'No matching verses found.'}</p>
                </div>
              ) : (
                <div className="bible-verses-list">
                  {searchResults.map((v) => (
                    <div key={v.verse_id} className="bible-verse-card">
                      <div className="verse-header">
                        <span className="verse-badge">
                          {isArabicUi ? `${v.book_name_ar} ${v.chapter}:${v.verse}` : `${v.book_name_en} ${v.chapter}:${v.verse}`}
                        </span>
                        <button
                          type="button"
                          className="verse-copy-btn"
                          onClick={() => handleCopyVerse(v)}
                        >
                          {copiedId === v.verse_id ? '✓ ' + (isArabicUi ? 'تم النسخ' : 'Copied') : '📋 ' + (isArabicUi ? 'نسخ' : 'Copy')}
                        </button>
                      </div>

                      <div className="verse-body-grid">
                        {v.coptic_sahidic && (
                          <div className="verse-dialect-row sahidic">
                            <span className="dialect-tag-badge">Ϩ Sahidic</span>
                            <p className="coptic-verse-text coptic-font">{renderCopticTokens(v.coptic_sahidic)}</p>
                          </div>
                        )}

                        {v.coptic_bohairic && (
                          <div className="verse-dialect-row bohairic">
                            <span className="dialect-tag-badge">Ϧ Bohairic</span>
                            <p className="coptic-verse-text coptic-font">{renderCopticTokens(v.coptic_bohairic)}</p>
                          </div>
                        )}

                        {v.arabic_nav && (
                          <div className="verse-dialect-row arabic">
                            <span className="dialect-tag-badge">عربي</span>
                            <p className="arabic-verse-text" dir="rtl">{v.arabic_nav}</p>
                          </div>
                        )}

                        {v.english_kjv && (
                          <div className="verse-dialect-row english">
                            <span className="dialect-tag-badge">English</span>
                            <p className="english-verse-text">{v.english_kjv}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : loading ? (
            /* Loading State */
            <div className="bible-loading-state">
              <div className="spinner"></div>
              <span>
                {isArabicUi
                  ? `جاري تحميل ${currentBook.name_ar} (الإصحاح ${selectedChapter})...`
                  : `Loading ${currentBook.name_en} Chapter ${selectedChapter}...`}
              </span>
            </div>
          ) : verses.length === 0 ? (
            /* Empty State */
            <div className="bible-empty-state">
              <span className="empty-icon">📖</span>
              <p>{isArabicUi ? 'لا توجد نصوص متوفرة لهذا الإصحاح.' : 'No text available for this chapter.'}</p>
            </div>
          ) : (
            /* Standard Chapter Reading View */
            <div className={`bible-chapter-view view-${viewMode}`}>
              {/* Chapter Banner */}
              <div className="bible-chapter-banner">
                <div className="chapter-coptic-title coptic-font">
                  {currentBook.name_cop} : ⲕⲉⲫ {selectedChapter}
                </div>
                <h1 className="chapter-main-title">
                  {isArabicUi ? `${currentBook.name_ar} - الإصحاح ${selectedChapter}` : `${currentBook.name_en} Chapter ${selectedChapter}`}
                </h1>
                <div className="chapter-hint">
                  💡 {isArabicUi ? 'انقر على أي كلمة قبطية للبحث المباشر عن معناها وجذورها' : 'Click on any Coptic word to look up its definition and roots instantly'}
                </div>
              </div>

              {/* Verses Container */}
              <div className="bible-verses-list">
                {verses.map((v) => (
                  <div key={v.verse_id} className="bible-verse-card">
                    <div className="verse-card-top">
                      <span className="verse-num-badge">{v.verse}</span>
                      <button
                        type="button"
                        className="verse-copy-btn"
                        onClick={() => handleCopyVerse(v)}
                        title={isArabicUi ? 'نسخ الآية بكافة الترجمات' : 'Copy verse with translations'}
                      >
                        {copiedId === v.verse_id ? '✓ ' + (isArabicUi ? 'تم النسخ' : 'Copied') : '📋 ' + (isArabicUi ? 'نسخ' : 'Copy')}
                      </button>
                    </div>

                    <div className="verse-content-container">
                      {/* Sahidic Coptic */}
                      {showSahidic && v.coptic_sahidic && (
                        <div className="verse-lang-block sahidic-block">
                          <div className="lang-label-chip">
                            <span className="chip-dot sahidic-dot"></span>
                            <span>Ϩ Sahidic (الصعيدي)</span>
                          </div>
                          <p className="verse-text coptic-font" lang="cop">
                            {renderCopticTokens(v.coptic_sahidic)}
                          </p>
                        </div>
                      )}

                      {/* Bohairic Vocalized (copcnt) */}
                      {showBohairicVocalized && v.coptic_bohairic && (
                        <div className="verse-lang-block bohairic-vocalized-block">
                          <div className="lang-label-chip">
                            <span className="chip-dot bohairic-dot"></span>
                            <span>Ϧ̇ Bohairic Vocalized (البحيري المشكول)</span>
                          </div>
                          <p className="verse-text coptic-font" lang="cop">
                            {renderCopticTokens(v.coptic_bohairic)}
                          </p>
                        </div>
                      )}

                      {/* Bohairic Plain (copbhc) */}
                      {showBohairicPlain && v.coptic_bohairic_plain && (
                        <div className="verse-lang-block bohairic-plain-block">
                          <div className="lang-label-chip">
                            <span className="chip-dot bohairic-plain-dot"></span>
                            <span>Ϧ Bohairic Standard (البحيري القياسي)</span>
                          </div>
                          <p className="verse-text coptic-font" lang="cop">
                            {renderCopticTokens(v.coptic_bohairic_plain)}
                          </p>
                        </div>
                      )}

                      {/* Arabic Ketab El Hayat (NAV) */}
                      {showArabicNav && v.arabic_nav && (
                        <div className="verse-lang-block arabic-nav-block">
                          <div className="lang-label-chip">
                            <span className="chip-dot arabic-dot"></span>
                            <span>كتاب الحياة (NAV)</span>
                          </div>
                          <p className="verse-text arabic-text" dir="rtl" lang="ar">
                            {v.arabic_nav}
                          </p>
                        </div>
                      )}

                      {/* Arabic Van Dyck (SVD) */}
                      {showArabicSvd && v.arabic_svd && (
                        <div className="verse-lang-block arabic-svd-block">
                          <div className="lang-label-chip">
                            <span className="chip-dot arabic-svd-dot"></span>
                            <span>فانديك (SVD)</span>
                          </div>
                          <p className="verse-text arabic-text" dir="rtl" lang="ar">
                            {v.arabic_svd}
                          </p>
                        </div>
                      )}

                      {/* English King James (KJV) */}
                      {showEnglishKjv && v.english_kjv && (
                        <div className="verse-lang-block english-kjv-block">
                          <div className="lang-label-chip">
                            <span className="chip-dot english-dot"></span>
                            <span>English (KJV)</span>
                          </div>
                          <p className="verse-text english-text" lang="en">
                            {v.english_kjv}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Pagination Steppers */}
              <div className="bible-bottom-nav">
                <button
                  type="button"
                  className="bible-footer-btn"
                  onClick={handlePrevChapter}
                  disabled={selectedBook === books[0]?.code && selectedChapter === 1}
                >
                  ◀ {isArabicUi ? `الإصحاح السابق (${selectedChapter - 1})` : `Previous Chapter (${selectedChapter - 1})`}
                </button>
                <div className="bible-current-pos">
                  {isArabicUi ? `${currentBook.name_ar} ${selectedChapter} / ${currentBook.chapters}` : `${currentBook.name_en} ${selectedChapter} of ${currentBook.chapters}`}
                </div>
                <button
                  type="button"
                  className="bible-footer-btn"
                  onClick={handleNextChapter}
                  disabled={selectedBook === books[books.length - 1]?.code && selectedChapter === currentBook.chapters}
                >
                  {isArabicUi ? `الإصحاح التالي (${selectedChapter + 1})` : `Next Chapter (${selectedChapter + 1})`} ▶
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
