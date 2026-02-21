import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/client.js';
import { users, studentProfiles } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';

const profileSchema = z.object({
  name: z.string().min(2).max(256),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  preferredProgram: z.string().max(256).optional(),
  budgetRange: z.string().max(256).optional(),
  countryInterest: z.string().max(256).optional(),
});

type Bindings = {
  DB: D1Database;
};

type Variables = {
  user: typeof users.$inferSelect;
};

const profile = new Hono<{ Bindings: Bindings; Variables: Variables }>();

profile.use('*', authMiddleware);

profile.get('/', async (c) => {
  const user = c.get('user');

  try {
    const profileData = await db(c.env.DB).query.studentProfiles.findFirst({
      where: eq(studentProfiles.userId, user.id),
    });

    return c.json({ user, profile: profileData ?? null });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return c.json({ error: 'An error occurred fetching profile' }, 500);
  }
});

profile.put('/', zValidator('json', profileSchema), async (c) => {
  const user = c.get('user');
  const data = c.req.valid('json');

  try {
    // Update user name
    if (data.name !== user.name) {
      await db(c.env.DB).update(users).set({ name: data.name }).where(eq(users.id, user.id));
    }

    // Update profile (upsert)
    // Note: D1 SQLite does not have standard .onConflictDoUpdate support like Postgres in all cases
    // so we handle upsert safely using select then insert or update.
    const existingProfile = await db(c.env.DB).query.studentProfiles.findFirst({
        where: eq(studentProfiles.userId, user.id),
    });

    if (existingProfile) {
        await db(c.env.DB)
            .update(studentProfiles)
            .set({
                phone: data.phone,
                address: data.address,
                preferredProgram: data.preferredProgram,
                budgetRange: data.budgetRange,
                countryInterest: data.countryInterest,
                updatedAt: new Date(),
            })
            .where(eq(studentProfiles.userId, user.id));
    } else {
        await db(c.env.DB)
            .insert(studentProfiles)
            .values({
                userId: user.id,
                phone: data.phone,
                address: data.address,
                preferredProgram: data.preferredProgram,
                budgetRange: data.budgetRange,
                countryInterest: data.countryInterest,
            });
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default profile;
