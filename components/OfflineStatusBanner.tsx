import React, { useState, useEffect } from 'react';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

/**
 * Componente que mostra o status de conectividade
 * Exibe banner quando offline e indica sincronização
 */
export const OfflineStatusBanner: React.FC = () => {
  const { isOnline, pendingSyncCount, lastSyncStatus } = useOfflineStatus();
  const [show, setShow] = useState(!isOnline);

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
        <div className="glass-lg m-2 rounded-2xl p-4 border border-red-500/20 bg-gradient-to-r from-red-500/10 to-orange-500/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative w-6 h-6">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse" />
                <div className="absolute inset-1 bg-red-600 rounded-full" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-red-400">Sem conexão</p>
                <p className="text-xs text-red-300/80">
                  {pendingSyncCount > 0 
                    ? `${pendingSyncCount} item(s) em espera de sincronização` 
                    : 'Funcionando offline'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShow(false)}
              className="text-red-400/60 hover:text-red-400 transition-colors"
              aria-label="Fechar"
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
        <div className="glass-lg m-2 rounded-2xl p-4 border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative w-6 h-6">
                <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full" />
                <div className="absolute inset-0 border-2 border-transparent border-t-blue-500 rounded-full animate-spin" />
              </div>
              <p className="text-sm font-semibold text-blue-300">Sincronizando dados...</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
              {pendingSyncCount} pendente{pendingSyncCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (lastSyncStatus === 'success') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 max-w-md mx-auto animate-slide-down">
        <div className="glass-lg m-2 rounded-2xl p-4 border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-green-500/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20">
                <span className="text-emerald-400 text-sm">✓</span>
              </div>
              <p className="text-sm font-semibold text-emerald-300">Dados sincronizados com sucesso</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (lastSyncStatus === 'error') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 max-w-md mx-auto animate-slide-down">
        <div className="glass-lg m-2 rounded-2xl p-4 border border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-yellow-400 text-lg">⚠</span>
              <div>
                <p className="text-sm font-semibold text-yellow-300">Erro na sincronização</p>
                <p className="text-xs text-yellow-300/80">Tentaremos novamente quando possível</p>
              </div>
            </div>
            <button
              onClick={() => setShow(false)}
              className="text-yellow-400/60 hover:text-yellow-400 transition-colors"
              aria-label="Fechar"
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
