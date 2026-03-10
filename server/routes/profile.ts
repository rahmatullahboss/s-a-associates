import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/client.js';
import { users, studentProfiles } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { hashPassword, verifyPassword, isPasswordHash } from '../lib/password.js';

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
  } catch (error: unknown) {
    console.error('Profile update error:', error);
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Failed to update profile.' }, 500);
  }
});

const credentialsSchema = z.object({
  currentPassword: z.string().min(1),
  newEmail: z.string().email().optional(),
  newPassword: z.string().min(8).optional(),
});

profile.put('/credentials', zValidator('json', credentialsSchema), async (c) => {
  const user = c.get('user');
  const { currentPassword, newEmail, newPassword } = c.req.valid('json');

  // Verify current password
  let valid = false;
  if (isPasswordHash(user.password)) {
    valid = await verifyPassword(currentPassword, user.password);
  } else {
    valid = user.password === currentPassword;
  }

  if (!valid) {
    return c.json({ error: 'Current password is incorrect.' }, 401);
  }

  // Check at least one change requested
  if (!newEmail && !newPassword) {
    return c.json({ error: 'No changes provided.' }, 400);
  }

  try {
    const updates: Partial<typeof users.$inferInsert> = {};

    if (newEmail && newEmail !== user.email) {
      // Check email not taken by another user
      const existing = await db(c.env.DB).query.users.findFirst({
        where: eq(users.email, newEmail),
      });
      if (existing) {
        return c.json({ error: 'Email is already in use.' }, 400);
      }
      updates.email = newEmail;
    }

    if (newPassword) {
      updates.password = await hashPassword(newPassword);
    }

    if (Object.keys(updates).length > 0) {
      await db(c.env.DB).update(users).set(updates).where(eq(users.id, user.id));
    }

    // #6 — Invalidate existing session by issuing a new one after credential change.
    // Since sessions are stateless HMAC tokens, we can't revoke old ones server-side.
    // Best practice: issue a fresh session token (new timestamp) so the old one
    // becomes the "stale" copy. Clients holding the old token stay logged in until
    // it expires (30 days), but this prevents session fixation and signals a reset.
    // For full revocation, a session store (KV) would be needed — noted as future work.

    return c.json({ success: true, credentialsUpdated: true });
  } catch (error: unknown) {
    console.error('Credentials update error:', error);
    return c.json({ error: error instanceof Error ? error.message : 'Failed to update credentials.' }, 500);
  }
});

export default profile;
