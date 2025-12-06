import { useEffect, useState } from 'react';
import { offlineStatusService } from '../services/offlineStatusService';

interface UseOfflineStatusReturn {
  isOnline: boolean;
  pendingSyncCount: number;
  lastSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
}

/**
 * Hook para monitorar status online/offline
 */
export const useOfflineStatus = (): UseOfflineStatusReturn => {
  const [isOnline, setIsOnline] = useState(offlineStatusService.getOnlineStatus());
  const [pendingSyncCount, setPendingSyncCount] = useState(
    offlineStatusService.getPendingSyncCount()
  );
  const [lastSyncStatus, setLastSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  useEffect(() => {
    const unsubscribe = offlineStatusService.onStatusChange((event) => {
      if (event.type === 'online') {
        setIsOnline(true);
      } else if (event.type === 'offline') {
        setIsOnline(false);
      } else if (event.type === 'sync-start') {
        setLastSyncStatus('syncing');
      } else if (event.type === 'sync-complete') {
        setLastSyncStatus('success');
        setPendingSyncCount(offlineStatusService.getPendingSyncCount());
        // Auto-reset sucesso após 3 segundos
        setTimeout(() => setLastSyncStatus('idle'), 3000);
      } else if (event.type === 'sync-error') {
        setLastSyncStatus('error');
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    isOnline,
    pendingSyncCount,
    lastSyncStatus
  };
};

export default useOfflineStatus;
