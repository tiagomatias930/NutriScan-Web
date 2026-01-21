import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserProfile, FoodItem, MacroTargets, Gender, ActivityLevel, Somatotype, Goal, ChatMessage } from './types';
import { Locale, DEFAULT_LOCALE } from './utils/localization';
import { calculateTargets } from './utils/calculations';

interface AppState {
  user: UserProfile | null;
  targets: MacroTargets | null;
  foodLog: FoodItem[];
  chatHistory: ChatMessage[];
  waterIntake: number;
  lastReset: number;
  history: { date: number; foodLog: FoodItem[]; waterIntake: number }[];
  lastDrinkAt?: number | null;
  hydrationReminderEnabled: boolean;
  locale: Locale;
  
  // Actions
  setUser: (user: UserProfile) => void;
  addFood: (food: FoodItem) => void;
  addMessage: (message: ChatMessage) => void;
  addWater: (amount: number) => void;
  setLastDrinkAt: (timestamp: number) => void;
  setHydrationReminderEnabled: (enabled: boolean) => void;
  setLocale: (locale: Locale) => void;
  resetDailyLog: () => void;
  clearStorage: () => void;
  deleteHistoryEntry: (timestamp: number) => void;
  clearHistory: () => void;
}

const HISTORY_RETENTION_MS = 24 * 60 * 60 * 1000;

const pruneHistoryEntries = (entries: { date: number; foodLog: FoodItem[]; waterIntake: number }[]) => {
  const cutoff = Date.now() - HISTORY_RETENTION_MS;
  return entries.filter((entry) => entry.date >= cutoff);
};

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
      lastDrinkAt: null,
      hydrationReminderEnabled: true,
      locale: DEFAULT_LOCALE,

      setUser: (user) => {
        const targets = calculateTargets(user);
        set({ user, targets });
      },

      addFood: (food) => {
        // Reset at local midnight boundary (preserve items until the day's reset)
        const now = Date.now();
        const last = get().lastReset || now;
        const startOfDay = (t: number) => {
          const d = new Date(t);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        };

        if (startOfDay(now) !== startOfDay(last)) {
          // archive existing day then reset
          const prevFood = get().foodLog || [];
          const prevWater = get().waterIntake || 0;
          const prevHistory = get().history || [];
          if ((prevFood && prevFood.length) || prevWater) {
            const archiveEntry = { date: last, foodLog: prevFood, waterIntake: prevWater };
            set({ history: pruneHistoryEntries([archiveEntry, ...prevHistory]) });
          }
          set({ foodLog: [], waterIntake: 0, lastReset: now });
        }

        // ensure food has timestamp (preserve any image fields or blobs)
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
        const now = Date.now();
        const last = get().lastReset || now;
        const MAX_WATER = 2000;
        const startOfDay = (t: number) => {
          const d = new Date(t);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        };

        if (startOfDay(now) !== startOfDay(last)) {
          // archive previous day
          const prevFood = get().foodLog || [];
          const prevWater = get().waterIntake || 0;
          const prevHistory = get().history || [];
          if ((prevFood && prevFood.length) || prevWater) {
            const archiveEntry = { date: last, foodLog: prevFood, waterIntake: prevWater };
            set({ history: pruneHistoryEntries([archiveEntry, ...prevHistory]) });
          }
          set({ foodLog: [], waterIntake: 0, lastReset: now });
        }
        set((state) => ({
          waterIntake: Math.min(MAX_WATER, state.waterIntake + amount),
          lastDrinkAt: Date.now(),
        }));
      },

      setHydrationReminderEnabled: (enabled: boolean) => {
        set({ hydrationReminderEnabled: enabled });
      },

      setLocale: (locale) => {
        set({ locale });
      },

      setLastDrinkAt: (timestamp: number) => {
        set({ lastDrinkAt: timestamp });
      },

      resetDailyLog: () => {
        // Archive current day then reset (manual reset)
        const prevFood = get().foodLog || [];
        const prevWater = get().waterIntake || 0;
        const prevHistory = get().history || [];
        const now = Date.now();
        const last = get().lastReset || now;
        if ((prevFood && prevFood.length) || prevWater) {
          const archiveEntry = { date: last, foodLog: prevFood, waterIntake: prevWater };
          set({ history: pruneHistoryEntries([archiveEntry, ...prevHistory]) });
        }
        set({ foodLog: [], waterIntake: 0, lastReset: now });
      },

      deleteHistoryEntry: (timestamp) => {
        set((state) => ({ history: pruneHistoryEntries(state.history.filter(h => h.date !== timestamp)) }));
      },

      clearHistory: () => {
        set({ history: [] });
      },

      clearStorage: () => {
        set({ user: null, targets: null, foodLog: [], chatHistory: [], waterIntake: 0, lastReset: Date.now(), history: [], locale: DEFAULT_LOCALE });
      }
    }),
    {
      name: 'nutriscan-storage',
      storage: createJSONStorage(() => localStorage),
      // After rehydration, ensure daily reset occurs if more than 24h passed
      onRehydrateStorage: () => (state) => {
        try {
          const persistedLast = state?.lastReset || 0;
          const now = Date.now();
          const startOfDay = (t: number) => {
            const d = new Date(t);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
          };

          if (state) {
            state.history = pruneHistoryEntries(state.history || []);
          }

          if (!persistedLast) {
            // initialize lastReset
            if (state) {
              state.lastReset = now;
            }
            return;
          }

          // If persisted last reset is from a previous local day, archive and reset.
          if (startOfDay(now) !== startOfDay(persistedLast)) {
            try {
              const prevFood = state?.foodLog || [];
              const prevWater = state?.waterIntake || 0;
              const prevHistory = state?.history || [];
              if ((prevFood && prevFood.length) || prevWater) {
                const archiveEntry = { date: persistedLast, foodLog: prevFood, waterIntake: prevWater };
                if (state) {
                  state.history = pruneHistoryEntries([archiveEntry, ...prevHistory]);
                }
              }
            } catch (e) {
              // ignore archive failures
            }
            if (state) {
              state.foodLog = [];
              state.waterIntake = 0;
              state.lastReset = now;
            }
          }
        } catch (e) {
          // ignore
        }
      }
    }
  )
);
