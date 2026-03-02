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
      <div className="w-full max-w-2xl glass-lg rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-textLight">{t('about.title')}</h2>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full glass-lg flex items-center justify-center text-textLight hover:glass transition-all"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* App Section */}
          <div>
            <h3 className="text-xl font-bold text-primary mb-3">{t('about.appTitle')}</h3>
            <p className="text-textMuted leading-relaxed">
              {t('about.appDescription')}
            </p>
          </div>

          {/* Features Section */}
          <div>
            <h4 className="text-lg font-semibold text-textLight mb-3">{t('about.features')}</h4>
            <ul className="space-y-2 text-textMuted">
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
            <div className="glass-sm p-4 rounded-2xl">
              <p className="text-textMuted leading-relaxed mb-4">
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all"
              >
                <span>{t('about.visitPortfolio')}</span>
                <span className="material-icons text-sm">open_in_new</span>
              </a>
            </div>
          </div>

          {/* Version Section */}
          <div className="border-t border-glassMedium pt-4 mt-4">
            <p className="text-xs text-textMuted text-center">
              NutriScan v1.0.0 • {new Date().getFullYear()} © {t('about.copyright')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
