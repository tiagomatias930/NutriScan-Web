import React, { useEffect, useState } from 'react';
import { createInitialUserProfile, useAppStore } from './store';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { ChatCoach } from './components/ChatCoach';
import { Scanner } from './components/Scanner';
import { About } from './components/About';
import HydrationReminder from './components/HydrationReminder';
import PushNotificationInitializer from './components/PushNotificationInitializer';
import OfflineStatusBanner from './components/OfflineStatusBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useTranslation } from './utils/i18n';
import { UserProfile } from './types';

const App: React.FC = () => {
  const user = useAppStore((state) => state.user);
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const [currentTab, setCurrentTab] = useState<'home' | 'chat'>('home');
  const [showScanner, setShowScanner] = useState(false);
  const [showAbout, setShowAbout] = useState(false);


  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (!user || !user.onboardingCompleted) {
    return <Onboarding />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans relative flex flex-col max-w-md mx-auto overflow-hidden transition-colors duration-300">

        {/* Initialize Push Notifications */}
        <PushNotificationInitializer />

        {/* Offline Status Banner */}
        <OfflineStatusBanner />

        {/* Content Area */}
        {/* Background reminder (handles scheduling notifications) */}
        <HydrationReminder />
        <div className="flex-1 overflow-hidden relative z-10">
          <div className="h-full overflow-y-auto scroll-smooth">
            {currentTab === 'home' && <Dashboard />}
            {currentTab === 'chat' && <ChatCoach />}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 w-full max-w-md z-40">
          <div className="bg-primary text-white shadow-[0_-8px_20px_rgba(31,170,112,0.15)] dark:shadow-[0_-8px_20px_rgba(0,0,0,0.5)] h-[80px] rounded-t-3xl flex items-center justify-around px-4 pb-2 relative">
            {/* Home Button */}
            <button
              onClick={() => setCurrentTab('home')}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all duration-300 ${currentTab === 'home'
                ? 'bg-white/20'
                : 'opacity-70 hover:opacity-100'
                }`}
            >
              <span className="material-icons text-2xl mb-1">home</span>
              <span className="text-[10px] font-semibold">{t('navigation.home')}</span>
            </button>

            {/* Scan Button */}
            <button
              onClick={() => setShowScanner(true)}
              className="flex flex-col items-center justify-center py-2 px-4 rounded-2xl opacity-70 hover:opacity-100 transition-all duration-300"
              title="Scan Food"
            >
              <span className="material-icons text-2xl mb-1">camera</span>
              <span className="text-[10px] font-semibold">{t('navigation.scan')}</span>
            </button>

            {/* Chat Button */}
            <button
              onClick={() => setCurrentTab('chat')}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all duration-300 ${currentTab === 'chat'
                ? 'bg-white/20'
                : 'opacity-70 hover:opacity-100'
                }`}
            >
              <span className="material-icons text-2xl mb-1">chat_bubble</span>
              <span className="text-[10px] font-semibold">{t('navigation.chat')}</span>
            </button>

            {/* About Button */}
            <button
              onClick={() => setShowAbout(true)}
              className="flex flex-col items-center justify-center py-2 px-4 rounded-2xl opacity-70 hover:opacity-100 transition-all duration-300"
              title="About"
            >
              <span className="material-icons text-2xl mb-1">info</span>
              <span className="text-[10px] font-semibold">{t('navigation.about')}</span>
            </button>
          </div>
        </div>

        {/* Scanner Modal */}
        {showScanner && <Scanner onClose={() => setShowScanner(false)} />}

        {/* About Modal */}
        {showAbout && <About onClose={() => setShowAbout(false)} />}
      </div>
    </ErrorBoundary>
  );
};

export default App;
