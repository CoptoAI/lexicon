import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { CopticKeyboard } from './components/CopticKeyboard';
import { SearchResults } from './components/SearchResults';
import { EntryDetailModal } from './components/EntryDetailModal';
import { TermNetworkView } from './components/TermNetworkView';
import { MorphologyAnalyzer } from './components/MorphologyAnalyzer';
import { HowToModal } from './components/HowToModal';
import { AboutModal } from './components/AboutModal';
import { WidgetModal } from './components/WidgetModal';
import { ParallelScriptureModal } from './components/ParallelScriptureModal';
import { VocabularyQuizModal } from './components/VocabularyQuizModal';
import { CopticGrammarModal } from './components/CopticGrammarModal';
import { BottomNavBar, MobileTab } from './components/BottomNavBar';
import { SavedWordsView } from './components/SavedWordsView';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { SearchFilters, DictionaryEntry, DatabaseStats } from './types/dictionary';
import { fetchStats, searchDictionary, exportAnkiDeck } from './services/api';
import { getSavedWords, subscribeSavedWords } from './services/savedWords';
import { UI_STRINGS, UiLanguage } from './utils/i18n';
import { isArabicText } from './utils/arabic';
import { useSwipeGesture } from './utils/useSwipeGesture';
import { Sun, Moon, Info, HelpCircle, Code2, Bookmark, Download, ExternalLink, RefreshCw, BookOpen } from 'lucide-react';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('search');
  const [savedCount, setSavedCount] = useState<number>(0);

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    dialect: 'any',
    pos: 'any',
    lang: 'any',
    origin: 'all',
    sortBy: 'alpha'
  });

  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const [showKeyboard, setShowKeyboard] = useState<boolean>(false);
  const [phoneticMode, setPhoneticMode] = useState<boolean>(false);

  const [selectedEntry, setSelectedEntry] = useState<DictionaryEntry | null>(null);
  const [networkWord, setNetworkWord] = useState<string | null>(null);
  const [showHowTo, setShowHowTo] = useState<boolean>(false);
  const [showAbout, setShowAbout] = useState<boolean>(false);
  const [showWidget, setShowWidget] = useState<boolean>(false);
  const [showBible, setShowBible] = useState<boolean>(false);
  const [showQuiz, setShowQuiz] = useState<boolean>(false);
  const [showGrammar, setShowGrammar] = useState<boolean>(false);
  const [bibleBook, setBibleBook] = useState<string>('JOH');
  const [bibleChapter, setBibleChapter] = useState<number>(1);

  // Compute UI Language (Arabic if lang is set to 'ar' or query is typed in Arabic)
  const isArabicActive = filters.lang === 'ar' || (filters.lang === 'any' && isArabicText(filters.query));
  const uiLang: UiLanguage = isArabicActive ? 'ar' : 'en';
  const t = UI_STRINGS[uiLang];

  // Mobile menu drag-down-to-dismiss gesture
  const { dragOffset: menuDragOffset, isDragging: isMenuDragging, touchHandlers: menuTouchHandlers } = useSwipeGesture({
    onSwipeDown: () => setMobileTab('search'),
    threshold: 80,
    enableVerticalDrag: true
  });

  // Sync theme attribute and mobile theme-color meta tag
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', theme === 'dark' ? '#0c0f17' : '#f8f6f0');
    }
  }, [theme]);

  // Sync text direction
  useEffect(() => {
    document.documentElement.setAttribute('dir', isArabicActive ? 'rtl' : 'ltr');
  }, [isArabicActive]);

  // Prevent background scrolling when modals or sheets are open
  const isAnyModalOpen =
    selectedEntry !== null ||
    networkWord !== null ||
    showHowTo ||
    showAbout ||
    showWidget ||
    showBible ||
    mobileTab === 'menu';

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAnyModalOpen]);

  useEffect(() => {
    fetchStats().then(setStats);
    setSavedCount(getSavedWords().length);
    const unsub = subscribeSavedWords((words) => setSavedCount(words.length));

    // Check URL params for direct Bible link (e.g. ?bible=JHN:1 or ?book=JHN&chapter=1)
    const urlParams = new URLSearchParams(window.location.search);
    const bibleParam = urlParams.get('bible');
    const bookParam = urlParams.get('book');
    const chParam = urlParams.get('chapter');

    if (bibleParam) {
      setShowBible(true);
      if (bibleParam.includes(':')) {
        const [b, c] = bibleParam.split(':');
        if (b) setBibleBook(b.toUpperCase());
        if (c) setBibleChapter(parseInt(c, 10) || 1);
      }
    } else if (bookParam) {
      setShowBible(true);
      setBibleBook(bookParam.toUpperCase());
      if (chParam) setBibleChapter(parseInt(chParam, 10) || 1);
    }

    return unsub;
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      searchDictionary(filters).then((res) => {
        setEntries(res.results);
        setTotalCount(res.count);
        setLoading(false);
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [filters]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleUpdateFilters = (updated: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetSearch = () => {
    setFilters({
      query: '',
      dialect: 'any',
      pos: 'any',
      lang: 'any',
      origin: 'all',
      sortBy: 'alpha'
    });
    setSelectedEntry(null);
    setNetworkWord(null);
    setMobileTab('search');
  };

  const handleInsertChar = (char: string) => {
    setFilters((prev) => ({
      ...prev,
      query: prev.query + char
    }));
  };

  const handleBackspace = () => {
    setFilters((prev) => ({
      ...prev,
      query: prev.query.slice(0, -1)
    }));
  };

  const handleSearchWordFromOther = (word: string) => {
    setMobileTab('search');
    setFilters((prev) => ({
      ...prev,
      query: word,
      dialect: 'any',
      pos: 'any',
      origin: 'all'
    }));
  };

  const handleExportAnki = () => {
    const filename = filters.query ? `coptic_${filters.query}.csv` : 'coptic_vocabulary.csv';
    exportAnkiDeck(entries, filename);
  };

  return (
    <div className={`app-container ${isArabicActive ? 'font-arabic' : ''}`}>
      <Header
        theme={theme}
        onToggleTheme={handleToggleTheme}
        stats={stats}
        onOpenBible={() => setShowBible(true)}
        onOpenQuiz={() => setShowQuiz(true)}
        onOpenGrammar={() => setShowGrammar(true)}
        onOpenHowTo={() => setShowHowTo(true)}
        onOpenAbout={() => setShowAbout(true)}
        onOpenWidget={() => setShowWidget(true)}
        onResetSearch={handleResetSearch}
        t={t}
      />

      <main>
        {/* View Mode: Saved Words or Main Search */}
        {mobileTab === 'saved' ? (
          <section style={{ maxWidth: '920px', margin: '0 auto', width: '100%' }}>
            <SavedWordsView
              onSelectEntry={(entry) => setSelectedEntry(entry)}
              onClose={() => setMobileTab('search')}
              t={t}
            />
          </section>
        ) : (
          <>
            <section className="search-section">
              <SearchBar
                filters={filters}
                onChangeFilters={handleUpdateFilters}
                showKeyboard={showKeyboard}
                onToggleKeyboard={() => setShowKeyboard((prev) => !prev)}
                phoneticMode={phoneticMode}
                onExportAnki={handleExportAnki}
                hasResults={entries.length > 0}
                t={t}
              />

              {/* Morphological Grammar Dissector for polymorphemic queries */}
              {filters.query && (
                <MorphologyAnalyzer
                  query={filters.query}
                  onSearchStem={handleSearchWordFromOther}
                />
              )}

              {showKeyboard && (
                <div className="keyboard-container-wrap" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <CopticKeyboard
                    onInsertChar={handleInsertChar}
                    onBackspace={handleBackspace}
                    phoneticMode={phoneticMode}
                    onTogglePhonetic={() => setPhoneticMode((prev) => !prev)}
                    onClose={() => setShowKeyboard(false)}
                  />
                </div>
              )}
            </section>

            <section style={{ maxWidth: '920px', margin: '0 auto' }}>
              <SearchResults
                entries={entries}
                totalCount={totalCount}
                loading={loading}
                onSelectEntry={(entry) => setSelectedEntry(entry)}
                onViewNetwork={(word) => setNetworkWord(word)}
                t={t}
              />
            </section>
          </>
        )}
      </main>

      {/* Entry Details Modal / Mobile Bottom Sheet */}
      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onViewNetwork={(word) => setNetworkWord(word)}
          onSearchWord={handleSearchWordFromOther}
          isArabicUi={uiLang === 'ar'}
        />
      )}

      {/* Term Network Visualization */}
      {networkWord && (
        <TermNetworkView
          word={networkWord}
          onClose={() => setNetworkWord(null)}
          onSelectWord={(newWord) => {
            setNetworkWord(newWord);
            handleSearchWordFromOther(newWord);
          }}
        />
      )}

      {/* How To Search Modal */}
      {showHowTo && (
        <HowToModal
          onClose={() => setShowHowTo(false)}
          onSearchSample={handleSearchWordFromOther}
        />
      )}

      {/* About Modal */}
      {showAbout && (
        <AboutModal onClose={() => setShowAbout(false)} />
      )}

      {/* Embed Widget Modal */}
      {showWidget && (
        <WidgetModal onClose={() => setShowWidget(false)} />
      )}

      {/* Parallel Scripture Reader Modal */}
      {showBible && (
        <ParallelScriptureModal
          isOpen={showBible}
          onClose={() => setShowBible(false)}
          onSelectWord={(word) => {
            setShowBible(false);
            handleSearchWordFromOther(word);
          }}
          initialBook={bibleBook}
          initialChapter={bibleChapter}
          isArabicUi={isArabicActive}
        />
      )}

      {/* Vocabulary Quiz & Flashcards Trainer Modal */}
      {showQuiz && (
        <VocabularyQuizModal
          isOpen={showQuiz}
          onClose={() => setShowQuiz(false)}
          isArabicUi={isArabicActive}
        />
      )}

      {/* Coptic Verb Conjugation Engine Modal */}
      {showGrammar && (
        <CopticGrammarModal
          onClose={() => setShowGrammar(false)}
          isArabicUi={isArabicActive}
        />
      )}

      {/* Mobile Menu Bottom Sheet Drawer */}
      {mobileTab === 'menu' && (
        <div className="modal-backdrop modal-backdrop-sheet" onClick={() => setMobileTab('search')}>
          <div
            className="modal-content modal-content-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '500px',
              transform: isMenuDragging && menuDragOffset > 0 ? `translateY(${menuDragOffset}px)` : undefined,
              transition: isMenuDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: isMenuDragging && menuDragOffset > 40 ? Math.max(0.6, 1 - menuDragOffset / 400) : 1
            }}
          >
            {/* Mobile Drag Handle */}
            <div className="sheet-drag-handle-touch-zone" {...menuTouchHandlers}>
              <div className="sheet-drag-handle" />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="logo-icon" style={{ width: '36px', height: '36px', fontSize: '20px' }}>ⲁ</div>
                <h3 style={{ margin: 0, fontSize: '18px' }}>CoptoLex Menu</h3>
              </div>
              <button className="btn-clear" onClick={() => setMobileTab('search')} aria-label="Close menu">✕</button>
            </div>

            <div className="mobile-menu-grid">
              <button
                className="mobile-menu-item"
                onClick={() => {
                  setShowBible(true);
                  setMobileTab('search');
                }}
              >
                <BookOpen size={20} color="var(--accent-gold)" />
                <div className="mobile-menu-item-text">
                  <strong>{t.parallelBible}</strong>
                  <span>{isArabicActive ? 'قراءة ومقارنة نصوص العهد الجديد' : 'Read & compare Sahidic & Bohairic NT'}</span>
                </div>
              </button>

              <button
                className="mobile-menu-item"
                onClick={() => {
                  setMobileTab('saved');
                }}
              >
                <Bookmark size={20} color="var(--accent-gold)" />
                <div className="mobile-menu-item-text">
                  <strong>Saved Vocabulary &amp; Flashcards</strong>
                  <span>{savedCount} words bookmarked offline</span>
                </div>
              </button>

              <button
                className="mobile-menu-item"
                onClick={() => {
                  setShowHowTo(true);
                  setMobileTab('search');
                }}
              >
                <HelpCircle size={20} color="var(--accent-blue)" />
                <div className="mobile-menu-item-text">
                  <strong>{t.howToSearch}</strong>
                  <span>Wildcards, prefixes &amp; dialect tips</span>
                </div>
              </button>

              <button
                className="mobile-menu-item"
                onClick={() => {
                  setShowAbout(true);
                  setMobileTab('search');
                }}
              >
                <Info size={20} color="var(--accent-emerald)" />
                <div className="mobile-menu-item-text">
                  <strong>{t.aboutCoptoLex}</strong>
                  <span>BBAW, DDGLC &amp; Scriptorium source info</span>
                </div>
              </button>

              <button
                className="mobile-menu-item"
                onClick={() => {
                  setShowWidget(true);
                  setMobileTab('search');
                }}
              >
                <Code2 size={20} color="var(--accent-teal)" />
                <div className="mobile-menu-item-text">
                  <strong>{t.embedWidget}</strong>
                  <span>Get &lt;script&gt; for your website</span>
                </div>
              </button>

              <button
                className="mobile-menu-item"
                onClick={handleToggleTheme}
              >
                {theme === 'dark' ? <Sun size={20} color="var(--accent-amber)" /> : <Moon size={20} color="var(--accent-blue)" />}
                <div className="mobile-menu-item-text">
                  <strong>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</strong>
                  <span>Switch interface color scheme</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Install Banner */}
      <PwaInstallPrompt />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={mobileTab}
        onChangeTab={(tab) => setMobileTab(tab)}
        showKeyboard={showKeyboard}
        onToggleKeyboard={() => setShowKeyboard((prev) => !prev)}
        savedCount={savedCount}
        t={t}
      />

      <footer className="site-footer">
        <div>
          <span>&copy; {new Date().getFullYear()} <strong>CoptoLex</strong> by <a href="https://copto.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-gold)' }}>Copto.org</a> &bull; BBAW &bull; DDGLC &bull; Coptic Scriptorium</span>
        </div>
        <div className="footer-links">
          <a href="https://copto.org" target="_blank" rel="noopener noreferrer">Copto.org</a>
          <button
            onClick={() => setShowWidget(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, font: 'inherit', fontSize: '13px' }}
          >
            Embed Widget (&lt;script&gt;)
          </button>
          <a href="/widget-demo.html" target="_blank" rel="noopener noreferrer">Widget Demo</a>
          <a href="https://github.com/CoptoAI/lexicon" target="_blank" rel="noopener noreferrer">GitHub (CoptoAI)</a>
          <a href="https://copticscriptorium.org" target="_blank" rel="noopener noreferrer">Coptic Scriptorium</a>
          <a href="/llms.txt" target="_blank" rel="noopener noreferrer">LLMs.txt (AI)</a>
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>
        </div>
      </footer>
    </div>
  );
};
