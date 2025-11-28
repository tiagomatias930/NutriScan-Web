import React, { useState } from 'react';
import { useAppStore } from '../store';
import { ActivityLevel, Gender, Goal, Somatotype, UserProfile } from '../types';

export const Onboarding: React.FC = () => {
  const setUser = useAppStore((state) => state.setUser);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<UserProfile>>({
    name: '',
    gender: Gender.MALE,
    age: 25,
    height: 170,
    weight: 70,
    activityLevel: ActivityLevel.MODERATE,
    somatotype: Somatotype.MESOMORPH,
    goal: Goal.MAINTAIN,
    onboardingCompleted: true
  });

  const updateData = (key: keyof UserProfile, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleFinish = () => {
    if (data.name) {
        setUser(data as UserProfile);
    }
  };

  return (
    <div className="min-h-screen bg-dark text-textLight flex flex-col p-6 font-sans relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-secondary/10 to-primary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
      
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full py-8 relative z-10">
        
        {/* Progress Bar */}
        <div className="flex gap-2 mb-10 px-1">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-glassMedium'}`}></div>
            ))}
        </div>

        {/* Content Container */}
        <div className="flex-1 flex flex-col">
            {step === 1 && (
                <div className="animate-fade-in flex-1">
                    <h1 className="text-4xl font-bold text-primary mb-3 tracking-tight text-glow">Vamos começar.</h1>
                    <p className="text-textMuted text-lg mb-10 leading-relaxed">Precisamos de alguns detalhes para criar seu plano nutricional personalizado.</p>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-medium text-textMuted mb-2 block ml-1">Qual é o seu nome?</label>
                            <input
                                type="text"
                                placeholder="e.g. Alex"
                                className="w-full glass-lg text-textLight border-primary/20 focus:border-primary rounded-2xl p-5 text-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder-textMuted"
                                value={data.name}
                                onChange={e => updateData('name', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-textMuted mb-3 block ml-1">Gênero</label>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.values(Gender).map(g => (
                                    <button
                                        key={g}
                                        onClick={() => updateData('gender', g)}
                                        className={`p-5 rounded-2xl border transition-all duration-200 font-medium text-lg flex items-center justify-center gap-2 ${
                                            data.gender === g 
                                            ? 'border-primary bg-primary/20 text-primary glow-cyan'
                                            : 'glass-sm text-textMuted hover:glass-lg'
                                        }`}
                                    >
                                        <span className="material-icons text-xl">{g === Gender.MALE ? 'man' : 'woman'}</span>
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="animate-fade-in flex-1">
                    <h2 className="text-3xl font-bold mb-2 text-primary">Suas estatísticas</h2>
                    <p className="text-textMuted mb-8">Números precisos nos ajudam a calcular suas necessidades calóricas.</p>
                    
                    <div className="space-y-5">
                        <StatSlider 
                            label="Idade" 
                            value={data.age || 25} 
                            min={15} max={70} 
                            unit="years"
                            
                            onChange={(v) => updateData('age', v)}
                        />
                        <StatSlider 
                            label="Altura"
                            value={data.height || 170} 
                            min={140} max={220} 
                            unit="cm"
                            onChange={(v) => updateData('height', v)} 
                        />
                        <StatSlider 
                            label="Peso" 
                            value={data.weight || 70} 
                            min={40} max={150} 
                            unit="kg"
                            onChange={(v) => updateData('weight', v)} 
                        />
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="animate-fade-in flex-1">
                    <h2 className="text-3xl font-bold mb-2 text-primary">Tipo de corpo</h2>
                    <p className="text-textMuted mb-8">Selecione a opção que melhor descreve sua constituição física natural.</p>
                    
                    <div className="space-y-4">
                        {[
                            { type: Somatotype.ECTOMORPH, desc: "Corpo magro, metabolismo acelerado, dificuldade para ganhar peso.", icon: "person" },
                            { type: Somatotype.MESOMORPH, desc: "Físico atlético, ganha massa muscular com facilidade.", icon: "fitness_center" },
                            { type: Somatotype.ENDOMORPH, desc: "Constituição física robusta, metabolismo lento, ganha gordura com facilidade.", icon: "man" }
                        ].map(item => (
                            <button
                                key={item.type}
                                onClick={() => updateData('somatotype', item.type)}
                                className={`w-full p-5 rounded-3xl border text-left flex items-start gap-5 transition-all duration-200 group ${
                                    data.somatotype === item.type 
                                    ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                                    : 'border-gray-300 bg-card hover:bg-cardHover'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                                    data.somatotype === item.type ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                                }`}>
                                    <span className="material-icons">{item.icon}</span>
                                </div>
                                <div>
                                    <div className={`font-bold text-lg mb-1 ${data.somatotype === item.type ? 'text-primary' : 'text-gray-700'}`}>
                                        {item.type}
                                    </div>
                                    <div className="text-sm text-gray-500 leading-relaxed">{item.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="animate-fade-in flex-1">
                    <h2 className="text-3xl font-bold mb-2 text-primary">Sua meta</h2>
                    <p className="text-textMuted mb-8">O que você deseja alcançar?</p>

                    <div className="grid grid-cols-1 gap-3 mb-8">
                        {Object.values(Goal).map(g => (
                            <button
                                key={g}
                                onClick={() => updateData('goal', g)}
                                className={`p-4 rounded-2xl border transition-all duration-200 font-bold text-lg text-left px-6 flex justify-between items-center ${
                                    data.goal === g
                                    ? 'border-primary bg-gradient-to-r from-primary to-secondary text-dark glow-cyan' 
                                    : 'glass-sm text-textMuted hover:glass'
                                }`}
                            >
                                {g}
                                {data.goal === g && <span className="material-icons text-sm">check_circle</span>}
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-3 block ml-1">Nível das atividades</label>
                        <div className="relative" >
                            <select 
                                value={data.activityLevel}
                                onChange={e => updateData('activityLevel', e.target.value)}
                                className="w-full bg-card bg-transparent text-white p-5 rounded-2xl border border-gray-300 focus:border-primary outline-none appearance-none text-lg"
                            >
                                {Object.values(ActivityLevel).map(l => (
                                    <option key={l} value={l} className="bg-transparent text-dark">{l}</option>
                                ))}
                            </select>
                            <div className="absolute right-5 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                                <span className="material-icons">expand_more</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="pt-6 pb-4">
                {step < 4 ? (
                    <button 
                        onClick={() => setStep(s => s + 1)}
                        disabled={!data.name && step === 1}
                        className="w-full py-4 bg-primary text-black font-bold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-900/20"
                    >
                        Continuar
                    </button>
                ) : (
                    <button 
                        onClick={handleFinish}
                        className="w-full py-4 bg-gradient-to-r from-primary to-primaryDark text-white font-bold text-lg rounded-2xl hover:opacity-90 transition-opacity shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                    >
                        Começar o treino <span className="material-icons text-sm">arrow_forward</span>
                    </button>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

const StatSlider = ({ label, value, min, max, unit, onChange }: { label: string, value: number, min: number, max: number, unit: string, onChange: (v: number) => void }) => (
    <div className="bg-card p-5 rounded-3xl border border-gray-300">
        <div className="flex justify-between mb-4 items-end">
            <span className="text-white-700 font-medium">{label}</span>
            <div className="flex items-baseline gap-1">
                <span className="font-bold text-2xl text-white-900">{value}</span>
                <span className="text-sm text-gray-500 font-medium">{unit}</span>
            </div>
        </div>
        <input 
            type="range" min={min} max={max} 
            value={value} 
            onChange={e => onChange(parseInt(e.target.value))}
            className="w-full"
        />
    </div>
)
