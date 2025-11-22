import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useAppStore } from '../store';
import { History } from './History';
import { FoodItem } from '../types';

export const Dashboard: React.FC = () => {
    const [showHistory, setShowHistory] = React.useState(false);
  const { user, targets, foodLog, waterIntake, addWater } = useAppStore();

  if (!user || !targets) return <div className="flex items-center justify-center h-screen text-gray-500">Processando o seu perfil...</div>;

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
    { name: 'Consumido', value: totals.calories },
    { name: 'Restante', value: Math.max(0, remainingCals) },
  ];
  const COLORS = ['#10b981', '#27272a']; // Primary Green, Zinc 800

  const WATER_GOAL = 2500; // Daily goal in ml
  const waterPercentage = Math.min(100, (waterIntake / WATER_GOAL) * 100);

  return (
    <div className="p-6 pb-28 space-y-6 max-w-xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-gray-400 text-sm font-medium">Bem-vindo de volta,</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">{user.name}</h1>
        </div>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-900/50">
          {user.name.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Calories Card */}
      <div className="bg-card rounded-3xl p-6 shadow-xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="flex items-center justify-between">
             <div className="z-10">
                 <h2 className="text-gray-400 text-sm font-medium mb-1">Calorias disponíveis</h2>
                 <div className="text-4xl font-bold text-white tracking-tight">
                     {Math.max(0, remainingCals)}
                 </div>
                 <p className="text-sm text-gray-500 mt-1 font-medium">
                    de {targets.calories} kcal meta
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
                    <span className="material-icons text-gray-600 text-xl">local_fire_department</span>
                </div>
             </div>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-4 mt-6">
            <MacroBar label="Proteina" current={totals.protein} target={targets.protein} color="bg-emerald-500" />
            <MacroBar label="Carboidratos" current={totals.carbs} target={targets.carbs} color="bg-blue-500" />
            <MacroBar label="Gorduras" current={totals.fats} target={targets.fats} color="bg-amber-500" />
        </div>
      </div>

      {/* Hydration Card */}
      <div className="bg-gradient-to-br from-blue-900/40 to-blue-900/10 rounded-3xl p-6 border border-blue-500/20 shadow-lg">
        <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <span className="material-icons">water_drop</span>
                </div>
                <div>
                    <h3 className="font-bold text-white">Hidratação</h3>
                    <div className="text-xs text-blue-200/60 font-medium">Meta: {WATER_GOAL}ml</div>
                </div>
             </div>
             <div className="text-right">
                 <span className="text-2xl font-bold text-blue-100">{waterIntake}</span>
                 <span className="text-sm text-blue-300 ml-1">ml</span>
             </div>
        </div>
        
        <div className="h-3 w-full bg-blue-950/50 rounded-full overflow-hidden mb-5">
            <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                style={{ width: `${waterPercentage}%` }}
            ></div>
        </div>

        <div className="flex gap-3">
            <button 
                onClick={() => addWater(250)}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 transform duration-100"
            >
                <span>+ 250ml</span>
            </button>
            <button 
                onClick={() => addWater(500)}
                className="flex-1 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-xl text-blue-200 font-semibold text-sm transition-colors flex items-center justify-center gap-2 active:scale-95 transform duration-100"
            >
                <span>+ 500ml</span>
            </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-lg font-bold text-white">Refeições recentes</h2>
                        <div className="flex items-center gap-3">
                                        <span className="text-xs text-primary font-medium">Dados das ultimas 24h</span>
                                        <button onClick={() => setShowHistory(true)} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md hover:bg-primary/20">Ver histórico</button>
                                    </div>
                    </div>
          
          {foodLog.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-card rounded-3xl border border-dashed border-gray-800">
                  <span className="material-icons text-gray-600 text-4xl mb-2">no_meals</span>
                  <p className="text-gray-500 font-medium">Nenhuma refeição registrada hoje.</p>
                  <p className="text-gray-600 text-sm">Toque no scanner para iniciar o rastreamento.!</p>
              </div>
          ) : (
              <div className="space-y-3">
                  {foodLog.slice(0, 5).map((food) => (
                      <div key={food.id} className="bg-card p-3 rounded-2xl flex items-center gap-4 border border-white/5 hover:bg-cardHover transition-colors cursor-pointer group">
                          <div className="w-16 h-16 rounded-xl bg-gray-800 overflow-hidden flex-shrink-0 relative shadow-md">
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
                                  <div className="w-full h-full flex items-center justify-center text-gray-600 bg-gray-900">
                                    <span className="material-icons text-xl">restaurante</span>
                                  </div>
                              )}
                          </div>
                          <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-white text-base truncate">{food.name}</h4>
                              <div className="flex gap-3 mt-1.5">
                                  <MacroBadge label="P" value={food.protein} color="text-emerald-400" bg="bg-emerald-400/10" />
                                  <MacroBadge label="C" value={food.carbs} color="text-blue-400" bg="bg-blue-400/10" />
                                  <MacroBadge label="F" value={food.fats} color="text-amber-400" bg="bg-amber-400/10" />
                              </div>
                          </div>
                          <div className="text-right px-2">
                              <div className="font-bold text-white text-lg">{food.calories}</div>
                              <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">kcal</div>
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
                <span className="text-gray-400">{label}</span>
                <span className="text-white">{Math.round(current)}g</span>
            </div>
            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    )
}

const MacroBadge = ({ label, value, color, bg }: { label: string, value: number, color: string, bg: string }) => (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${bg}`}>
        <span className={`text-[10px] font-bold ${color}`}>{label}</span>
        <span className={`text-xs font-medium text-gray-300`}>{Math.round(value)}</span>
    </div>
)
