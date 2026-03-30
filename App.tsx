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
import MaintenanceBanner from './components/MaintenanceBanner';
import LoginScreen from './components/LoginScreen';
import TesterBanner from './components/TesterBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import InstallPrompt from './components/InstallPrompt';
import ConfirmData from './components/ConfirmData';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { useTranslation } from './utils/i18n';
import { UserProfile } from './types';

const App: React.FC = () => {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const { t } = useTranslation();
  const { user: authUser, isLoading: authLoading, isAuthenticated, signInWithGoogle, signOut } = useSupabaseAuth();
  const [currentTab, setCurrentTab] = useState<'home' | 'chat'>('home');
  const [showScanner, setShowScanner] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(true);
  const [showTesterBanner, setShowTesterBanner] = useState(() => {
    return localStorage.getItem('testerBannerDismissed') !== 'true';
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showConfirmData, setShowConfirmData] = useState(false);
  const [pendingGoogleData, setPendingGoogleData] = useState<{ name: string; email: string } | null>(null);

  const handleGoogleSignIn = async () => {
    setLoginError(null);
    const result = await signInWithGoogle();
    if (result.error) {
      setLoginError(result.error);
    }
  };

  const handleConfirmData = (data: UserProfile) => {
    setUser(data);
    setShowConfirmData(false);
    setPendingGoogleData(null);
  };

  useEffect(() => {
    // When user logs in with Google and doesn't have profile yet, show confirm data screen
    if (authUser && !user) {
      setPendingGoogleData({
        name: authUser.name || '',
        email: authUser.email || ''
      });
      setShowConfirmData(true);
    }
  }, [authUser, user]);

  // Show login screen if not authenticated
  if (!isAuthenticated && !authLoading) {
    return (
      <LoginScreen
        onGoogleSignIn={handleGoogleSignIn}
        isLoading={authLoading}
        error={loginError}
      />
    );
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show confirm data screen after Google login
  if (showConfirmData && pendingGoogleData) {
    return (
      <ConfirmData
        googleName={pendingGoogleData.name}
        googleEmail={pendingGoogleData.email}
        onConfirm={handleConfirmData}
        onSkip={() => {
          setShowConfirmData(false);
          setPendingGoogleData(null);
        }}
      />
    );
  }

  if (!user || !user.onboardingCompleted) {
    return <Onboarding />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-dark text-textLight font-sans relative flex flex-col max-w-md mx-auto overflow-hidden">
        {/* PWA Install Prompt */}
        <InstallPrompt />
        
        {/* Initialize Push Notifications */}
        <PushNotificationInitializer />
        
        {/* Offline Status Banner */}
        <OfflineStatusBanner />

        {/* Maintenance Warning Banner */}
        {showMaintenance && <MaintenanceBanner onClose={() => setShowMaintenance(false)} />}
        
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
        
        {/* Content Area */}
        {/* Background reminder (handles scheduling notifications) */}
        <HydrationReminder />
        <div className="flex-1 overflow-hidden relative bg-dark/50 z-10">
           <div className="h-full overflow-y-auto scroll-smooth">
              {currentTab === 'home' && <Dashboard />}
              {currentTab === 'chat' && <ChatCoach />}
           </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 w-full max-w-md z-40">
            {/* Gradient fade up for content below nav */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-dark/90 to-transparent pointer-events-none"></div>
            
            <div className="glass backdrop-blur-xl h-[90px] flex items-center justify-center gap-6 pb-4 relative">
              {/* Home Button */}
              <button 
                  onClick={() => setCurrentTab('home')}
                  className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-300 ${
                    currentTab === 'home' 
                      ? 'text-primary' 
                      : 'text-textMuted'
                  }`}
              >
                  <span className="material-icons text-2xl mb-1">home</span>
                  <span className="text-[9px] font-semibold uppercase tracking-wider">{t('navigation.home')}</span>
              </button>

              {/* Scan Button */}
              <button 
                  onClick={() => setShowScanner(true)}
                  className="flex flex-col items-center justify-center py-2 px-3 rounded-xl text-textMuted transition-all duration-300"
                  title="Scan Food"
              >
                  <span className="material-icons text-2xl mb-1">camera</span>
                  <span className="text-[9px] font-semibold uppercase tracking-wider">{t('navigation.scan')}</span>
              </button>

              {/* Chat Button */}
              <button 
                  onClick={() => setCurrentTab('chat')}
                  className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-300 ${
                    currentTab === 'chat' 
                      ? 'text-primary' 
                      : 'text-textMuted'
                  }`}
              >
                  <span className="material-icons text-2xl mb-1">chat_bubble</span>
                  <span className="text-[9px] font-semibold uppercase tracking-wider">{t('navigation.chat')}</span>
              </button>

              {/* About Button */}
              <button 
                  onClick={() => setShowAbout(true)}
                  className="flex flex-col items-center justify-center py-2 px-3 rounded-xl text-textMuted transition-all duration-300"
                  title="About"
              >
                  <span className="material-icons text-2xl mb-1">info</span>
                  <span className="text-[9px] font-semibold uppercase tracking-wider">{t('navigation.about')}</span>
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
