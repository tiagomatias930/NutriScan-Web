import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store';

const TWO_HOURS = 2 * 60 * 60 * 1000;

export const HydrationReminder: React.FC = () => {
  const hydrationEnabled = useAppStore(state => state.hydrationReminderEnabled);
  const lastDrinkAt = useAppStore(state => state.lastDrinkAt);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Request notification permission once when the component mounts if enabled
    if (hydrationEnabled && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch (e) { /* ignore */ }
    }
  }, []);

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

  const sendReminder = () => {
    const title = 'Hora de Hidratar — NutriScan';
    const body = 'Faça uma pausa: beba um copo de água agora 💧';

    // Desktop/browser notification when permitted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, tag: 'hydration-reminder' });
      } catch (e) {
        // Fallback to alert
        // eslint-disable-next-line no-alert
        alert(body);
      }
    } else {
      // If permission not granted, fallback to in-page alert
      // eslint-disable-next-line no-alert
      alert(body);
    }
  };

  return null;
};

export default HydrationReminder;
