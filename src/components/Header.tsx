import React from 'react';
import { Sun, Moon, BookOpen, Info, HelpCircle, Database, Sparkles, Code2 } from 'lucide-react';
import { DatabaseStats } from '../types/dictionary';
import { UiTranslations } from '../utils/i18n';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  stats: DatabaseStats | null;
  onOpenHowTo: () => void;
  onOpenAbout: () => void;
  onOpenWidget: () => void;
  onResetSearch: () => void;
  t: UiTranslations;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  stats,
  onOpenHowTo,
  onOpenAbout,
  onOpenWidget,
  onResetSearch,
  t
}) => {
  return (
    <header className="site-header">
      <div className="logo-wrapper" onClick={onResetSearch} title={`${t.siteTitle} — ${t.siteSubtitle}`}>
        <div className="logo-icon">ⲁ</div>
        <div className="logo-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '22px', letterSpacing: '0.5px' }}>{t.siteTitle}</h1>
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
          <p>{t.siteSubtitle}</p>
        </div>
      </div>

      <div className="header-actions">
        {stats && (
          <div className="btn-nav" title={`${stats.entries.toLocaleString()} entries, ${stats.lemmas.toLocaleString()} lemmas`}>
            <Database size={15} />
            <span>{t.headerEntries}</span>
          </div>
        )}

        <button
          className="btn-nav"
          onClick={onOpenWidget}
          style={{ borderColor: 'var(--border-gold)', color: 'var(--accent-gold)' }}
          title="Embed Coptic Word Tooltips on any website"
        >
          <Code2 size={15} />
          <span>{t.embedWidget}</span>
        </button>

        <button className="btn-nav" onClick={onOpenHowTo}>
          <HelpCircle size={15} />
          <span>{t.howToSearch}</span>
        </button>

        <button className="btn-nav" onClick={onOpenAbout}>
          <Info size={15} />
          <span>{t.aboutCoptoLex}</span>
        </button>

        <button className="btn-icon" onClick={onToggleTheme} title={theme === 'dark' ? t.toggleThemeLight : t.toggleThemeDark}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};
