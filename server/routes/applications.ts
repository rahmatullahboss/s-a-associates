import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { applications } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { getCookie } from 'hono/cookie';

type Bindings = { DB: D1Database };
type Variables = { userId: number; userRole: string };

const applicationsRoute = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Inject user from session cookie
applicationsRoute.use('*', async (c, next) => {
  const sessionToken = getCookie(c, 'session_token');
  if (!sessionToken) return c.json({ error: 'Unauthorized' }, 401);
  const userId = parseInt(sessionToken, 10);
  if (isNaN(userId)) return c.json({ error: 'Unauthorized' }, 401);
  c.set('userId', userId);
  c.set('userRole', 'student');
  await next();
});

// GET /api/applications - list current user's applications
applicationsRoute.get('/', async (c) => {
  const userId = c.get('userId');
  const results = await db(c.env.DB)
    .select()
    .from(applications)
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.createdAt));
  return c.json({ applications: results });
});

const newApplicationSchema = z.object({
  university: z.string().min(2),
  course: z.string().min(2),
  country: z.string().optional(),
  intake: z.string().optional(),
  notes: z.string().optional(),
});

// POST /api/applications - create a new application
applicationsRoute.post('/', zValidator('json', newApplicationSchema), async (c) => {
  const userId = c.get('userId');
  const { university, course, intake } = c.req.valid('json');

  const today = new Date().toISOString().split('T')[0];

  const [inserted] = await db(c.env.DB)
    .insert(applications)
    .values({
      userId,
      university,
      course,
      status: 'Pending',
      date: intake ?? today,
    })
    .returning({ id: applications.id });

  return c.json({ success: true, id: inserted.id }, 201);
});

export default applicationsRoute;
