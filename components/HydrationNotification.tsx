import React, { useState, useEffect } from 'react';
import { useTranslation } from '../utils/i18n';

interface HydrationNotificationProps {
  isVisible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
}

export const HydrationNotification: React.FC<HydrationNotificationProps> = ({ isVisible, onDismiss, onConfirm }) => {
  const [show, setShow] = useState(isVisible);
  const { t } = useTranslation();

  useEffect(() => {
    setShow(isVisible);
    
    // Auto-dismiss after 8 seconds
    if (isVisible) {
      const timer = setTimeout(() => {
        setShow(false);
        onDismiss();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  if (!show) return null;

  const handleConfirm = () => {
    setShow(false);
    onConfirm();
  };

  const handleDismiss = () => {
    setShow(false);
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${
          show ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleDismiss}
      />

      {/* Notification Card */}
      <div 
        className={`relative z-50 pointer-events-auto transform transition-all duration-300 ${
          show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="glass-lg rounded-3xl p-8 max-w-sm mx-4 shadow-2xl">
          {/* Header with animation */}
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24">
              {/* Outer pulsing circle */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 opacity-20 animate-pulse" />
              {/* Middle circle */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 opacity-10 animate-pulse" style={{ animationDelay: '0.15s' }} />
              {/* Inner icon circle */}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 glow-cyan">
                <span className="material-icons text-white text-5xl">opacity</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-textLight mb-2 leading-tight text-glow">
            {t('hydrationNotification.title')}
          </h2>
          
          {/* Subtitle */}
          <p className="text-center text-textMuted text-sm mb-2">
            {t('hydrationNotification.subtitle')}
          </p>

          {/* Message */}
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-4 mb-6">
            <p className="text-center text-textLight leading-relaxed">
              {t('hydrationNotification.message')}
            </p>
          </div>

          {/* Hydration tips */}
          <div className="space-y-2 mb-6">
            <div className="flex items-start gap-2 text-xs text-textMuted">
              <span className="text-cyan-400 mt-0.5">✓</span>
              <span>{t('hydrationNotification.tip1')}</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-textMuted">
              <span className="text-cyan-400 mt-0.5">✓</span>
              <span>{t('hydrationNotification.tip2')}</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-textMuted">
              <span className="text-cyan-400 mt-0.5">✓</span>
              <span>{t('hydrationNotification.tip3')}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 py-3 rounded-xl font-semibold text-textMuted bg-glassDark hover:bg-glass transition-all"
            >
              {t('hydrationNotification.dismiss')}
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-xl font-semibold text-dark bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/30 glow-cyan"
            >
              {t('hydrationNotification.confirm')}
            </button>
          </div>

          {/* Auto-dismiss indicator */}
          <div className="mt-4 text-center text-xs text-textMuted">
            {t('hydrationNotification.autoDismiss')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HydrationNotification;
