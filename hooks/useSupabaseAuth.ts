import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { useAppStore } from '../store';

interface UseSupabaseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
}

/**
 * Hook for Supabase authentication
 * Integrates with Zustand store and provides offline fallback
 */
export const useSupabaseAuth = (): UseSupabaseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user: appUser } = useAppStore();
  
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    // Check if Supabase is configured
    if (!isConfigured) {
      console.warn('Supabase not configured, using offline mode');
      setIsLoading(false);
      return;
    }

    // Get current session
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session?.user) {
          setUser(session.user);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [isConfigured]);

  const signUp = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        // Translate common error messages to Portuguese
        const message = translateAuthError(error.message);
        return { error: message };
      }

      return {};
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: 'Erro ao registrar. Tente novamente.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const message = translateAuthError(error.message);
        return { error: message };
      }

      return {};
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'Erro ao fazer login. Tente novamente.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<{ error?: string }> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error: error.message };
      }

      // Clear app store on logout
      useAppStore.getState().clearStorage();

      return {};
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: 'Erro ao fazer logout. Tente novamente.' };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        const message = translateAuthError(error.message);
        return { error: message };
      }

      return {};
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: 'Erro ao enviar link de reset. Tente novamente.' };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Update password error:', error);
      return { error: 'Erro ao atualizar senha. Tente novamente.' };
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isConfigured,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };
};

/**
 * Translate common Supabase auth error messages to Portuguese
 */
const translateAuthError = (message: string): string => {
  const translations: Record<string, string> = {
    'Invalid login credentials': 'Email ou senha inválidos',
    'User already registered': 'Este email já está registrado',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
    'Email not confirmed': 'Email não foi confirmado. Verifique sua caixa de entrada',
    'Email rate limit exceeded': 'Muitas tentativas. Tente novamente mais tarde',
    'Too many requests': 'Muitas requisições. Tente novamente mais tarde',
    'Invalid email': 'Email inválido',
    'Anonymous sign-ins are disabled': 'Login anônimo não está disponível',
  };

  for (const [key, value] of Object.entries(translations)) {
    if (message.includes(key)) {
      return value;
    }
  }

  // Default fallback
  if (message.toLowerCase().includes('error')) {
    return 'Erro na autenticação. Tente novamente.';
  }

  return message;
};

/**
 * Hook to check if user data is synced to Supabase
 */
export const useSupabaseSync = () => {
  const [isSynced, setIsSynced] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const { user } = useSupabaseAuth();
  const appUser = useAppStore((state) => state.user);

  useEffect(() => {
    const checkSync = async () => {
      if (!user || !appUser) {
        setIsSynced(false);
        return;
      }

      try {
        // Try to fetch user profile from Supabase
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows found, which is ok on first sync
          throw error;
        }

        setIsSynced(!!data);
        setSyncError(null);
      } catch (error) {
        console.error('Error checking sync status:', error);
        setSyncError(String(error));
        setIsSynced(false);
      }
    };

    checkSync();
  }, [user, appUser]);

  return { isSynced, syncError };
};
