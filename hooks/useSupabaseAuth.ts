import { useEffect, useState } from 'react';
import { useAppStore } from '../store';

interface AuthSessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface AuthSession {
  user?: AuthSessionUser;
  expires?: string;
  googleAccessToken?: string;
}

interface UseSupabaseAuthReturn {
  user: AuthSessionUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  signUp: (_email: string, _password: string) => Promise<{ error?: string }>;
  signIn: (_email: string, _password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<{ error?: string }>;
  resetPassword: (_email: string) => Promise<{ error?: string }>;
  updatePassword: (_newPassword: string) => Promise<{ error?: string }>;
}

const AUTH_SESSION_ENDPOINT = '/api/auth/session';
const AUTH_CSRF_ENDPOINT = '/auth/csrf';
const GOOGLE_SIGN_IN_ENDPOINT = '/auth/signin/google';
const SIGN_OUT_ENDPOINT = '/auth/signout';

const submitAuthForm = (action: string, fields: Record<string, string>) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;
  form.style.display = 'none';

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

const fetchJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const useSupabaseAuth = (): UseSupabaseAuthReturn => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const nextSession = await fetchJson<AuthSession | null>(AUTH_SESSION_ENDPOINT);
        if (isMounted) {
          setSession(nextSession?.user ? nextSession : null);
        }
      } catch (error) {
        console.error('Error loading auth session:', error);
        if (isMounted) {
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    try {
      setIsLoading(true);
      const { csrfToken } = await fetchJson<{ csrfToken: string }>(AUTH_CSRF_ENDPOINT);

      submitAuthForm(GOOGLE_SIGN_IN_ENDPOINT, {
        csrfToken,
        callbackUrl: `${window.location.origin}/`,
      });

      return {};
    } catch (error) {
      console.error('Google sign in error:', error);
      setIsLoading(false);
      return { error: 'Erro ao fazer login com Google. Tente novamente.' };
    }
  };

  const signOut = async (): Promise<{ error?: string }> => {
    try {
      setIsLoading(true);
      const { csrfToken } = await fetchJson<{ csrfToken: string }>(AUTH_CSRF_ENDPOINT);
      useAppStore.getState().clearStorage();

      submitAuthForm(SIGN_OUT_ENDPOINT, {
        csrfToken,
        callbackUrl: `${window.location.origin}/`,
      });

      return {};
    } catch (error) {
      console.error('Sign out error:', error);
      setIsLoading(false);
      return { error: 'Erro ao fazer logout. Tente novamente.' };
    }
  };

  return {
    user: session?.user || null,
    session,
    isLoading,
    isAuthenticated: !!session?.user,
    isConfigured: true,
    signUp: async () => ({ error: 'Login por email foi desativado. Use Google.' }),
    signIn: async () => ({ error: 'Login por email foi desativado. Use Google.' }),
    signInWithGoogle,
    signOut,
    resetPassword: async () => ({ error: 'Reset de senha não está disponível com login Google.' }),
    updatePassword: async () => ({ error: 'Atualização de senha não está disponível com login Google.' }),
  };
};
