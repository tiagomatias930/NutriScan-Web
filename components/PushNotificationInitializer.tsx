import React, { useEffect, useState } from 'react';
import { pushNotificationService } from '../services/pushNotificationService';

/**
 * Componente para inicializar e solicitar permissões de Push Notifications
 * Deve estar no root da aplicação (em App.tsx)
 */
export const PushNotificationInitializer: React.FC = () => {
  const [initialized, setInitialized] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    const initializePushNotifications = async () => {
      try {
        // Verifica se o navegador suporta
        if (!pushNotificationService.isNotificationSupported()) {
          console.info('Web Push Notifications não suportadas neste navegador');
          setInitialized(true);
          return;
        }

        // Inicializa o Service Worker
        const registered = await pushNotificationService.init();
        if (!registered) {
          console.warn('Falha ao registrar Service Worker');
          setInitialized(true);
          return;
        }

        // Solicita permissão se ainda não foi concedida
        if (Notification.permission === 'default') {
          const result = await pushNotificationService.requestPermission();
          setPermission(result);
          
          if (result === 'granted') {
            console.log('Permissão de notificações concedida');
          }
        } else {
          setPermission(Notification.permission);
        }

        setInitialized(true);
      } catch (error) {
        console.error('Erro ao inicializar Push Notifications:', error);
        setInitialized(true);
      }
    };

    initializePushNotifications();
  }, []);

  // Este componente não renderiza nada (render null)
  // Serve apenas para inicialização
  return null;
};

export default PushNotificationInitializer;
