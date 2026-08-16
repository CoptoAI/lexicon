import React from 'react';
import { Search, Keyboard, X, Download, Flame, ArrowDownAZ } from 'lucide-react';
import { SearchFilters } from '../types/dictionary';
import { POS_DESCRIPTIONS, convertLatinToCoptic } from '../utils/coptic';

interface SearchBarProps {
  filters: SearchFilters;
  onChangeFilters: (updated: Partial<SearchFilters>) => void;
  showKeyboard: boolean;
  onToggleKeyboard: () => void;
  phoneticMode: boolean;
  onExportAnki: () => void;
  hasResults: boolean;
}

const DIALECT_OPTIONS = [
  { code: 'any', label: 'All Dialects' },
  { code: 'S', label: 'S (Sahidic)' },
  { code: 'B', label: 'B (Bohairic)' },
  { code: 'A', label: 'A (Akhmimic)' },
  { code: 'F', label: 'F (Fayyumic)' },
  { code: 'M', label: 'M (Mesokemic)' },
  { code: 'L', label: 'L (Lycopolitan)' },
  { code: 'K', label: 'K (Old Coptic)' },
];

export const SearchBar: React.FC<SearchBarProps> = ({
  filters,
  onChangeFilters,
  showKeyboard,
  onToggleKeyboard,
  phoneticMode,
  onExportAnki,
  hasResults
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (phoneticMode && filters.lang === 'any') {
      val = convertLatinToCoptic(val);
    }
    onChangeFilters({ query: val });
  };

  return (
    <div className="search-card">
      <div className="search-input-wrapper">
        <Search size={22} className="search-input-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search Coptic word (e.g. ⲛⲟⲩⲧⲉ, ⲁⲅⲁⲡⲏ), English/German/French definition, or POS..."
          value={filters.query}
          onChange={handleInputChange}
          autoFocus
        />

        <div className="search-input-actions">
          {filters.query && (
            <button className="btn-clear" onClick={() => onChangeFilters({ query: '' })} title="Clear search">
              <X size={18} />
            </button>
          )}

          <button
            className={`btn-keyboard-toggle ${showKeyboard ? 'active' : ''}`}
            onClick={onToggleKeyboard}
            title="Toggle Coptic Virtual Keyboard"
          >
            <Keyboard size={16} />
            <span>Keyboard</span>
          </button>
        </div>
      </div>

      {/* Origin Filter and Sort Row */}
      <div className="filter-row" style={{ justifyContent: 'space-between' }}>
        <div className="filter-group">
          <span className="filter-label">Origin:</span>
          <div className="dialect-pills">
            <button
              className={`dialect-pill ${filters.origin === 'all' ? 'active' : ''}`}
              onClick={() => onChangeFilters({ origin: 'all' })}
            >
              All Lexicon (11,272)
            </button>
            <button
              className={`dialect-pill ${filters.origin === 'egyptian' ? 'active' : ''}`}
              onClick={() => onChangeFilters({ origin: 'egyptian' })}
              title="Etymologically Egyptian Heritage words (BBAW)"
            >
              🏺 Egyptian Roots
            </button>
            <button
              className={`dialect-pill ${filters.origin === 'greek' ? 'active' : ''}`}
              onClick={() => onChangeFilters({ origin: 'greek' })}
              title="Greek Loanwords in Coptic (DDGLC)"
            >
              🏛️ Greek Loanwords
            </button>
          </div>
        </div>

        {/* Sort and Anki Export */}
        <div className="filter-group" style={{ marginLeft: 'auto' }}>
          <span className="filter-label">Sort:</span>
          <button
            className={`btn-nav ${filters.sortBy === 'alpha' ? 'active' : ''}`}
            style={{ padding: '4px 10px', fontSize: '12px' }}
            onClick={() => onChangeFilters({ sortBy: 'alpha' })}
            title="Sort Alphabetically"
          >
            <ArrowDownAZ size={14} />
            <span>A-Z</span>
          </button>
          <button
            className={`btn-nav ${filters.sortBy === 'freq' ? 'active' : ''}`}
            style={{ padding: '4px 10px', fontSize: '12px' }}
            onClick={() => onChangeFilters({ sortBy: 'freq' })}
            title="Sort by Corpus Frequency"
          >
            <Flame size={14} color="var(--accent-amber)" />
            <span>Frequency</span>
          </button>

          {hasResults && (
            <button
              className="btn-nav"
              style={{ padding: '4px 10px', fontSize: '12px', borderColor: 'var(--border-gold)' }}
              onClick={onExportAnki}
              title="Export filtered words to Anki Flashcard CSV deck"
            >
              <Download size={14} color="var(--accent-gold)" />
              <span>Anki Deck</span>
            </button>
          )}
        </div>
      </div>

      {/* Dialect Filter Row */}
      <div className="filter-row">
        <div className="filter-group">
          <span className="filter-label">Dialect:</span>
          <div className="dialect-pills">
            {DIALECT_OPTIONS.map((d) => (
              <button
                key={d.code}
                className={`dialect-pill ${filters.dialect === d.code ? 'active' : ''}`}
                onClick={() => onChangeFilters({ dialect: d.code })}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* POS and Language Selectors */}
      <div className="filter-row" style={{ justifyContent: 'space-between' }}>
        <div className="filter-group">
          <span className="filter-label">Part of Speech:</span>
          <select
            className="filter-select"
            value={filters.pos}
            onChange={(e) => onChangeFilters({ pos: e.target.value })}
          >
            <option value="any">Any POS Tag</option>
            {Object.entries(POS_DESCRIPTIONS).map(([tag, desc]) => (
              <option key={tag} value={tag}>
                {tag} – {desc}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <span className="filter-label">Definition Language:</span>
          <select
            className="filter-select"
            value={filters.lang}
            onChange={(e) => onChangeFilters({ lang: e.target.value as any })}
          >
            <option value="any">Any / All Languages</option>
            <option value="en">English only</option>
            <option value="de">German only (Deutsch)</option>
            <option value="fr">French only (Français)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
