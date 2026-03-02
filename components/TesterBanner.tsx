import React, { useState } from 'react';
import { useTranslation } from '../utils/i18n';
import { openInExternalBrowser } from '../utils/externalBrowser';

const TESTER_FORM_URL = 'https://forms.gle/gnoRCf3U36SvkNpBA';

interface TesterBannerProps {
  onClose: () => void;
}

const TesterBanner: React.FC<TesterBannerProps> = ({ onClose }) => {
  const { t } = useTranslation();

  const handleApply = () => {
    openInExternalBrowser(TESTER_FORM_URL);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
      <div className="relative w-full max-w-sm glass-lg border border-primary/30 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Glow background */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full glass-sm flex items-center justify-center text-textMuted hover:text-textLight transition-colors z-10"
        >
          <span className="material-icons text-lg">close</span>
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30 glow-cyan">
            <span className="material-icons text-white text-3xl">science</span>
          </div>
        </div>

        {/* Beta badge */}
        <div className="flex justify-center mb-3">
          <span className="px-3 py-1 bg-primary/20 border border-primary/40 rounded-full text-primary text-[10px] font-bold uppercase tracking-widest">
            {t('tester.badge')}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-textLight text-center mb-2 relative z-10">
          {t('tester.title')}
        </h2>

        {/* Message */}
        <p className="text-textMuted text-center text-sm leading-relaxed mb-6 relative z-10">
          {t('tester.description')}
        </p>

        {/* Benefits */}
        <div className="space-y-2 mb-6 relative z-10">
          <div className="flex items-center gap-3 text-sm">
            <span className="material-icons text-primary text-base">early_on</span>
            <span className="text-textMuted">{t('tester.benefit1')}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="material-icons text-primary text-base">bug_report</span>
            <span className="text-textMuted">{t('tester.benefit2')}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="material-icons text-primary text-base">favorite</span>
            <span className="text-textMuted">{t('tester.benefit3')}</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleApply}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-base
                     hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 flex items-center justify-center gap-2
                     active:scale-[0.98] transform relative z-10"
        >
          <span>{t('tester.applyButton')}</span>
          <span className="material-icons text-lg">open_in_new</span>
        </button>

        {/* Later link */}
        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-textMuted text-sm font-medium hover:text-textLight transition-colors relative z-10"
        >
          {t('tester.later')}
        </button>
      </div>
    </div>
  );
};

export default TesterBanner;
