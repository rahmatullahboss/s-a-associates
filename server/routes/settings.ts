import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/client.js';
import { siteSettings, users, availabilitySchedules, availabilityOverrides } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';

type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  R2_PUBLIC_URL: string;
};

type Variables = {
  user: typeof users.$inferSelect;
};

const settingsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const settingsSchema = z.object({
  companyName: z.string().min(1).max(100).optional(),
  companyEmail: z.string().email().optional(),
  companyPhone: z.string().min(1).max(30).optional(),
  companyAddress: z.string().optional(),
  companyLogo: z.string().optional(),
  companyFavicon: z.string().optional(),
  primaryColor: z.string().optional(),
  whatsappNumber: z.string().min(1).max(20).optional(),
  facebookUrl: z.string().optional(),
  heroHeadline: z.string().min(1).max(140).optional(),
  heroSubheadline: z.string().min(1).max(400).optional(),
  ceoProfile: z.object({
    name: z.string().optional(),
    photo: z.string().optional(),
    bio: z.string().optional(),
    socials: z.object({
      facebook: z.string().optional(),
      linkedin: z.string().optional(),
    }).optional(),
  }).optional(),
  metrics: z.object({
    visaSuccessRate: z.string().optional(),
    universitiesCount: z.string().optional(),
    studentsCount: z.string().optional(),
  }).optional(),
  countries: z.array(z.object({
    code: z.string(),
    name: z.string(),
    content: z.string(),
  })).optional(),
  universityLogos: z.array(z.object({
    id: z.string(),
    url: z.string(),
    name: z.string().optional(),
  })).optional(),
  defaultMeetLink: z.string().optional(),
  // Tracking & Analytics
  facebookPixelId: z.string().optional(),
  metaAccessToken: z.string().optional(),
  metaTestEventCode: z.string().optional(),
  googleAnalyticsId: z.string().optional(),
  clarityProjectId: z.string().optional(),
  slotDuration: z.number().int().min(15).max(120).optional(),
  bufferTime: z.number().int().min(0).max(60).optional(),
  maxBookingsPerDay: z.number().int().min(1).max(50).optional(),
  advanceBookingDays: z.number().int().min(1).max(90).optional(),
});

// Utility to get current settings
async function getSiteSettings(dbClient: ReturnType<typeof db>) {
  try {
    const [row] = await dbClient.select().from(siteSettings).where(eq(siteSettings.id, 1));
    if (!row) {
      return null; 
    }
    return row;
  } catch (error) {
    console.error("Error getting settings:", error);
    return null;
  }
}

// Public endpoint to get settings
settingsRouter.get('/', async (c) => {
  try {
    const settings = await getSiteSettings(db(c.env.DB));
    if (!settings) {
      return c.json({ success: true, settings: null });
    }
    return c.json({ success: true, settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return c.json({ error: "Failed to fetch settings" }, 500);
  }
});

// Admin endpoints protected by auth middleware
settingsRouter.use('*', authMiddleware);

settingsRouter.put('/', zValidator('json', settingsSchema), async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'agent') {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const data = c.req.valid('json') as Record<string, unknown>;

  try {
    // Filter out undefined values
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    // Always update - record exists
    await db(c.env.DB)
        .update(siteSettings)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(siteSettings.id, 1));

    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to save settings:", error);
    return c.json({ error: "Failed to save settings" }, 500);
  }
});

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

