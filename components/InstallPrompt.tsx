import React, { useState, useEffect } from 'react';
import { useTranslation } from '../utils/i18n';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallPrompt: React.FC = () => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const wasDismissed = localStorage.getItem('installPromptDismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      setDismissed(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show banner after a short delay (don't show immediately)
      setTimeout(() => {
        if (!dismissed) {
          setShowBanner(true);
        }
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (!showBanner || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="glass-lg rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="material-icons text-primary">download_for_offline</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-textLight text-sm mb-1">
              Instalar NutriScan
            </h3>
            <p className="text-textMuted text-xs mb-3">
              Adiciona à tua pantalla inicial para uma experiência completa
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 py-2 bg-gradient-to-r from-primary to-secondary rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Instalar
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 glass-sm rounded-lg text-textMuted text-xs hover:text-textLight transition-colors"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;