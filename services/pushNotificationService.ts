/**
 * Push Notification Service
 * Gerencia Web Push Notifications usando Service Worker
 */

interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  vibrate?: number[];
  customData?: Record<string, any>;
  url?: string;
  actions?: NotificationAction[];
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported = false;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  /**
   * Inicializa o serviço de notificações push
   * Registra o service worker se ainda não estiver registrado
   */
  async init(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Push Notifications não suportadas neste navegador');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('Service Worker registrado com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
      return false;
    }
  }

  /**
   * Solicita permissão ao usuário para receber notificações
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Push Notifications não suportadas');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      return await Notification.requestPermission();
    }

    return 'denied';
  }

  /**
   * Verifica se o navegador suporta Push Notifications
   */
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Verifica se as notificações estão habilitadas
   */
  isNotificationEnabled(): boolean {
    return this.isSupported && Notification.permission === 'granted';
  }

  /**
   * Inscreve o usuário para receber push notifications
   * (Requer backend com VAPID keys configuradas)
   */
  async subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
    if (!this.registration) {
      throw new Error('Service Worker não registrado');
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      console.log('Usuário inscrito no Push:', subscription);
      return subscription;
    } catch (error) {
      console.error('Erro ao inscrever no Push:', error);
      return null;
    }
  }

  /**
   * Desinscreve o usuário de push notifications
   */
  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Usuário desinscreve do Push');
        return true;
      }
    } catch (error) {
      console.error('Erro ao desinscrever do Push:', error);
    }

    return false;
  }

  /**
   * Obtém a inscrição atual do usuário
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null;
    }

    try {
      return await this.registration.pushManager.getSubscription();
    } catch (error) {
      console.error('Erro ao obter inscrição:', error);
      return null;
    }
  }

  /**
   * Envia uma notificação local (sem usar backend)
   * Útil para testes e notificações simples
   */
  async showLocalNotification(options: PushNotificationOptions): Promise<void> {
    if (!this.isNotificationEnabled()) {
      console.warn('Notificações não habilitadas');
      return;
    }

    const notificationOptions: NotificationOptions = {
      body: options.body,
      icon: options.icon || '/iconApp.png',
      badge: options.badge || '/iconApp.png',
      tag: options.tag || `nutriscan-${Date.now()}`,
      requireInteraction: options.requireInteraction || false,
      vibrate: options.vibrate || [200, 100, 200],
      data: {
        url: options.url || '/',
        ...options.customData
      },
      actions: options.actions || []
    };

    if (this.registration) {
      try {
        await this.registration.showNotification(options.title, notificationOptions);
      } catch (error) {
        console.error('Erro ao mostrar notificação:', error);
        // Fallback para a API padrão de Notification
        new Notification(options.title, notificationOptions);
      }
    }
  }

  /**
   * Envia uma notificação push via backend
   * (Requer configuração de backend VAPID)
   */
  async sendPushNotification(
    endpoint: string,
    auth: string,
    p256dh: string,
    payload: PushNotificationOptions
  ): Promise<Response | null> {
    try {
      const response = await fetch('http://localhost:5050/api/send-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint,
          auth,
          p256dh,
          payload
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.log('Push notification enviada com sucesso');
      return response;
    } catch (error) {
      console.error('Erro ao enviar push notification:', error);
      return null;
    }
  }

  /**
   * Converte VAPID public key de base64 para Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

// Exporta uma instância singleton
export const pushNotificationService = new PushNotificationService();

export default pushNotificationService;
