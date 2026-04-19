import React from 'react';
import { useTranslation } from '../utils/i18n';
import { openInExternalBrowser, isAppGyser } from '../utils/externalBrowser';

interface AboutProps {
  onClose: () => void;
}

export const About: React.FC<AboutProps> = ({ onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] transition-colors duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('about.title')}</h2>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 transition-all"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* App Section */}
          <div>
            <h3 className="text-xl font-bold text-primary mb-3">{t('about.appTitle')}</h3>
            <p className="text-textMuted dark:text-gray-400 leading-relaxed">
              {t('about.appDescription')}
            </p>
          </div>

          {/* Features Section */}
          <div>
            <h4 className="text-lg font-semibold text-textLight dark:text-gray-100 mb-3">{t('about.features')}</h4>
            <ul className="space-y-2 text-textMuted dark:text-gray-400">
              <li className="flex items-start gap-3">
                <span className="material-icons text-primary text-sm mt-0.5 flex-shrink-0">check_circle</span>
                <span>{t('about.feature1')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-icons text-primary text-sm mt-0.5 flex-shrink-0">check_circle</span>
                <span>{t('about.feature2')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-icons text-primary text-sm mt-0.5 flex-shrink-0">check_circle</span>
                <span>{t('about.feature3')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-icons text-primary text-sm mt-0.5 flex-shrink-0">check_circle</span>
                <span>{t('about.feature4')}</span>
              </li>
            </ul>
          </div>

          {/* Developer Section */}
          <div>
            <h3 className="text-xl font-bold text-primary mb-3">{t('about.developerTitle')}</h3>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 rounded-2xl">
              <p className="text-textMuted dark:text-gray-400 leading-relaxed mb-4">
                {t('about.developerDescription')}
              </p>
              <a 
                href="https://portfolio.geniomatias.me/" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (isAppGyser()) {
                    e.preventDefault();
                    openInExternalBrowser('https://portfolio.geniomatias.me/');
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all"
              >
                <span>{t('about.visitPortfolio')}</span>
                <span className="material-icons text-sm">open_in_new</span>
              </a>
            </div>
          </div>

          {/* Privacy Policy */}
          <div>
            <a
              href="https://politicas-de-privacidade-nutriscan.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (isAppGyser()) {
                  e.preventDefault();
                  openInExternalBrowser('https://politicas-de-privacidade-nutriscan.vercel.app/');
                }
              }}
              className="inline-flex items-center gap-2 text-primary text-sm hover:text-secondary transition-colors"
            >
              <span className="material-icons text-sm">policy</span>
              <span className="underline">{t('about.privacyPolicy')}</span>
              <span className="material-icons text-xs">open_in_new</span>
            </a>
          </div>

          {/* Version Section */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
            <p className="text-xs text-textMuted text-center">
              NutriScan v1.0.0 • {new Date().getFullYear()} © {t('about.copyright')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
