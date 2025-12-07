import React, { useState } from 'react';
import { useAppStore } from '../store';
import { FoodItem } from '../types';
import { useTranslation, formatLocaleDate, formatLocaleTime } from '../utils/i18n';

export const History: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { history, deleteHistoryEntry, clearHistory } = useAppStore();
  const [expanded, setExpanded] = useState<number | null>(null);
  const { t, locale } = useTranslation();

  const formatDate = (ts: number) => {
    return formatLocaleDate(ts, locale, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  const calcTotals = (items: FoodItem[]) => {
    return items.reduce((acc, it) => {
      acc.calories += it.calories;
      acc.protein += it.protein;
      acc.carbs += it.carbs;
      acc.fats += it.fats;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl glass-lg rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-textLight">{t('history.title')}</h3>
          <div className="flex items-center gap-3">
            <button onClick={() => { if (confirm(t('history.clearConfirm'))) clearHistory(); }} className="text-sm text-red-400">{t('history.clear')}</button>
            <button onClick={onClose} className="py-1 px-3 rounded-md glass-sm text-sm text-textMuted hover:glass">{t('common.close')}</button>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="py-12 text-center text-textMuted">{t('history.empty')}</div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => {
              const totals = calcTotals(entry.foodLog);
              const isOpen = expanded === entry.date;
              return (
                <div key={entry.date} className="glass-sm p-4 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-textLight font-semibold">{formatDate(entry.date)}</div>
                      <div className="text-xs text-textMuted">{t('history.mealsAndWater', { meals: entry.foodLog.length, water: entry.waterIntake })}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{Math.round(totals.calories)} kcal</div>
                      <div className="text-xs text-textMuted">{t('history.macros', { protein: Math.round(totals.protein), carbs: Math.round(totals.carbs), fats: Math.round(totals.fats) })}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <button onClick={() => setExpanded(isOpen ? null : entry.date)} className="text-sm text-primary">{isOpen ? t('history.hideDetails') : t('history.viewDetails')}</button>
                    <button onClick={() => { if (confirm(t('history.removeConfirm'))) deleteHistoryEntry(entry.date); }} className="text-sm text-red-500">{t('history.remove')}</button>
                  </div>

                  {isOpen && (
                    <div className="mt-3 border-t border-gray-300 pt-3 space-y-3">
                      {entry.foodLog.map((f) => (
                        <div key={f.id} className="flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">{f.name}</div>
                            <div className="text-xs text-gray-600">{f.weight ? `${f.weight}g • ` : ''}{formatLocaleTime(f.timestamp, locale, { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">{Math.round(f.calories)} kcal</div>
                            <div className="text-xs text-gray-700">{Math.round(f.protein)}g P</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
