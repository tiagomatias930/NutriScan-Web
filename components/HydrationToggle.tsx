import React from 'react';
import { useAppStore } from '../store';

const HydrationToggle: React.FC = () => {
  const enabled = useAppStore(state => state.hydrationReminderEnabled);
  const setEnabled = useAppStore(state => state.setHydrationReminderEnabled);

  return (
    <button
      onClick={() => setEnabled(!enabled)}
      aria-pressed={enabled}
      className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${enabled ? 'bg-primary/20 text-primary' : 'bg-glassDark text-textMuted hover:bg-glass'}`}
      title={enabled ? 'Lembretes de hidratação ativados' : 'Lembretes de hidratação desativados'}
    >
      <span className="material-icons text-lg">{enabled ? 'notifications_active' : 'notifications_off'}</span>
      <span>{enabled ? 'On' : 'Off'}</span>
    </button>
  );
};

export default HydrationToggle;
