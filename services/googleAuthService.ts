/**
 * Google OAuth 2.0 Authentication Service
 * Uses Google Identity Services (GIS) for login with Google account.
 * Also manages access tokens for Google Fit API.
 */

const GOOGLE_CLIENT_ID = '636934534754-d5opd5uvcmkhg7prfqope2bjennsmmts.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URI = 'http://nutriscan.geniomatias.me/home';
const GOOGLE_FIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.activity.write',
  'https://www.googleapis.com/auth/fitness.nutrition.read',
].join(' ');

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name?: string;
  family_name?: string;
}

export interface GoogleAuthTokens {
  access_token: string;
  expires_at: number; // timestamp ms
  refresh_token?: string;
}

// ---------- GIS Script Loader ----------

let gisLoaded = false;
let gisLoadPromise: Promise<void> | null = null;

function loadGisScript(): Promise<void> {
  if (gisLoaded) return Promise.resolve();
  if (gisLoadPromise) return gisLoadPromise;

  gisLoadPromise = new Promise<void>((resolve, reject) => {
    // Check if already loaded
    if ((window as any).google?.accounts) {
      gisLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gisLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });

  return gisLoadPromise;
}

// ---------- OAuth 2.0 Implicit flow ----------

/**
 * Initiates Google OAuth 2.0 login using the implicit grant flow
 * via the Google Identity Services library.
 * Returns the access_token on success.
 */
export function googleLogin(): Promise<{ access_token: string; expires_in: number }> {
  return new Promise(async (resolve, reject) => {
    try {
      await loadGisScript();

      const google = (window as any).google;
      if (!google?.accounts?.oauth2) {
        reject(new Error('Google Identity Services not available'));
        return;
      }

      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_FIT_SCOPES,
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          resolve({
            access_token: response.access_token,
            expires_in: Number(response.expires_in) || 3600,
          });
        },
        error_callback: (err: any) => {
          reject(new Error(err?.message || 'Google login failed'));
        },
      });

      // This will open the Google consent popup
      client.requestAccessToken();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Fetches user profile info from Google using the access token.
 */
export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch user info: ${res.status}`);
  }

  return res.json();
}

/**
 * Full login flow: authenticate → fetch user info.
 */
export async function loginWithGoogle(): Promise<{
  user: GoogleUserInfo;
  tokens: GoogleAuthTokens;
}> {
  const { access_token, expires_in } = await googleLogin();

  const user = await fetchGoogleUserInfo(access_token);

  const tokens: GoogleAuthTokens = {
    access_token,
    expires_at: Date.now() + expires_in * 1000,
  };

  return { user, tokens };
}

/**
 * Revokes the Google access token (sign out).
 */
export function revokeGoogleToken(accessToken: string): Promise<void> {
  return new Promise(async (resolve) => {
    try {
      await loadGisScript();
      const google = (window as any).google;
      if (google?.accounts?.oauth2) {
        google.accounts.oauth2.revoke(accessToken, () => {
          resolve();
        });
      } else {
        resolve();
      }
    } catch {
      resolve();
    }
  });
}

/**
 * Checks if the current access token is still valid.
 */
export function isTokenValid(tokens: GoogleAuthTokens | null): boolean {
  if (!tokens) return false;
  // Consider expired 5 minutes before actual expiry
  return tokens.expires_at > Date.now() + 5 * 60 * 1000;
}
