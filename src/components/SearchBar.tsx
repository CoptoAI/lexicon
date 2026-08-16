import React from 'react';
import { Search, Keyboard, X, Download, Flame, ArrowDownAZ } from 'lucide-react';
import { SearchFilters } from '../types/dictionary';
import { POS_DESCRIPTIONS, convertLatinToCoptic } from '../utils/coptic';
import { UiTranslations } from '../utils/i18n';

interface SearchBarProps {
  filters: SearchFilters;
  onChangeFilters: (updated: Partial<SearchFilters>) => void;
  showKeyboard: boolean;
  onToggleKeyboard: () => void;
  phoneticMode: boolean;
  onExportAnki: () => void;
  hasResults: boolean;
  t: UiTranslations;
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
  hasResults,
  t
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
          placeholder={t.searchPlaceholder}
          value={filters.query}
          onChange={handleInputChange}
          autoFocus
        />

        <div className="search-input-actions">
          {filters.query && (
            <button className="btn-clear" onClick={() => onChangeFilters({ query: '' })} title={t.clearSearch}>
              <X size={18} />
            </button>
          )}

          <button
            className={`btn-keyboard-toggle ${showKeyboard ? 'active' : ''}`}
            onClick={onToggleKeyboard}
            title={t.keyboard}
          >
            <Keyboard size={16} />
            <span>{t.keyboard}</span>
          </button>
        </div>
      </div>

      {/* Origin Filter and Sort Row */}
      <div className="filter-row" style={{ justifyContent: 'space-between' }}>
        <div className="filter-group">
          <span className="filter-label">{t.originLabel}</span>
          <div className="dialect-pills">
            <button
              className={`dialect-pill ${filters.origin === 'all' ? 'active' : ''}`}
              onClick={() => onChangeFilters({ origin: 'all' })}
            >
              {t.allLexicon}
            </button>
            <button
              className={`dialect-pill ${filters.origin === 'egyptian' ? 'active' : ''}`}
              onClick={() => onChangeFilters({ origin: 'egyptian' })}
              title="Etymologically Egyptian Heritage words (BBAW)"
            >
              {t.egyptianRoots}
            </button>
            <button
              className={`dialect-pill ${filters.origin === 'greek' ? 'active' : ''}`}
              onClick={() => onChangeFilters({ origin: 'greek' })}
              title="Greek Loanwords in Coptic (DDGLC)"
            >
              {t.greekLoanwords}
            </button>
          </div>
        </div>

        {/* Sort and Anki Export */}
        <div className="filter-group" style={{ marginLeft: 'auto' }}>
          <span className="filter-label">{t.sortLabel}</span>
          <button
            className={`btn-nav ${filters.sortBy === 'alpha' ? 'active' : ''}`}
            style={{ padding: '4px 10px', fontSize: '12px' }}
            onClick={() => onChangeFilters({ sortBy: 'alpha' })}
            title="Sort Alphabetically"
          >
            <ArrowDownAZ size={14} />
            <span>{t.sortAlpha}</span>
          </button>
          <button
            className={`btn-nav ${filters.sortBy === 'freq' ? 'active' : ''}`}
            style={{ padding: '4px 10px', fontSize: '12px' }}
            onClick={() => onChangeFilters({ sortBy: 'freq' })}
            title="Sort by Corpus Frequency"
          >
            <Flame size={14} color="var(--accent-amber)" />
            <span>{t.sortFreq}</span>
          </button>

          {hasResults && (
            <button
              className="btn-nav"
              style={{ padding: '4px 10px', fontSize: '12px', borderColor: 'var(--border-gold)' }}
              onClick={onExportAnki}
              title="Export filtered words to Anki Flashcard CSV deck"
            >
              <Download size={14} color="var(--accent-gold)" />
              <span>{t.exportAnki}</span>
            </button>
          )}
        </div>
      </div>

      {/* Dialect Filter Row */}
      <div className="filter-row">
        <div className="filter-group">
          <span className="filter-label">{t.dialectLabel}</span>
          <div className="dialect-pills">
            {DIALECT_OPTIONS.map((d) => (
              <button
                key={d.code}
                className={`dialect-pill ${filters.dialect === d.code ? 'active' : ''}`}
                onClick={() => onChangeFilters({ dialect: d.code })}
              >
                {d.code === 'any' ? t.allDialects : d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* POS and Language Selectors */}
      <div className="filter-row" style={{ justifyContent: 'space-between' }}>
        <div className="filter-group">
          <span className="filter-label">{t.posLabel}</span>
          <select
            className="filter-select"
            value={filters.pos}
            onChange={(e) => onChangeFilters({ pos: e.target.value })}
          >
            <option value="any">{t.anyPos}</option>
            {Object.entries(POS_DESCRIPTIONS).map(([tag, desc]) => (
              <option key={tag} value={tag}>
                {tag} – {desc}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <span className="filter-label">{t.langLabel}</span>
          <select
            className="filter-select"
            value={filters.lang}
            onChange={(e) => onChangeFilters({ lang: e.target.value as any })}
          >
            <option value="any">{t.langAny}</option>
            <option value="ar">{t.langAr}</option>
            <option value="en">{t.langEn}</option>
            <option value="de">{t.langDe}</option>
            <option value="fr">{t.langFr}</option>
          </select>
        </div>
      </div>
    </div>
  );
};
