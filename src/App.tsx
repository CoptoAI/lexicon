import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { CopticKeyboard } from './components/CopticKeyboard';
import { SearchResults } from './components/SearchResults';
import { EntryDetailModal } from './components/EntryDetailModal';
import { TermNetworkView } from './components/TermNetworkView';
import { HowToModal } from './components/HowToModal';
import { AboutModal } from './components/AboutModal';
import { SearchFilters, DictionaryEntry, DatabaseStats } from './types/dictionary';
import { fetchStats, searchDictionary, exportAnkiDeck } from './services/api';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [stats, setStats] = useState<DatabaseStats | null>(null);

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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchStats().then(setStats);
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
    <div className="app-container">
      <Header
        theme={theme}
        onToggleTheme={handleToggleTheme}
        stats={stats}
        onOpenHowTo={() => setShowHowTo(true)}
        onOpenAbout={() => setShowAbout(true)}
        onResetSearch={handleResetSearch}
      />

      <main>
        <section className="search-section">
          <SearchBar
            filters={filters}
            onChangeFilters={handleUpdateFilters}
            showKeyboard={showKeyboard}
            onToggleKeyboard={() => setShowKeyboard((prev) => !prev)}
            phoneticMode={phoneticMode}
            onExportAnki={handleExportAnki}
            hasResults={entries.length > 0}
          />

          {showKeyboard && (
            <div style={{ width: '100%', maxWidth: '920px', marginTop: '14px' }}>
              <CopticKeyboard
                onInsertChar={handleInsertChar}
                onBackspace={handleBackspace}
                phoneticMode={phoneticMode}
                onTogglePhonetic={() => setPhoneticMode((prev) => !prev)}
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
          />
        </section>
      </main>

      {/* Entry Details Modal */}
      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onViewNetwork={(word) => setNetworkWord(word)}
          onSearchWord={handleSearchWordFromOther}
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

      <footer className="site-footer">
        <div>
          <span>&copy; {new Date().getFullYear()} Coptic Dictionary Online &bull; BBAW &bull; DDGLC &bull; Coptic Scriptorium</span>
        </div>
        <div className="footer-links">
          <a href="https://github.com/KELLIA/dictionary" target="_blank" rel="noopener noreferrer">GitHub Repository</a>
          <a href="https://copticscriptorium.org" target="_blank" rel="noopener noreferrer">Coptic Scriptorium</a>
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>
        </div>
      </footer>
    </div>
  );
};
