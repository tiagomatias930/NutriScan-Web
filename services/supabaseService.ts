import { supabase, isOnline, getCurrentUser, isSupabaseConfigured } from './supabaseClient';
import { UserProfile, FoodItem, ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * OFFLINE-FIRST STRATEGY
 * 1. Save to localStorage immediately (synchronous)
 * 2. If Supabase is configured and online, sync to cloud (async, no blocking)
 * 3. No authentication required - works completely offline
 */

const LOCAL_STORAGE_KEYS = {
  FOOD_LOGS: 'nutriscan-food-logs',
  CHAT_HISTORY: 'nutriscan-chat-history',
  HYDRATION_LOGS: 'nutriscan-hydration-logs',
  USER_PROFILE: 'nutriscan-user-profile',
};

// Local helpers
const saveLocalFoodLog = (food: FoodItem) => {
  try {
    const logs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.FOOD_LOGS) || '[]');
    logs.unshift(food);
    localStorage.setItem(LOCAL_STORAGE_KEYS.FOOD_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.warn('Failed to save food log locally:', e);
  }
};

const getLocalFoodLogs = (): FoodItem[] => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.FOOD_LOGS) || '[]');
  } catch (e) {
    return [];
  }
};

/**
 * FOOD LOG OPERATIONS
 */
export const addFoodLog = async (
  food: Omit<FoodItem, 'id'>
): Promise<{ success: boolean; data?: FoodItem; error?: string }> => {
  try {
    const foodWithId = { id: uuidv4(), ...food } as FoodItem;
    
    // Always save locally first (synchronous, no delay)
    saveLocalFoodLog(foodWithId);

    // Background sync to Supabase if configured and online
    if (isSupabaseConfigured() && isOnline()) {
      syncFoodLogToSupabase(food).catch(err => 
        console.debug('Background sync failed:', err)
      );
    }

    return { success: true, data: foodWithId };
  } catch (error) {
    console.error('Error adding food log:', error);
    return { success: false, error: String(error) };
  }
};

const syncFoodLogToSupabase = async (food: Omit<FoodItem, 'id'>) => {
  try {
    const user = await getCurrentUser();
    if (!user) return;

    await supabase.from('food_logs').insert([
      {
        user_id: user.id,
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        weight: food.weight,
        meal_type: food.mealType,
        image_data: food.imageData,
        timestamp: food.timestamp,
      },
    ]);
  } catch (error) {
    console.debug('Failed to sync to Supabase:', error);
  }
};

