import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { applications, users } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

type Bindings = { DB: D1Database; SESSION_SECRET: string };
type Variables = { user: typeof users.$inferSelect };

const applicationsRoute = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// All application routes require a verified session
applicationsRoute.use('*', authMiddleware);

// GET /api/applications - list current user's applications
applicationsRoute.get('/', async (c) => {
  const user = c.get('user');
  const results = await db(c.env.DB)
    .select()
    .from(applications)
    .where(eq(applications.userId, user.id))
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
  const user = c.get('user');
  const { university, course, intake } = c.req.valid('json');

  const today = new Date().toISOString().split('T')[0];

  const [inserted] = await db(c.env.DB)
    .insert(applications)
    .values({
      userId: user.id,
      university,
      course,
      status: 'Pending',
      date: intake ?? today,
    })
    .returning({ id: applications.id });

  return c.json({ success: true, id: inserted.id }, 201);
});

export default applicationsRoute;
