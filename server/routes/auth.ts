import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { db } from '../db/client.js'; // We'll need to create this client
import { users, studentProfiles } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { loginSchema, signupSchema } from '../schemas/auth'; // Importing existing schemas
import { hashPassword, verifyPassword, isPasswordHash } from '../lib/password.js';

type Bindings = {
  DB: D1Database;
};

const auth = new Hono<{ Bindings: Bindings }>();

// Helper to set session (placeholder for now, will implement JWT)
const setSession = async (c: any, userId: number) => {
  // In a real app, sign a JWT and set it
  setCookie(c, 'session_token', userId.toString(), {
    httpOnly: true,
    secure: true, // Must be true for SameSite=None
    sameSite: 'None', // Required for cross-domain Pages <-> Workers
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
};

auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const loginAs = c.req.query('loginAs') ?? 'student';

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

    await setSession(c, user.id);
    return c.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'An error occurred during login' }, 500);
  }
});

auth.post('/signup', zValidator('json', signupSchema), async (c) => {
  const { name, email, password, phone } = c.req.valid('json');

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
        // Create student profile with phone number
        await db(c.env.DB).insert(studentProfiles).values({
            userId: newUser.id,
            phone,
            profileCompletion: 20 // Started with basic info
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

auth.post('/logout', async (c) => {
  deleteCookie(c, 'session_token');
  return c.json({ success: true });
});

auth.get('/me', async (c) => {
  try {
    const sessionTokenStr = getCookie(c, 'session_token');
    
    if (sessionTokenStr) {
       const userId = parseInt(sessionTokenStr, 10);
       if (!isNaN(userId)) {
          const user = await db(c.env.DB).query.users.findFirst({
             where: eq(users.id, userId),
          });

          if (user) {
             return c.json({ 
                 authenticated: true, 
                 user: { id: user.id, name: user.name, role: user.role } 
             });
          }
       }
    }
  } catch(error) {
    console.error('Session validation error:', error);
  }
  
  return c.json({ authenticated: false });
});

export default auth;
