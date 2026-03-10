import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import type { Context } from 'hono';
import { db } from '../db/client.js';
import { users, studentProfiles } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { loginSchema, signupSchema } from '../schemas/auth';
import { hashPassword, verifyPassword, isPasswordHash } from '../lib/password.js';
import { createSessionToken, verifySessionToken } from '../lib/session.js';
import { checkAndIncrementRateLimit, clearRateLimit } from '../lib/rate-limit.js';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  exchangeCodeForTokens,
  getGoogleUserInfo,
  buildAuthorizationUrl,
  parseGoogleError,
} from '../lib/google.js';

type Bindings = {
  DB: D1Database;
  SESSION_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
};

const auth = new Hono<{ Bindings: Bindings }>();

// Helper to set a signed, HttpOnly session cookie
const setSession = async (c: Context<{ Bindings: Bindings }>, userId: number) => {
  const secret = c.env.SESSION_SECRET;
  const token = await createSessionToken(userId, secret);
  const isLocal = c.req.url.includes('localhost') || c.req.url.includes('127.0.0.1');
  setCookie(c, 'session_token', token, {
    httpOnly: true,
    secure: !isLocal,
    sameSite: isLocal ? 'Lax' : 'None',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
};

// POST /api/auth/login
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const loginAs = c.req.query('loginAs') ?? 'student';

  // Rate limiting: max 10 attempts per 15-minute window per email
  const rlKey = `login:${email.toLowerCase()}`;
  const rl = await checkAndIncrementRateLimit(db(c.env.DB), rlKey, 10, 15 * 60);
  if (rl.limited) {
    return c.json(
      { error: 'Too many login attempts. Please try again later.' },
      429,
      { 'Retry-After': String(rl.retryAfter ?? 900) },
    );
  }

  try {
    const user = await db(c.env.DB).query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Handle both hashed passwords (WebCrypto) and legacy plain text passwords
    let passwordValid = false;
    if (isPasswordHash(user.password)) {
      passwordValid = await verifyPassword(password, user.password);
    } else {
      // Legacy plain text check
      passwordValid = user.password === password;
      if (passwordValid) {
        // Upgrade to hashed password
        const upgradedHash = await hashPassword(password);
        await db(c.env.DB).update(users).set({ password: upgradedHash }).where(eq(users.id, user.id));
      }
    }

    if (!passwordValid) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    if (loginAs === 'admin' && user.role !== 'admin' && user.role !== 'agent') {
      return c.json({ error: 'This account does not have admin access.' }, 403);
    }
    if (loginAs === 'student' && user.role !== 'student') {
      return c.json({ error: 'Please use the admin login for this account.' }, 403);
    }

    // Clear rate limit on successful login
    await clearRateLimit(db(c.env.DB), rlKey);

    await setSession(c, user.id);
    return c.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'An error occurred during login' }, 500);
  }
});

// POST /api/auth/signup
auth.post('/signup', zValidator('json', signupSchema), async (c) => {
  const { name, email, password, phone } = c.req.valid('json');

  // #10 — Rate limit signups: 5 per hour per IP
  const ip = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For')?.split(',')[0].trim() ?? '0.0.0.0';
  const rl = await checkAndIncrementRateLimit(db(c.env.DB), `signup:${ip}`, 5, 60 * 60);
  if (rl.limited) {
    return c.json({ error: 'Too many accounts created. Please try again later.' }, 429);
  }

  try {
    const existingUser = await db(c.env.DB).query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return c.json({ error: 'Email already in use' }, 400);
    }

    const hashedPassword = await hashPassword(password);

    const [newUser] = await db(c.env.DB).insert(users).values({
      name,
      email,
      password: hashedPassword,
      role: 'student',
    }).returning({ id: users.id });

    if (newUser) {
      await db(c.env.DB).insert(studentProfiles).values({
        userId: newUser.id,
        phone,
        profileCompletion: 20,
      });

      await setSession(c, newUser.id);
      return c.json({ success: true, user: { id: newUser.id, name, role: 'student' } });
    }

    return c.json({ error: 'Failed to create user' }, 500);
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: 'An error occurred during signup' }, 500);
  }
});

// POST /api/auth/logout
auth.post('/logout', async (c) => {
  deleteCookie(c, 'session_token');
  return c.json({ success: true });
});

// GET /api/auth/me
auth.get('/me', async (c) => {
  try {
    const token = getCookie(c, 'session_token');

    if (token) {
      const userId = await verifySessionToken(token, c.env.SESSION_SECRET);
      if (userId !== null) {
        const user = await db(c.env.DB).query.users.findFirst({
          where: eq(users.id, userId),
        });

        if (user) {
          return c.json({
            authenticated: true,
            user: { id: user.id, name: user.name, role: user.role },
          });
        }
      }
    }
  } catch (error) {
    console.error('Session validation error:', error);
  }

  return c.json({ authenticated: false });
});

