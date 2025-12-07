import React from 'react';
import { useAppStore } from '../store';
import { useTranslation } from '../utils/i18n';

const HydrationToggle: React.FC = () => {
  const enabled = useAppStore(state => state.hydrationReminderEnabled);
  const setEnabled = useAppStore(state => state.setHydrationReminderEnabled);
  const { t } = useTranslation();
  const title = enabled ? t('hydrationToggle.titleOn') : t('hydrationToggle.titleOff');
  const label = enabled ? t('hydrationToggle.on') : t('hydrationToggle.off');

  return (
    <button
      onClick={() => setEnabled(!enabled)}
      aria-pressed={enabled}
      className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${enabled ? 'bg-primary/20 text-primary' : 'bg-glassDark text-textMuted hover:bg-glass'}`}
      title={title}
      aria-label={title}
    >
      <span className="material-icons text-lg">{enabled ? 'notifications_active' : 'notifications_off'}</span>
      <span>{label}</span>
    </button>
  );
};

export default HydrationToggle;
