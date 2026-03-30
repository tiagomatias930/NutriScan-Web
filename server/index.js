import cors from 'cors';
import express from 'express';
import { ExpressAuth, getSession } from '@auth/express';
import Google from '@auth/express/providers/google';

const app = express();

const PORT = Number(process.env.AUTH_PORT || 3001);
const CLIENT_URL = process.env.AUTH_CLIENT_URL || 'http://localhost:3000';
const GOOGLE_FIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.nutrition.read',
  'https://www.googleapis.com/auth/fitness.nutrition.write',
];

const authConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: 'jwt',
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          scope: ['openid', 'email', 'profile', ...GOOGLE_FIT_SCOPES].join(' '),
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.googleAccessToken = account.access_token;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
      }

      session.googleAccessToken = token.googleAccessToken;
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      try {
        const nextUrl = new URL(url);
        if (nextUrl.origin === baseUrl) {
          return url;
        }
      } catch {
        return baseUrl;
      }

      return baseUrl;
    },
  },
};

const ensureAuthEnv = () => {
  const requiredVars = ['AUTH_SECRET', 'AUTH_GOOGLE_ID', 'AUTH_GOOGLE_SECRET'];
  const missingVars = requiredVars.filter((key) => !process.env[key]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required auth environment variables: ${missingVars.join(', ')}`);
  }
};

ensureAuthEnv();

app.set('trust proxy', true);
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/auth/session', async (req, res) => {
  try {
    const session = await getSession(req, authConfig);
    res.json(session);
  } catch (error) {
    console.error('Failed to load auth session:', error);
    res.status(500).json({ error: 'Failed to load auth session' });
  }
});

app.use('/auth/*', ExpressAuth(authConfig));

if (process.env.DISABLE_AUTH_SERVER_LISTENER !== 'true') {
  app.listen(PORT, () => {
    console.log(`Auth server listening on http://localhost:${PORT}`);
  });
}

export { app, authConfig };