// GET /api/auth/google - Initiates Google OAuth flow
auth.get('/google', async (c) => {
  try {
    const clientId = c.env.GOOGLE_CLIENT_ID;
    const clientSecret = c.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = c.env.GOOGLE_REDIRECT_URI;

    // Check if Google OAuth is configured
    if (!clientId || !clientSecret || !redirectUri) {
      return c.json({ error: 'Google login is not configured' }, 503);
    }

    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const state = generateState();

    // Generate code challenge from verifier
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store code verifier and state in signed cookies
    const isLocal = c.req.url.includes('localhost') || c.req.url.includes('127.0.0.1');
    
    setCookie(c, 'google_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: !isLocal,
      sameSite: isLocal ? 'Lax' : 'None',
      path: '/',
      maxAge: 10 * 60, // 10 minutes - OAuth flow should be quick
    });

    setCookie(c, 'google_state', state, {
      httpOnly: true,
      secure: !isLocal,
      sameSite: isLocal ? 'Lax' : 'None',
      path: '/',
      maxAge: 10 * 60,
    });

    // Build authorization URL and redirect
    const authUrl = buildAuthorizationUrl(clientId, redirectUri, state, codeChallenge);
    
    return c.redirect(authUrl);
  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    return c.json({ error: 'Failed to initiate Google login' }, 500);
  }
});

// GET /api/auth/google/callback - Handles Google OAuth callback
auth.get('/google/callback', async (c) => {
  try {
    const { code, state, error, error_description } = c.req.query();

    // Handle error from Google (user denied consent)
    if (error) {
      const oauthError = parseGoogleError(error, error_description);
      console.log('Google OAuth error:', oauthError.message);
      return c.redirect(`/student/login?error=${encodeURIComponent(oauthError.message)}`);
    }

    // Validate required params
    if (!code || !state) {
      return c.redirect('/student/login?error=Missing OAuth parameters');
    }

    // Get stored cookies
    const storedState = getCookie(c, 'google_state');
    const codeVerifier = getCookie(c, 'google_code_verifier');

    // Clean up cookies
    deleteCookie(c, 'google_state');
    deleteCookie(c, 'google_code_verifier');

    // Validate state (CSRF protection)
    if (!storedState || storedState !== state) {
      console.error('State mismatch - possible CSRF attack');
      return c.redirect('/student/login?error=Invalid OAuth state');
    }

    // Validate code verifier exists
    if (!codeVerifier) {
      return c.redirect('/student/login?error=OAuth session expired');
    }

    // Exchange code for tokens
    const clientId = c.env.GOOGLE_CLIENT_ID;
    const clientSecret = c.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = c.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return c.redirect('/student/login?error=Google login not configured');
    }

    const tokenResponse = await exchangeCodeForTokens(code, codeVerifier, clientId, clientSecret, redirectUri);

    // Get user info from Google
    const googleUser = await getGoogleUserInfo(tokenResponse.access_token);

    // Find or create user
    let user = await db(c.env.DB).query.users.findFirst({
      where: eq(users.googleId, googleUser.id),
    });

    if (!user) {
      // Check if user exists with same email (link account)
      user = await db(c.env.DB).query.users.findFirst({
        where: eq(users.email, googleUser.email),
      });

      if (user) {
        // Link Google account to existing user
        await db(c.env.DB)
          .update(users)
          .set({ googleId: googleUser.id })
          .where(eq(users.id, user.id));
      } else {
        // Create new user
        const name = googleUser.name || googleUser.email.split('@')[0] || 'User';
        
        const [newUser] = await db(c.env.DB)
          .insert(users)
          .values({
            name,
            email: googleUser.email,
            password: await hashPassword(`google_${crypto.randomUUID()}`), // Random password for Google users
            googleId: googleUser.id,
            role: 'student',
          })
          .returning({ id: users.id });

        // Create student profile
        await db(c.env.DB).insert(studentProfiles).values({
          userId: newUser.id,
          profileCompletion: 20,
        });

        user = await db(c.env.DB).query.users.findFirst({
          where: eq(users.id, newUser.id),
        });
      }
    }

    if (!user) {
      return c.redirect('/student/login?error=Failed to create or link account');
    }

    // Ensure user is a student (not admin/agent)
    if (user.role !== 'student') {
      return c.redirect('/student/login?error=This account cannot log in as student');
    }

    // Set session
    await setSession(c, user.id);

    // Redirect to dashboard
    return c.redirect('/dashboard');
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return c.redirect('/student/login?error=Google login failed');
  }
});

export default auth;
