/**
 * Offline Status Service
 * Gerencia detecção de status online/offline e sincronização
 */

interface OfflineEvent {
  type: 'online' | 'offline' | 'sync-start' | 'sync-complete' | 'sync-error';
  timestamp: number;
  syncType?: 'food' | 'water' | 'all';
  message?: string;
}

type OfflineListener = (event: OfflineEvent) => void;

class OfflineStatusService {
  private isOnline = navigator.onLine;
  private listeners: Set<OfflineListener> = new Set();
  private pendingSync: Set<string> = new Set();
  private syncInProgress = false;

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Configura listeners para eventos de conectividade
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Listener para mensagens do Service Worker sobre sync completo
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_COMPLETE') {
          this.handleSyncComplete(event.data.data);
        }
      });
    }
  }

  /**
   * Callback quando voltou online
   */
  private handleOnline(): void {
    console.log('Status mudou para: ONLINE');
    this.isOnline = true;
    this.notifyListeners({
      type: 'online',
      timestamp: Date.now()
    });

    // Tenta sincronizar dados pendentes
    this.syncPendingData();
  }

  /**
   * Callback quando ficou offline
   */
  private handleOffline(): void {
    console.log('Status mudou para: OFFLINE');
    this.isOnline = false;
    this.notifyListeners({
      type: 'offline',
      timestamp: Date.now()
    });
  }

  /**
   * Callback quando sincronização foi concluída
   */
  private handleSyncComplete(data: any): void {
    const { syncType, success } = data;
    console.log(`Sync complete: ${syncType} - Success: ${success}`);

    this.pendingSync.delete(syncType);

    if (success) {
      this.notifyListeners({
        type: 'sync-complete',
        timestamp: Date.now(),
        syncType,
        message: `${syncType} sincronizado com sucesso`
      });
    } else {
      this.notifyListeners({
        type: 'sync-error',
        timestamp: Date.now(),
        syncType,
        message: `Erro ao sincronizar ${syncType}`
      });
    }
  }

  /**
   * Registra um listener para eventos de status
   */
  onStatusChange(listener: OfflineListener): () => void {
    this.listeners.add(listener);

    // Retorna função para remover listener
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notifica todos os listeners
   */
  private notifyListeners(event: OfflineEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in offline listener:', error);
      }
    });
  }

  /**
   * Retorna status online atual
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Adiciona item para sincronização offline
   */
  addPendingSync(type: string): void {
    this.pendingSync.add(type);
    console.log(`Pending sync added: ${type}`);
  }

  /**
   * Remove item de sincronização pendente
   */
  removePendingSync(type: string): void {
    this.pendingSync.delete(type);
  }

  /**
   * Retorna items pendentes para sincronização
   */
  getPendingSync(): string[] {
    return Array.from(this.pendingSync);
  }

  /**
   * Retorna quantidade de items pendentes
   */
  getPendingSyncCount(): number {
    return this.pendingSync.size;
  }

  /**
   * Tenta sincronizar dados offline
   */
  private async syncPendingData(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;

    try {
      const pending = Array.from(this.pendingSync);

      for (const syncType of pending) {
        if (syncType === 'food') {
          await this.requestSync('sync-food-items');
        } else if (syncType === 'water') {
          await this.requestSync('sync-water-intake');
        }
      }
    } catch (error) {
      console.error('Error during pending data sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Solicita sincronização via Background Sync API
   */
  private async requestSync(tag: string): Promise<void> {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
      console.warn('Background Sync not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.sync) {
        await registration.sync.register(tag);
        console.log(`Sync requested: ${tag}`);

        this.notifyListeners({
          type: 'sync-start',
          timestamp: Date.now(),
          syncType: tag as any,
          message: `Iniciando sincronização: ${tag}`
        });
      }
    } catch (error) {
      console.error('Error requesting sync:', error);
    }
  }

  /**
   * Armazena dados para sincronizar depois
   */
  async storeOfflineData(key: string, data: any): Promise<void> {
    try {
      // Usa IndexedDB para melhor performance com dados grandes
      if ('indexedDB' in window) {
        const request = indexedDB.open('nutriscan-offline', 1);

        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('pending')) {
            db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
          }
        };

        request.onsuccess = (event: any) => {
          const db = event.target.result;
          const transaction = db.transaction(['pending'], 'readwrite');
          const store = transaction.objectStore('pending');
          store.add({ key, data, timestamp: Date.now() });
        };
      } else {
        // Fallback para localStorage
        const existing = JSON.parse(localStorage.getItem('offline-data') || '[]');
        existing.push({ key, data, timestamp: Date.now() });
        localStorage.setItem('offline-data', JSON.stringify(existing));
      }

      this.addPendingSync(key);
    } catch (error) {
      console.error('Error storing offline data:', error);
    }
  }

  /**
   * Recupera dados armazenados offline
   */
  async getOfflineData(key?: string): Promise<any[]> {
    try {
      if ('indexedDB' in window) {
        return new Promise((resolve) => {
          const request = indexedDB.open('nutriscan-offline', 1);

          request.onsuccess = (event: any) => {
            const db = event.target.result;
            const transaction = db.transaction(['pending'], 'readonly');
            const store = transaction.objectStore('pending');
            const queryRequest = key ? store.get(key) : store.getAll();

            queryRequest.onsuccess = () => {
              resolve(queryRequest.result ? [queryRequest.result] : []);
            };
          };

          request.onerror = () => resolve([]);
        });
      } else {
        // Fallback para localStorage
        const existing = JSON.parse(localStorage.getItem('offline-data') || '[]');
        if (key) {
          return existing.filter((item: any) => item.key === key);
        }
        return existing;
      }
    } catch (error) {
      console.error('Error retrieving offline data:', error);
      return [];
    }
  }

  /**
   * Limpa dados offline sincronizados
   */
  async clearOfflineData(key?: string): Promise<void> {
    try {
      if ('indexedDB' in window) {
        const request = indexedDB.open('nutriscan-offline', 1);

        request.onsuccess = (event: any) => {
          const db = event.target.result;
          const transaction = db.transaction(['pending'], 'readwrite');
          const store = transaction.objectStore('pending');

          if (key) {
            store.delete(key);
          } else {
            store.clear();
          }
        };
      } else {
        if (key) {
          const existing = JSON.parse(localStorage.getItem('offline-data') || '[]');
          const filtered = existing.filter((item: any) => item.key !== key);
          localStorage.setItem('offline-data', JSON.stringify(filtered));
        } else {
          localStorage.removeItem('offline-data');
        }
      }
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  }
}

// Exporta instância singleton
export const offlineStatusService = new OfflineStatusService();

export default offlineStatusService;
