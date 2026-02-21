import { getCookie } from 'hono/cookie';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import type { Context, Next } from 'hono';
import { verifySessionToken } from '../lib/session.js';

type Bindings = { DB: D1Database; SESSION_SECRET: string };
type Variables = { user: typeof users.$inferSelect };

export const authMiddleware = async (c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) => {
  const sessionToken = getCookie(c, 'session_token');

  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const userId = await verifySessionToken(sessionToken, c.env.SESSION_SECRET);
  if (userId === null) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const user = await db(c.env.DB as D1Database).query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    c.set('user', user);
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
};
