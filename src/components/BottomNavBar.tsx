import React from 'react';
import { Search, Keyboard, Bookmark, ScrollText, Menu, Sparkles } from 'lucide-react';
import { UiTranslations } from '../utils/i18n';

export type MobileTab = 'search' | 'saved' | 'concordance' | 'menu';

interface BottomNavBarProps {
  activeTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
  showKeyboard: boolean;
  onToggleKeyboard: () => void;
  savedCount: number;
  t: UiTranslations;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onChangeTab,
  showKeyboard,
  onToggleKeyboard,
  savedCount,
  t
}) => {
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch (e) {}
    }
  };

  const handleTabClick = (tab: MobileTab) => {
    triggerHaptic();
    onChangeTab(tab);
  };

  const handleKeyboardClick = () => {
    triggerHaptic();
    onToggleKeyboard();
  };

  return (
    <nav className="bottom-nav-bar" aria-label="Mobile Navigation">
      <button
        className={`bottom-nav-item ${activeTab === 'search' && !showKeyboard ? 'active' : ''}`}
        onClick={() => handleTabClick('search')}
        aria-label="Search"
      >
        <div className="bottom-nav-icon-wrap">
          <Search size={20} />
        </div>
        <span>Search</span>
      </button>

      <button
        className={`bottom-nav-item ${showKeyboard ? 'active' : ''}`}
        onClick={handleKeyboardClick}
        aria-label="Coptic Keyboard"
      >
        <div className="bottom-nav-icon-wrap">
          <Keyboard size={20} />
        </div>
        <span>Keyboard</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'saved' ? 'active' : ''}`}
        onClick={() => handleTabClick('saved')}
        aria-label="Saved Words"
      >
        <div className="bottom-nav-icon-wrap">
          <Bookmark size={20} />
          {savedCount > 0 && <span className="bottom-nav-badge">{savedCount}</span>}
        </div>
        <span>Saved</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'menu' ? 'active' : ''}`}
        onClick={() => handleTabClick('menu')}
        aria-label="Menu"
      >
        <div className="bottom-nav-icon-wrap">
          <Menu size={20} />
        </div>
        <span>Menu</span>
      </button>
    </nav>
  );
};
