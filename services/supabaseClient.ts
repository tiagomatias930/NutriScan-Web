/// <reference types="vite/client" />

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string);
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY)
{
  console.log('Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      // Use localStorage for web, fallback for Cordova
      getItem: (key) => {
        try {
          return window.localStorage.getItem(key);
        } catch (e) {
          console.warn('LocalStorage not available:', e);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          window.localStorage.setItem(key, value);
        } catch (e) {
          console.warn('LocalStorage not available:', e);
        }
      },
      removeItem: (key) => {
        try {
          window.localStorage.removeItem(key);
        } catch (e) {
          console.warn('LocalStorage not available:', e);
        }
      },
    },
  },
  global: {
    headers: {
      'x-client-type': (window as any).cordova ? 'cordova' : 'web',
    },
  },
});

/**
 * Check if Supabase is configured
 */
export const isSupabaseConfigured = (): boolean => {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
};

/**
 * Check if we're online (for Supabase operations)
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};
