import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Info, HelpCircle, Database, Code2, BookOpen, GraduationCap, ChevronDown, Wrench, Table } from 'lucide-react';
import { DatabaseStats } from '../types/dictionary';
import { UiTranslations } from '../utils/i18n';
import { OfflineIndicator } from './OfflineIndicator';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  stats: DatabaseStats | null;
  onOpenBible: () => void;
  onOpenQuiz?: () => void;
  onOpenGrammar?: () => void;
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
  onOpenBible,
  onOpenQuiz,
  onOpenGrammar,
  onOpenHowTo,
  onOpenAbout,
  onOpenWidget,
  onResetSearch,
  t
}) => {
  const [openDropdown, setOpenDropdown] = useState<'tools' | 'help' | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const isArabic = t.howToSearch.includes('كيفية');

  // Dismiss dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="site-header">
      {/* Brand Logo */}
      <div className="logo-wrapper" onClick={onResetSearch} title={`${t.siteTitle} — ${t.siteSubtitle}`}>
        <div className="logo-icon">ⲁ</div>
        <div className="logo-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '22px', letterSpacing: '0.5px' }}>{t.siteTitle}</h1>
            <span className="logo-badge-pill">by Copto.org</span>
          </div>
          <p>{t.siteSubtitle}</p>
        </div>
      </div>

      {/* Header Navigation Actions */}
      <div className="header-actions" ref={dropdownRef}>
        {/* Offline Status */}
        <OfflineIndicator />

        {/* Quick Shortcut: Parallel Scripture Reader */}
        <button
          className="btn-nav header-desktop-btn bible-nav-highlight-btn"
          onClick={onOpenBible}
          title="Parallel Coptic New Testament (Sahidic & Bohairic with Arabic & English)"
        >
          <BookOpen size={15} />
          <span>{t.parallelBible}</span>
        </button>

        {/* 1. Tools Dropdown Menu */}
        <div className="header-dropdown-wrapper">
          <button
            type="button"
            className={`btn-nav header-dropdown-trigger ${openDropdown === 'tools' ? 'active' : ''}`}
            onClick={() => setOpenDropdown(prev => (prev === 'tools' ? null : 'tools'))}
            style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#f59e0b' }}
          >
            <Wrench size={15} />
            <span>{isArabic ? 'الأدوات والخدمات' : 'Tools & Features'}</span>
            <ChevronDown size={14} className={`dropdown-chevron ${openDropdown === 'tools' ? 'open' : ''}`} />
          </button>

          {openDropdown === 'tools' && (
            <div className="header-dropdown-menu">
              <button
                type="button"
                className="dropdown-item"
                onClick={() => { onOpenBible(); setOpenDropdown(null); }}
              >
                <BookOpen size={16} className="dropdown-item-icon gold" />
                <div className="dropdown-item-text">
                  <strong>{t.parallelBible}</strong>
                  <span>{isArabic ? 'مقارنة قبطي صحيدي وبحيري وعربي وانجليزي' : 'Parallel Sahidic, Bohairic, Arabic & KJV'}</span>
                </div>
              </button>

              {onOpenQuiz && (
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => { onOpenQuiz(); setOpenDropdown(null); }}
                >
                  <GraduationCap size={16} className="dropdown-item-icon gold" />
                  <div className="dropdown-item-text">
                    <strong>{isArabic ? 'تدريب واختبار المفردات' : 'Vocabulary & Quiz Trainer'}</strong>
                    <span>{isArabic ? 'بطاقات استذكار واختبارات تفاعلية' : 'Interactive flashcards & multiple-choice quiz'}</span>
                  </div>
                </button>
              )}

              {onOpenGrammar && (
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => { onOpenGrammar(); setOpenDropdown(null); }}
                >
                  <Table size={16} className="dropdown-item-icon gold" />
                  <div className="dropdown-item-text">
                    <strong>{isArabic ? 'قواعد وتصاريف الأفعال' : 'Verb Conjugation Engine'}</strong>
                    <span>{isArabic ? 'توليد تصاريف الأفعال في كافة الأزمنة' : 'Full verb paradigm table generator'}</span>
                  </div>
                </button>
              )}

              <button
                type="button"
                className="dropdown-item"
                onClick={() => { onOpenWidget(); setOpenDropdown(null); }}
              >
                <Code2 size={16} className="dropdown-item-icon gold" />
                <div className="dropdown-item-text">
                  <strong>{t.embedWidget}</strong>
                  <span>{isArabic ? 'تضمين قاموس قبطي في موقعك' : 'Embed Coptic tooltip widgets'}</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 2. Help & Info Dropdown Menu */}
        <div className="header-dropdown-wrapper">
          <button
            type="button"
            className={`btn-nav header-dropdown-trigger ${openDropdown === 'help' ? 'active' : ''}`}
            onClick={() => setOpenDropdown(prev => (prev === 'help' ? null : 'help'))}
          >
            <HelpCircle size={15} />
            <span>{isArabic ? 'المساعدة والمعلومات' : 'Help & Info'}</span>
            <ChevronDown size={14} className={`dropdown-chevron ${openDropdown === 'help' ? 'open' : ''}`} />
          </button>

          {openDropdown === 'help' && (
            <div className="header-dropdown-menu">
              <button
                type="button"
                className="dropdown-item"
                onClick={() => { onOpenHowTo(); setOpenDropdown(null); }}
              >
                <HelpCircle size={16} className="dropdown-item-icon blue" />
                <div className="dropdown-item-text">
                  <strong>{t.howToSearch}</strong>
                  <span>{isArabic ? 'طرق البحث وقواعد الإدخال والكيبورد' : 'Search tips, wildcards & keyboard input'}</span>
                </div>
              </button>

              <button
                type="button"
                className="dropdown-item"
                onClick={() => { onOpenAbout(); setOpenDropdown(null); }}
              >
                <Info size={16} className="dropdown-item-icon blue" />
                <div className="dropdown-item-text">
                  <strong>{t.aboutCoptoLex}</strong>
                  <span>{isArabic ? 'المصادر الأكاديمية والمشاريع المعتمدة' : 'Academic project details & sources'}</span>
                </div>
              </button>

              {stats && (
                <div className="dropdown-item-stat">
                  <Database size={16} className="dropdown-item-icon green" />
                  <div className="dropdown-item-text">
                    <strong>{stats.entries.toLocaleString()} {isArabic ? 'مدخلة قاموسية' : 'Lexicon Entries'}</strong>
                    <span>{stats.lemmas.toLocaleString()} {isArabic ? 'جذر وجملة استشهادية' : 'lemmas & collocates'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          className="btn-icon"
          onClick={onToggleTheme}
          title={theme === 'dark' ? t.toggleThemeLight : t.toggleThemeDark}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};
