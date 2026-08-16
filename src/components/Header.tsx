import React from 'react';
import { Sun, Moon, BookOpen, Info, HelpCircle, Database, Sparkles } from 'lucide-react';
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
      <div className="logo-wrapper" onClick={onResetSearch} title="CoptoLex — Comprehensive Coptic Lexicon (lexicon.copto.org)">
        <div className="logo-icon">ⲁ</div>
        <div className="logo-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '22px', letterSpacing: '0.5px' }}>CoptoLex</h1>
            <span style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.05))',
              border: '1px solid var(--border-gold)',
              color: 'var(--accent-gold)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.6px'
            }}>
              by Copto.org
            </span>
          </div>
          <p>ⲡⲗⲉⲝⲓⲕⲟⲛ ⲛ̀ϯⲁⲥⲡⲓ ⲛ̀ⲣⲉⲙⲛ̀ⲭⲏⲙⲓ &bull; Comprehensive Coptic Lexicon</p>
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
          <span>About CoptoLex</span>
        </button>

        <button className="btn-icon" onClick={onToggleTheme} title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};
