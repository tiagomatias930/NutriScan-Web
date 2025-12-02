import React, { useState } from 'react';
import { useAppStore } from './store';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { ChatCoach } from './components/ChatCoach';
import { Scanner } from './components/Scanner';
import HydrationReminder from './components/HydrationReminder';

const App: React.FC = () => {
  const user = useAppStore((state) => state.user);
  const [currentTab, setCurrentTab] = useState<'home' | 'chat'>('home');
  const [showScanner, setShowScanner] = useState(false);

  if (!user || !user.onboardingCompleted) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-dark text-textLight font-sans relative flex flex-col max-w-md mx-auto overflow-hidden">
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
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-dark/80 to-transparent pointer-events-none"></div>
          
          <div className="glass backdrop-blur-xl border-t border-glassDark h-[80px] flex items-center justify-between px-8 pb-4 relative">
            <button 
                onClick={() => setCurrentTab('home')}
                className={`flex flex-col items-center justify-center w-16 gap-1 transition-all duration-300 ${currentTab === 'home' ? 'text-primary scale-110' : 'text-textMuted hover:text-textLight'}`}
            >
                <span className="material-icons text-3xl">home</span>
                <span className="text-[10px] font-medium"></span>
            </button>

            {/* Floating Scan Button */}
            <div className="relative -top-6">
                <button 
                    onClick={() => setShowScanner(true)}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary shadow-2xl glow-cyan flex items-center justify-center transform active:scale-95 transition-all border border-primary/50 hover:shadow-lg text-white"
                >
                    <span className="material-icons text-3xl">camera</span>
                </button>
            </div>

            <button 
                onClick={() => setCurrentTab('chat')}
                className={`flex flex-col items-center justify-center w-16 gap-1 transition-all duration-300 ${currentTab === 'chat' ? 'text-primary scale-110' : 'text-textMuted hover:text-textLight'}`}
            >
                <span className="material-icons text-3xl">chat_bubble</span>
                <span className="text-[10px] font-medium"></span>
            </button>
          </div>
      </div>

      {/* Scanner Modal */}
      {showScanner && <Scanner onClose={() => setShowScanner(false)} />}
    </div>
  );
};

export default App;