export const getFoodLogs = async (): Promise<{
  success: boolean;
  data?: FoodItem[];
  error?: string;
}> => {
  try {
    const localLogs = getLocalFoodLogs();
    
    if (isSupabaseConfigured() && isOnline()) {
      const user = await getCurrentUser();
      if (user) {
        try {
          const { data: cloudLogs } = await supabase
            .from('food_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false });

          if (cloudLogs) {
            return {
              success: true,
              data: cloudLogs.map(item => ({
                id: item.id,
                name: item.name,
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fats: item.fats,
                weight: item.weight,
                mealType: item.meal_type,
                imageData: item.image_data,
                timestamp: item.timestamp,
              })) as FoodItem[],
            };
          }
        } catch (e) {
          console.debug('Failed to fetch from Supabase:', e);
        }
      }
    }

    return { success: true, data: localLogs };
  } catch (error) {
    console.error('Error fetching food logs:', error);
    return { success: false, error: String(error) };
  }
};

export const deleteFoodLog = async (
  foodId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const logs = getLocalFoodLogs();
    const filtered = logs.filter(log => log.id !== foodId);
    localStorage.setItem(LOCAL_STORAGE_KEYS.FOOD_LOGS, JSON.stringify(filtered));

    if (isSupabaseConfigured() && isOnline()) {
      const user = await getCurrentUser();
      if (user) {
        try {
          await supabase
            .from('food_logs')
            .delete()
            .eq('id', foodId)
            .eq('user_id', user.id);
        } catch (err) {
          console.debug('Failed to delete from Supabase:', err);
        }
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

/**
 * CHAT HISTORY OPERATIONS
 */
export const addChatMessage = async (
  message: Omit<ChatMessage, 'id'>
): Promise<{ success: boolean; data?: ChatMessage; error?: string }> => {
  try {
    const messageWithId = { id: uuidv4(), ...message } as ChatMessage;
    
    try {
      const messages = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.CHAT_HISTORY) || '[]');
      messages.push(messageWithId);
      localStorage.setItem(LOCAL_STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat locally:', e);
    }

    if (isSupabaseConfigured() && isOnline()) {
      const user = await getCurrentUser();
      if (user) {
        try {
          await supabase.from('chat_history').insert([
            {
              user_id: user.id,
              role: message.role,
              text: message.text,
              sources: message.sources,
              timestamp: message.timestamp,
            },
          ]);
        } catch (err) {
          console.debug('Failed to sync chat:', err);
        }
      }
    }

    return { success: true, data: messageWithId };
  } catch (error) {
    console.error('Error adding chat message:', error);
    return { success: false, error: String(error) };
  }
};

export const getChatHistory = async (): Promise<{
  success: boolean;
  data?: ChatMessage[];
  error?: string;
}> => {
  try {
    const localMessages = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.CHAT_HISTORY) || '[]');

    if (isSupabaseConfigured() && isOnline()) {
      const user = await getCurrentUser();
      if (user) {
        try {
          const { data: cloudMessages } = await supabase
            .from('chat_history')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: true });

          if (cloudMessages) {
            return {
              success: true,
              data: cloudMessages.map(item => ({
                id: item.id,
                role: item.role,
                text: item.text,
                timestamp: item.timestamp,
                sources: item.sources,
              })) as ChatMessage[],
            };
          }
        } catch (e) {
          console.debug('Failed to fetch chat from Supabase:', e);
        }
      }
    }

    return { success: true, data: localMessages };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

/**
 * HYDRATION LOG OPERATIONS
 */
export const addHydrationLog = async (
  amountMl: number,
  timestamp: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const logs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.HYDRATION_LOGS) || '[]');
    logs.push({ amountMl, timestamp });
    localStorage.setItem(LOCAL_STORAGE_KEYS.HYDRATION_LOGS, JSON.stringify(logs));

    if (isSupabaseConfigured() && isOnline()) {
      const user = await getCurrentUser();
      if (user) {
        try {
          await supabase
            .from('hydration_logs')
            .insert([{ user_id: user.id, amount_ml: amountMl, timestamp }]);
        } catch (err) {
          console.debug('Failed to sync hydration:', err);
        }
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

export const getHydrationLogs = async (fromTimestamp?: number): Promise<{
  success: boolean;
  data?: { amountMl: number; timestamp: number }[];
  error?: string;
}> => {
  try {
    const localLogs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.HYDRATION_LOGS) || '[]');
    const filtered = fromTimestamp ? localLogs.filter((log: any) => log.timestamp >= fromTimestamp) : localLogs;

    if (isSupabaseConfigured() && isOnline()) {
      const user = await getCurrentUser();
      if (user) {
        try {
          let query = supabase
            .from('hydration_logs')
            .select('amount_ml, timestamp')
            .eq('user_id', user.id);

          if (fromTimestamp) {
            query = query.gte('timestamp', fromTimestamp);
          }

          const { data: cloudLogs } = await query;
          if (cloudLogs) {
            return { success: true, data: cloudLogs.map(item => ({ amountMl: item.amount_ml, timestamp: item.timestamp })) };
          }
        } catch (e) {
          console.debug('Failed to fetch hydration from Supabase:', e);
        }
      }
    }

    return { success: true, data: filtered };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

/**
 * USER PROFILE OPERATIONS
 */
export const createOrUpdateUserProfile = async (
  profile: UserProfile
): Promise<{ success: boolean; error?: string }> => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));

    if (isSupabaseConfigured() && isOnline()) {
      const user = await getCurrentUser();
      if (user) {
        try {
          await supabase
            .from('users')
            .upsert([
              {
                id: user.id,
                name: profile.name,
                gender: profile.gender,
                age: profile.age,
                height: profile.height,
                weight: profile.weight,
                activity_level: profile.activityLevel,
                somatotype: profile.somatotype,
                goal: profile.goal,
                onboarding_completed: profile.onboardingCompleted,
              },
            ], { onConflict: 'id' });
        } catch (err) {
          console.debug('Failed to sync profile:', err);
        }
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

export const getUserProfile = async (): Promise<{
  success: boolean;
  data?: UserProfile;
  error?: string;
}> => {
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_PROFILE);
    if (local) {
      return { success: true, data: JSON.parse(local) };
    }

    if (isSupabaseConfigured() && isOnline()) {
      const user = await getCurrentUser();
      if (user) {
        try {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (data) {
            const profile: UserProfile = {
              name: data.name,
              gender: data.gender,
              age: data.age,
              height: data.height,
              weight: data.weight,
              activityLevel: data.activity_level,
              somatotype: data.somatotype,
              goal: data.goal,
              onboardingCompleted: data.onboarding_completed,
            };
            localStorage.setItem(LOCAL_STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
            return { success: true, data: profile };
          }
        } catch (e) {
          console.debug('Failed to fetch profile from Supabase:', e);
        }
      }
    }

    return { success: false, error: 'Profile not found' };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

/**
 * SYNC STATUS (for monitoring)
 */
export const getSyncStatus = async (): Promise<{
  isOnline: boolean;
  isSupabaseConfigured: boolean;
  isAuthenticated: boolean;
  pendingLocalItems: number;
}> => {
  const user = await getCurrentUser();
  const foodLogs = getLocalFoodLogs();

  return {
    isOnline: isOnline(),
    isSupabaseConfigured: isSupabaseConfigured(),
    isAuthenticated: !!user,
    pendingLocalItems: foodLogs.length,
  };
};
