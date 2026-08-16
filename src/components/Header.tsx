import React from 'react';
import { Sun, Moon, BookOpen, Info, HelpCircle, Database } from 'lucide-react';
import { DatabaseStats } from '../types/dictionary';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  stats: DatabaseStats | null;
  onOpenHowTo: () => void;
  onOpenAbout: () => void;
  onResetSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  stats,
  onOpenHowTo,
  onOpenAbout,
  onResetSearch
}) => {
  return (
    <header className="site-header">
      <div className="logo-wrapper" onClick={onResetSearch} title="Coptic Dictionary Online Home">
        <div className="logo-icon">ⲁ</div>
        <div className="logo-title-group">
          <h1>Coptic Dictionary Online</h1>
          <p>ⲡⲗⲉⲝⲓⲕⲟⲛ ⲛ̀ϯⲁⲥⲡⲓ ⲛ̀ⲣⲉⲙⲛ̀ⲭⲏⲙⲓ &bull; Comprehensive Lexicon</p>
        </div>
      </div>

      <div className="header-actions">
        {stats && (
          <div className="btn-nav" title={`${stats.entries.toLocaleString()} entries, ${stats.lemmas.toLocaleString()} lemmas`}>
            <Database size={15} />
            <span>{stats.entries.toLocaleString()} Entries</span>
          </div>
        )}

        <button className="btn-nav" onClick={onOpenHowTo}>
          <HelpCircle size={15} />
          <span>How to Search</span>
        </button>

        <button className="btn-nav" onClick={onOpenAbout}>
          <Info size={15} />
          <span>About</span>
        </button>

        <button className="btn-icon" onClick={onToggleTheme} title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};
