import React from 'react';
import { Locale } from '../utils/localization';
import { useTranslation } from '../utils/i18n';

const LanguageSwitcher: React.FC = () => {
  const { t, locale, setLocale } = useTranslation();

  const options: Array<{ code: Locale; label: string; flag: string }> = [
    { code: 'pt', label: t('language.portuguese'), flag: '/flags/pt.svg' },
    { code: 'en', label: t('language.english'), flag: '/flags/en.svg' },
    { code: 'zh', label: t('language.mandarin'), flag: '/flags/zh.svg' },
    { code: 'fr', label: t('language.french'), flag: '/flags/fr.svg' },
  ];

  return (
    <div className="flex items-center gap-2" aria-label={t('language.tooltip')} title={t('language.tooltip')}>
      {options.map(({ code, label, flag }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          aria-label={label}
          className={`w-9 h-9 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 flex items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/60 ${
            locale === code ? 'ring-2 ring-primary border-primary' : ''
          }`}
        >
          <img src={flag} alt={label} className="w-6 h-4 rounded-sm shadow-sm" />
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