settingsRouter.post('/upload-asset', async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'agent') {
    return c.json({ error: 'Forbidden' }, 403);
  }

  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as unknown as File;
    const type = formData.get("type") as string; // 'ceo' or 'university'

    if (!file || file.size === 0) return c.json({ error: "No file selected" }, 400);
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) return c.json({ error: "Only JPG, PNG, or WebP images allowed" }, 400);
    if (file.size > MAX_IMAGE_SIZE) return c.json({ error: "File too large. Max 5MB." }, 400);

    const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
    let key = '';

    if (type === 'ceo') {
        key = `public/ceo-photo.${ext}`;
    } else if (type === 'university') {
        const timestamp = Date.now();
        key = `public/universities/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    } else {
        return c.json({ error: "Invalid upload type" }, 400);
    }

    // Upload to Cloudflare R2
    const buffer = await file.arrayBuffer();
    await c.env.BUCKET.put(key, buffer, {
      httpMetadata: { contentType: file.type },
      customMetadata: { public: "true" }
    });

    const publicUrl = c.env.R2_PUBLIC_URL || '';
    const baseUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
    const finalUrl = baseUrl ? `${baseUrl}/${key}` : key;

    // Optional: automatically update the DB for ceo photo like the original action did
    if (type === 'ceo') {
      const current = await getSiteSettings(db(c.env.DB)) as typeof siteSettings.$inferSelect;
      const currentCeoProfile = current.ceoProfile || {};
      
      await db(c.env.DB).update(siteSettings).set({
        ceoProfile: {
          ...currentCeoProfile,
          photo: finalUrl
        },
        updatedAt: new Date()
      }).where(eq(siteSettings.id, 1));
    }

    return c.json({ success: true, url: finalUrl });
  } catch (error) {
    console.error("Asset upload failed:", error);
    return c.json({ error: "Upload failed" }, 500);
  }
});

// ─── Availability Schedules (Weekly Recurring) ────────────────────────────────

const scheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isActive: z.boolean().optional().default(true),
});

// GET all weekly schedules (public - needed for booking modal)
settingsRouter.get('/availability/schedules', async (c) => {
  try {
    const schedules = await db(c.env.DB).select().from(availabilitySchedules);
    return c.json({ success: true, schedules });
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to fetch schedules' }, 500);
  }
});

// PUT — replace all weekly schedules at once (admin)
settingsRouter.put('/availability/schedules', zValidator('json', z.array(scheduleSchema)), async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'agent') return c.json({ error: 'Forbidden' }, 403);

  const data = c.req.valid('json');
  try {
    // Delete all existing, re-insert
    await db(c.env.DB).delete(availabilitySchedules);
    if (data.length > 0) {
      await db(c.env.DB).insert(availabilitySchedules).values(data);
    }
    const schedules = await db(c.env.DB).select().from(availabilitySchedules);
    return c.json({ success: true, schedules });
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to save schedules' }, 500);
  }
});

// ─── Availability Overrides (One-time date exceptions) ────────────────────────

const overrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isOff: z.boolean().default(true),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  note: z.string().max(200).optional().nullable(),
});

// GET all overrides (public - needed for booking modal)
settingsRouter.get('/availability/overrides', async (c) => {
  try {
    const overrides = await db(c.env.DB).select().from(availabilityOverrides);
    return c.json({ success: true, overrides });
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to fetch overrides' }, 500);
  }
});

// POST — add a new override (admin)
settingsRouter.post('/availability/overrides', zValidator('json', overrideSchema), async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'agent') return c.json({ error: 'Forbidden' }, 403);

  const data = c.req.valid('json');
  try {
    // Upsert: if date exists, update it
    const existing = await db(c.env.DB).select({ id: availabilityOverrides.id }).from(availabilityOverrides).where(eq(availabilityOverrides.date, data.date));
    if (existing.length > 0) {
      await db(c.env.DB).update(availabilityOverrides).set({
        isOff: data.isOff,
        startTime: data.startTime ?? null,
        endTime: data.endTime ?? null,
        note: data.note ?? null,
      }).where(eq(availabilityOverrides.date, data.date));
    } else {
      await db(c.env.DB).insert(availabilityOverrides).values({
        date: data.date,
        isOff: data.isOff,
        startTime: data.startTime ?? null,
        endTime: data.endTime ?? null,
        note: data.note ?? null,
      });
    }
    const overrides = await db(c.env.DB).select().from(availabilityOverrides);
    return c.json({ success: true, overrides });
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to save override' }, 500);
  }
});

// DELETE — remove an override by id (admin)
settingsRouter.delete('/availability/overrides/:id', async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'agent') return c.json({ error: 'Forbidden' }, 403);

  const id = Number(c.req.param('id'));
  try {
    await db(c.env.DB).delete(availabilityOverrides).where(eq(availabilityOverrides.id, id));
    return c.json({ success: true });
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to delete override' }, 500);
  }
});

export default settingsRouter;
