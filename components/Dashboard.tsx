import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useAppStore } from '../store';
import { History } from './History';
import HydrationToggle from './HydrationToggle';
import { FoodItem } from '../types';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from '../utils/i18n';

export const Dashboard: React.FC = () => {
        const [showHistory, setShowHistory] = React.useState(false);
  const { user, targets, foodLog, waterIntake, addWater } = useAppStore();
    const { t } = useTranslation();

    if (!user || !targets) return <div className="flex items-center justify-center h-screen text-gray-500">{t('dashboard.loadingProfile')}</div>;

  // Calculate totals
  const totals = foodLog.reduce((acc, item) => {
    const isToday = new Date(item.timestamp).toDateString() === new Date().toDateString();
    if (isToday) {
        acc.calories += item.calories;
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fats += item.fats;
    }
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const remainingCals = targets.calories - totals.calories;
    const data = [
        { name: t('dashboard.consumed'), value: totals.calories },
        { name: t('dashboard.remaining'), value: Math.max(0, remainingCals) },
  ];
  const COLORS = ['#00d9ff', '#6366f1']; // Cyan e Indigo

  const WATER_GOAL = 2000; // Daily goal in ml
  const waterPercentage = Math.min(100, (waterIntake / WATER_GOAL) * 100);

    return (
        <div className="p-6 pb-28 space-y-6 max-w-xl mx-auto animate-fade-in">
      {/* Header */}
                        <div className="flex items-center justify-between pt-4 relative z-20">
        <div>
                    <p className="text-textMuted text-sm font-medium">{t('dashboard.welcomeBack')}</p>
          <h1 className="text-3xl font-bold text-textLight tracking-tight text-glow">{user.name}</h1>
        </div>
                                <div className="flex items-center gap-3">
                                        <LanguageSwitcher />
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold glow-cyan shadow-sm">
                                                {user.name.charAt(0).toUpperCase()}
                                        </div>
                                </div>
      </div>

      {/* Calories Card - Glass */}
            <div className="glass glass-lg rounded-3xl p-6 relative overflow-hidden group shadow-sm">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-110 transition-transform"></div>
        
        <div className="flex items-center justify-between relative z-10">
             <div>
                                 <h2 className="text-textMuted text-sm font-medium mb-1">{t('dashboard.caloriesAvailable')}</h2>
                 <div className="text-4xl font-bold text-primary tracking-tight text-glow">
                     {Math.max(0, remainingCals)}
                 </div>
                                 <p className="text-sm text-gray-500 mt-1 font-medium">
                                        {t('dashboard.caloriesGoal', { goal: targets.calories })}
                                 </p>
             </div>
             <div className="w-28 h-28 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={data}
                        innerRadius={38}
                        outerRadius={48}
                        startAngle={90}
                        endAngle={-270}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                    >
                        {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-icons text-primary text-xl">local_fire_department</span>
                </div>
             </div>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-2 gap-3 mt-6">
            <MacroBar label={t('dashboard.macros.protein')} current={totals.protein} target={targets.protein} color="bg-emerald-500" />
            <MacroBar label={t('dashboard.macros.carbs')} current={totals.carbs} target={targets.carbs} color="bg-blue-500" />
            <MacroBar label={t('dashboard.macros.fats')} current={totals.fats} target={targets.fats} color="bg-amber-500" />
        </div>
      </div>

      {/* Hydration Card */}
            <div className="glass glass-lg rounded-3xl p-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/15 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="flex items-center justify-between mb-4 relative z-10">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/30 flex items-center justify-center text-primary">
                    <span className="material-icons">water_drop</span>
                </div>
                <div>
                    <h3 className="font-bold text-textLight">{t('dashboard.hydration.title')}</h3>
                    <div className="text-xs text-textMuted font-medium">{t('dashboard.hydration.goal', { goal: WATER_GOAL })}</div>
                </div>
             </div>
             <div className="flex items-center gap-3">
                 <div className="text-right">
                     <span className="text-2xl font-bold text-primary">{waterIntake}</span>
                     <span className="text-sm text-textMuted ml-1">{t('common.ml')}</span>
                 </div>
                 {/* Hydration reminder toggle */}
                 <HydrationToggle />
             </div>
        </div>
        
        <div className="h-3 w-full bg-glassDark rounded-full overflow-hidden mb-5">
            <div 
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700 ease-out glow-cyan shadow-sm"
                style={{ width: `${waterPercentage}%` }}
            ></div>
        </div>

        <div className="flex gap-3">
            <button 
                onClick={() => addWater(250)}
                className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary hover:shadow-lg rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 transform duration-100"
            >
                <span>{t('dashboard.hydration.addWater', { amount: 250 })}</span>
            </button>
            <button 
                onClick={() => addWater(500)}
                className="flex-1 py-3 glass-sm hover:glass rounded-xl text-primary font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 transform duration-100"
            >
                <span>{t('dashboard.hydration.addWater', { amount: 500 })}</span>
            </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-lg font-bold text-textLight">{t('dashboard.meals.recent')}</h2>
                        <div className="flex items-center gap-3">
                                        <span className="text-xs text-textMuted font-medium">{t('dashboard.meals.last24h')}</span>
                                        <button onClick={() => setShowHistory(true)} className="text-xs glass-sm text-primary px-2 py-1 rounded-md hover:glass transition-all">{t('dashboard.meals.viewHistory')}</button>
                                    </div>
                    </div>
          
          {foodLog.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 glass-lg rounded-3xl">
                  <span className="material-icons text-textMuted text-4xl mb-2 opacity-50">no_meals</span>
                  <p className="text-textLight font-medium">{t('dashboard.meals.emptyTitle')}</p>
                  <p className="text-textMuted text-sm">{t('dashboard.meals.emptySubtitle')}</p>
              </div>
          ) : (
              <div className="space-y-3">
                  {foodLog.slice(0, 5).map((food) => (
                      <div key={food.id} className="glass-sm p-3 rounded-2xl flex items-center gap-4 hover:glass-lg transition-all cursor-pointer group">
                          <div className="w-16 h-16 rounded-xl bg-glassMedium overflow-hidden flex-shrink-0 relative shadow-md group-hover:glow-cyan">
                                                            {(food.imageUrl || food.imageData) ? (
                                                                    <img
                                                                        src={
                                                                            // Always use base64 imageData for persistence across reloads
                                                                            // Only use transient imageUrl if available in same session
                                                                            (food.imageData ? `data:image/jpeg;base64,${food.imageData}` : food.imageUrl) || undefined
                                                                        }
                                                                        alt={food.name}
                                                                        className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                                                                    />
                                                                                                                        ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-textMuted bg-glassDark">
                                                                        <span className="material-icons text-xl">restaurante</span>
                                                                    </div>
                                                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-textLight text-base truncate">{food.name}</h4>
                              <div className="flex gap-3 mt-1.5">
                                  <MacroBadge label="P" value={food.protein} color="text-primary" bg="bg-primary/10" />
                                  <MacroBadge label="C" value={food.carbs} color="text-secondary" bg="bg-secondary/10" />
                                  <MacroBadge label="F" value={food.fats} color="text-yellow-400" bg="bg-yellow-400/10" />
                              </div>
                          </div>
                          <div className="text-right px-2">
                              <div className="font-bold text-primary text-lg">{food.calories}</div>
                              <div className="text-[10px] text-textMuted font-medium uppercase tracking-wider">{t('dashboard.chart.kcal')}</div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
        {showHistory && <History onClose={() => setShowHistory(false)} />}
    </div>
  );
};

const MacroBar = ({ label, current, target, color }: { label: string, current: number, target: number, color: string }) => {
    const percent = Math.min(100, (current / target) * 100);
    return (
        <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-medium">
                <span className="text-textMuted">{label}</span>
                <span className="text-textLight">{Math.round(current)}g</span>
            </div>
            <div className="h-1.5 w-full bg-glassMedium rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full glow-cyan`} style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    )
}

const MacroBadge = ({ label, value, color, bg }: { label: string, value: number, color: string, bg: string }) => (
    <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${bg} bg-opacity-12`}>
        <span className={`text-[11px] font-bold ${color}`}>{label}</span>
        <span className={`text-xs font-medium text-textMuted`}>{Math.round(value)}</span>
    </div>
)
