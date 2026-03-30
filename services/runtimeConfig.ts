export interface PublicRuntimeConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  debug: boolean;
}

declare global {
  interface Window {
    __NUTRISCAN_RUNTIME_CONFIG__?: PublicRuntimeConfig;
  }
}

const FALLBACK_RUNTIME_CONFIG: PublicRuntimeConfig = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  debug: false,
};

export const getRuntimeConfig = (): PublicRuntimeConfig => {
  return window.__NUTRISCAN_RUNTIME_CONFIG__ || FALLBACK_RUNTIME_CONFIG;
};

export const loadRuntimeConfig = async (): Promise<PublicRuntimeConfig> => {
  try {
    const response = await fetch('/api/runtime-config', {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to load runtime config: ${response.status}`);
    }

    const config = (await response.json()) as PublicRuntimeConfig;
    window.__NUTRISCAN_RUNTIME_CONFIG__ = config;
    return config;
  } catch (error) {
    console.warn('Failed to load runtime config, using fallback values:', error);
    window.__NUTRISCAN_RUNTIME_CONFIG__ = FALLBACK_RUNTIME_CONFIG;
    return FALLBACK_RUNTIME_CONFIG;
  }
};
