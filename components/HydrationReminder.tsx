import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store';
import HydrationNotification from './HydrationNotification';
import { pushNotificationService } from '../services/pushNotificationService';
import { useTranslation } from '../utils/i18n';

const TWO_HOURS = 2 * 60 * 60 * 1000;

export const HydrationReminder: React.FC = () => {
  const hydrationEnabled = useAppStore(state => state.hydrationReminderEnabled);
  const lastDrinkAt = useAppStore(state => state.lastDrinkAt);
  const setLastDrinkAt = useAppStore(state => state.setLastDrinkAt);
  const timeoutRef = useRef<number | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Request notification permission once when the component mounts if enabled
    if (hydrationEnabled && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch (e) { /* ignore */ }
    }

    // Initialize push notification service
    (async () => {
      try {
        await pushNotificationService.init();
      } catch (e) {
        console.error('Failed to initialize push notifications:', e);
      }
    })();
  }, [hydrationEnabled]);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!hydrationEnabled) return;

    const now = Date.now();
    const base = lastDrinkAt ?? now;
    const next = base + TWO_HOURS;
    const delay = Math.max(0, next - now);

    // Use setTimeout to schedule the reminder at the appropriate time
    timeoutRef.current = window.setTimeout(() => {
      sendReminder();
      // After sending, schedule next reminders every TWO_HOURS
      timeoutRef.current = window.setInterval(sendReminder, TWO_HOURS) as unknown as number;
    }, delay) as unknown as number;

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        window.clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [hydrationEnabled, lastDrinkAt]);

  const sendReminder = async () => {
    const title = t('hydrationReminder.title');
    const body = t('hydrationReminder.body');

    // Tenta enviar como Web Push primeiro (funciona mesmo com app fechado)
    if (pushNotificationService.isNotificationEnabled()) {
      try {
        await pushNotificationService.showLocalNotification({
          title,
          body,
          tag: 'hydration-reminder',
          icon: '/iconApp.png',
          badge: '/iconApp.png',
          vibrate: [200, 100, 200],
          requireInteraction: true,
          customData: {
            type: 'hydration-reminder'
          }
        });
        return;
      } catch (e) {
        console.warn('Push notification failed, trying standard notification:', e);
      }
    }

    // Fallback: Desktop/browser notification quando permitido
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, tag: 'hydration-reminder', icon: '💧' });
      } catch (e) {
        console.warn('Standard notification failed, showing modal instead', e);
        setShowNotification(true);
      }
    } else {
      // Show in-app modal notification
      setShowNotification(true);
    }
  };

  const handleNotificationConfirm = () => {
    setShowNotification(false);
    // Update the last drink time to reset the 2-hour timer
    setLastDrinkAt(Date.now());
  };

  const handleNotificationDismiss = () => {
    setShowNotification(false);
  };

  return (
    <HydrationNotification
      isVisible={showNotification}
      onDismiss={handleNotificationDismiss}
      onConfirm={handleNotificationConfirm}
    />
  );
};

export default HydrationReminder;
