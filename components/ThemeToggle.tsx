import React from 'react';
import { useAppStore } from '../store';
import { useTranslation } from '../utils/i18n';

const ThemeToggle: React.FC = () => {
  const theme = useAppStore(state => state.theme);
  const toggleTheme = useAppStore(state => state.toggleTheme);
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/60"
    >
      <span className="material-icons text-[18px]">
        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
};

export default ThemeToggle;
