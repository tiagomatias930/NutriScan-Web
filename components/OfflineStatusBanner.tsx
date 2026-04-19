import React, { useState, useEffect } from 'react';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { useTranslation } from '../utils/i18n';

/**
 * Componente que mostra o status de conectividade
 * Exibe banner quando offline e indica sincronização
 */
export const OfflineStatusBanner: React.FC = () => {
  const { isOnline, pendingSyncCount, lastSyncStatus } = useOfflineStatus();
  const [show, setShow] = useState(!isOnline);
  const { t } = useTranslation();

  useEffect(() => {
    setShow(!isOnline);
    
    // Auto-hide quando volta online após 3 segundos
    if (isOnline && show) {
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, show]);

  if (show && !isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 max-w-md mx-auto animate-slide-down">
        <div className="bg-white dark:bg-gray-900 m-2 rounded-2xl p-4 border border-red-200 dark:border-red-900/50 shadow-md transition-colors duration-300">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative w-6 h-6">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse" />
                <div className="absolute inset-1 bg-red-600 rounded-full" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-red-600">{t('offlineBanner.offlineTitle')}</p>
                <p className="text-xs text-red-500">
                  {pendingSyncCount > 0 
                    ? t('offlineBanner.offlinePending', { count: pendingSyncCount }) 
                    : t('offlineBanner.offlineReady')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShow(false)}
              className="text-red-400/60 hover:text-red-400 transition-colors"
              aria-label={t('offlineBanner.closeLabel')}
            >
              <span className="material-icons text-lg">close</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (lastSyncStatus === 'syncing') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 max-w-md mx-auto animate-slide-down">
        <div className="bg-white dark:bg-gray-900 m-2 rounded-2xl p-4 border border-blue-200 dark:border-blue-900/50 shadow-md transition-colors duration-300">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative w-6 h-6">
                <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full" />
                <div className="absolute inset-0 border-2 border-transparent border-t-blue-500 rounded-full animate-spin" />
              </div>
                <p className="text-sm font-semibold text-blue-600">{t('offlineBanner.syncing')}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
                {t('offlineBanner.pendingCount', { count: pendingSyncCount })}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (lastSyncStatus === 'success') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 max-w-md mx-auto animate-slide-down">
        <div className="bg-white dark:bg-gray-900 m-2 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-900/50 shadow-md transition-colors duration-300">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20">
                <span className="text-emerald-400 text-sm">✓</span>
              </div>
              <p className="text-sm font-semibold text-emerald-600">{t('offlineBanner.success')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (lastSyncStatus === 'error') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 max-w-md mx-auto animate-slide-down">
        <div className="bg-white dark:bg-gray-900 m-2 rounded-2xl p-4 border border-yellow-200 dark:border-yellow-900/50 shadow-md transition-colors duration-300">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-yellow-400 text-lg">⚠</span>
              <div>
                <p className="text-sm font-semibold text-yellow-600">{t('offlineBanner.errorTitle')}</p>
                <p className="text-xs text-yellow-700">{t('offlineBanner.errorSubtitle')}</p>
              </div>
            </div>
            <button
              onClick={() => setShow(false)}
              className="text-yellow-400/60 hover:text-yellow-400 transition-colors"
              aria-label={t('offlineBanner.closeLabel')}
            >
              <span className="material-icons text-lg">close</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default OfflineStatusBanner;
