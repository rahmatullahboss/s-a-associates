import { getCookie } from 'hono/cookie';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import type { Context, Next } from 'hono';

export const authMiddleware = async (c: Context, next: Next) => {
  const sessionToken = getCookie(c, 'session_token');

  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const userId = parseInt(sessionToken, 10);
  if (isNaN(userId)) {
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
