import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserProfile, FoodItem, MacroTargets, Gender, ActivityLevel, Somatotype, Goal, ChatMessage } from './types';
import { calculateTargets } from './utils/calculations';

interface AppState {
  user: UserProfile | null;
  targets: MacroTargets | null;
  foodLog: FoodItem[];
  chatHistory: ChatMessage[];
  waterIntake: number;
  
  // Actions
  setUser: (user: UserProfile) => void;
  addFood: (food: FoodItem) => void;
  addMessage: (message: ChatMessage) => void;
  addWater: (amount: number) => void;
  resetDailyLog: () => void;
  clearStorage: () => void;
}

const INITIAL_USER: UserProfile = {
  name: '',
  gender: Gender.MALE,
  age: 25,
  height: 175,
  weight: 75,
  activityLevel: ActivityLevel.MODERATE,
  somatotype: Somatotype.MESOMORPH,
  goal: Goal.MAINTAIN,
  onboardingCompleted: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      targets: null,
      foodLog: [],
      chatHistory: [],
      waterIntake: 0,

      setUser: (user) => {
        const targets = calculateTargets(user);
        set({ user, targets });
      },

      addFood: (food) => {
        set((state) => ({
          foodLog: [food, ...state.foodLog],
        }));
      },

      addMessage: (message) => {
        set((state) => ({
          chatHistory: [...state.chatHistory, message],
        }));
      },

      addWater: (amount) => {
        set((state) => ({
          waterIntake: state.waterIntake + amount,
        }));
      },

      resetDailyLog: () => {
        // In a real app, we might archive this instead of deleting
        set({ foodLog: [], waterIntake: 0 });
      },

      clearStorage: () => {
        set({ user: null, targets: null, foodLog: [], chatHistory: [], waterIntake: 0 });
      }
    }),
    {
      name: 'nutriscan-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
