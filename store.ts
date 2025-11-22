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
  lastReset: number;
  history: { date: number; foodLog: FoodItem[]; waterIntake: number }[];
  
  // Actions
  setUser: (user: UserProfile) => void;
  addFood: (food: FoodItem) => void;
  addMessage: (message: ChatMessage) => void;
  addWater: (amount: number) => void;
  resetDailyLog: () => void;
  clearStorage: () => void;
  deleteHistoryEntry: (timestamp: number) => void;
  clearHistory: () => void;
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
      lastReset: Date.now(),
      history: [],

      setUser: (user) => {
        const targets = calculateTargets(user);
        set({ user, targets });
      },

      addFood: (food) => {
        // Ensure daily reset hasn't occurred while app was open
        const DAY_MS = 24 * 60 * 60 * 1000;
        const now = Date.now();
        const last = get().lastReset || now;
        if (now - last >= DAY_MS) {
          // archive existing day then reset
          const prevFood = get().foodLog || [];
          const prevWater = get().waterIntake || 0;
          const prevHistory = get().history || [];
          if ((prevFood && prevFood.length) || prevWater) {
            const archiveEntry = { date: last, foodLog: prevFood, waterIntake: prevWater };
            set({ history: [archiveEntry, ...prevHistory] });
          }
          set({ foodLog: [], waterIntake: 0, lastReset: now });
        }

        // ensure food has timestamp
        const entry = { ...food, timestamp: food.timestamp || Date.now() } as FoodItem;
        set((state) => ({
          foodLog: [entry, ...state.foodLog],
        }));
      },

      addMessage: (message) => {
        set((state) => ({
          chatHistory: [...state.chatHistory, message],
        }));
      },

      addWater: (amount) => {
        const DAY_MS = 24 * 60 * 60 * 1000;
        const now = Date.now();
        const last = get().lastReset || now;
        if (now - last >= DAY_MS) {
          // archive previous day
          const prevFood = get().foodLog || [];
          const prevWater = get().waterIntake || 0;
          const prevHistory = get().history || [];
          if ((prevFood && prevFood.length) || prevWater) {
            const archiveEntry = { date: last, foodLog: prevFood, waterIntake: prevWater };
            set({ history: [archiveEntry, ...prevHistory] });
          }
          set({ foodLog: [], waterIntake: 0, lastReset: now });
        }
        set((state) => ({
          waterIntake: state.waterIntake + amount,
        }));
      },

      resetDailyLog: () => {
        // Archive current day then reset
        const prevFood = get().foodLog || [];
        const prevWater = get().waterIntake || 0;
        const prevHistory = get().history || [];
        const now = Date.now();
        const last = get().lastReset || now;
        if ((prevFood && prevFood.length) || prevWater) {
          const archiveEntry = { date: last, foodLog: prevFood, waterIntake: prevWater };
          set({ history: [archiveEntry, ...prevHistory] });
        }
        set({ foodLog: [], waterIntake: 0, lastReset: now });
      },

      deleteHistoryEntry: (timestamp) => {
        set((state) => ({ history: state.history.filter(h => h.date !== timestamp) }));
      },

      clearHistory: () => {
        set({ history: [] });
      },

      clearStorage: () => {
        set({ user: null, targets: null, foodLog: [], chatHistory: [], waterIntake: 0, lastReset: Date.now(), history: [] });
      }
    }),
    {
      name: 'nutriscan-storage',
      storage: createJSONStorage(() => localStorage),
      // After rehydration, ensure daily reset occurs if more than 24h passed
      onRehydrateStorage: () => (state) => {
        try {
          const DAY_MS = 24 * 60 * 60 * 1000;
          const persistedLast = state?.lastReset || 0;
          const now = Date.now();
          if (!persistedLast) {
            // initialize lastReset
            set({ lastReset: now });
            return;
          }
          if (now - persistedLast >= DAY_MS) {
            // archive persisted day's data if any, then reset
            try {
              const prevFood = state?.foodLog || [];
              const prevWater = state?.waterIntake || 0;
              const prevHistory = state?.history || [];
              if ((prevFood && prevFood.length) || prevWater) {
                const archiveEntry = { date: persistedLast, foodLog: prevFood, waterIntake: prevWater };
                set({ history: [archiveEntry, ...prevHistory] });
              }
            } catch (e) {
              // ignore archive failures
            }
            set({ foodLog: [], waterIntake: 0, lastReset: now });
          }
        } catch (e) {
          // ignore
        }
      }
    }
  )
);
