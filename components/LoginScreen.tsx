import React, { useState } from 'react';
import { useTranslation } from '../utils/i18n';
import LanguageSwitcher from './LanguageSwitcher';

const TESTER_FORM_URL = 'https://forms.gle/KZjrcEMQjrPLWFNP9';

interface LoginScreenProps {
  onGoogleSignIn: () => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onGoogleSignIn, isLoading, error }) => {
  const { t } = useTranslation();
  const [animating, setAnimating] = useState(false);

  const handleGoogleClick = async () => {
    setAnimating(true);
    try {
      await onGoogleSignIn();
    } catch {
      // error handled by parent
    } finally {
      setAnimating(false);
    }
  };

  const handleTesterRequest = () => {
    window.open(TESTER_FORM_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-dark text-textLight flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-secondary/10 to-primary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none animate-pulse"></div>

      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Logo / App Icon */}
          <img src="/iconApp.png" alt="NutriScan Logo" className="w-12 h-12 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 shadow-lg shadow-primary/20" />

        {/* App Name */}
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          <span className="text-primary text-glow">Nutri</span>
          <span className="text-textLight">Scan</span>
        </h1>
        <p className="text-textMuted text-center text-sm mb-6 leading-relaxed max-w-xs">
          {t('login.subtitle')}
        </p>

        {/* Tester Notice Banner */}
        <div className="w-full glass rounded-2xl p-4 mb-6 border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <span className="material-icons text-amber-400 text-xl mt-0.5">science</span>
            <div>
              <h3 className="text-amber-400 font-semibold text-sm mb-1">{t('login.testerTitle')}</h3>
              <p className="text-textMuted text-xs leading-relaxed">{t('login.testerDescription')}</p>
            </div>
          </div>
        </div>

        {/* Request Access Button (primary - redirects to Google Form) */}
        <button
          onClick={handleTesterRequest}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl 
                     bg-gradient-to-r from-primary to-secondary text-dark font-bold text-base
                     hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/20 mb-3"
        >
          <span className="material-icons text-xl">how_to_reg</span>
          <span>{t('login.requestAccess')}</span>
        </button>

        {/* Divider */}
        <div className="w-full flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-glassMedium"></div>
          <span className="text-textMuted text-[11px] uppercase tracking-wider">{t('login.alreadyTester')}</span>
          <div className="flex-1 h-px bg-glassMedium"></div>
        </div>

        {/* Google Sign-In Button (secondary - for existing testers) */}
        <button
          onClick={handleGoogleClick}
          disabled={isLoading || animating}
          className="w-full glass-lg flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl border border-primary/20 
                     hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 
                     disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isLoading || animating ? (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          <span className="text-textLight font-semibold text-sm group-hover:text-primary transition-colors">
            {isLoading || animating ? t('common.loading') : t('login.googleButton')}
          </span>
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-4 w-full glass rounded-xl p-3 border border-red-500/30 bg-red-500/10">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Google Fit info */}
        <div className="mt-6 flex items-center gap-2 text-textMuted text-xs">
          <span className="material-icons text-sm text-primary/60">fitness_center</span>
          <span>{t('login.googleFitInfo')}</span>
        </div>

        {/* Terms */}
        <p className="mt-4 text-textMuted text-[10px] text-center leading-relaxed max-w-xs">
          {t('login.terms')}
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
