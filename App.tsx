import React, { useState } from 'react';
import { useAppStore } from './store';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { ChatCoach } from './components/ChatCoach';
import { Scanner } from './components/Scanner';

const App: React.FC = () => {
  const user = useAppStore((state) => state.user);
  const [currentTab, setCurrentTab] = useState<'home' | 'chat'>('home');
  const [showScanner, setShowScanner] = useState(false);

  if (!user || !user.onboardingCompleted) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-dark text-white font-sans relative flex flex-col max-w-md mx-auto shadow-2xl shadow-black overflow-hidden">
      
      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative bg-dark">
         <div className="h-full overflow-y-auto scroll-smooth">
            {currentTab === 'home' && <Dashboard />}
            {currentTab === 'chat' && <ChatCoach />}
         </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 w-full max-w-md z-40">
          {/* Gradient fade up for content below nav */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
          
          <div className="bg-card/90 backdrop-blur-md border-t border-white/5 h-[80px] flex items-center justify-between px-8 pb-4 relative">
            <button 
                onClick={() => setCurrentTab('home')}
                className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${currentTab === 'home' ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <span className="material-icons text-2xl">home</span>
                <span className="text-[10px] font-medium">Home</span>
            </button>

            {/* Floating Scan Button */}
            <div className="relative -top-6">
                <button 
                    onClick={() => setShowScanner(true)}
                    className="w-16 h-16 rounded-full bg-primary shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center transform active:scale-95 transition-all border-4 border-dark hover:bg-emerald-400 text-black"
                >
                    <span className="material-icons text-3xl">qr_code_scanner</span>
                </button>
            </div>

            <button 
                onClick={() => setCurrentTab('chat')}
                className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${currentTab === 'chat' ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <span className="material-icons text-2xl">chat_bubble</span>
                <span className="text-[10px] font-medium">Coach</span>
            </button>
          </div>
      </div>

      {/* Scanner Modal */}
      {showScanner && <Scanner onClose={() => setShowScanner(false)} />}
    </div>
  );
};

export default App;