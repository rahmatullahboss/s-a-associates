import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/client.js';
import { siteSettings, users } from '../db/schema.js';
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
  companyName: z.string().min(2).max(100),
  companyEmail: z.string().email(),
  companyPhone: z.string().min(5).max(30),
  companyAddress: z.string().optional(),
  companyLogo: z.string().optional(),
  companyFavicon: z.string().optional(),
  primaryColor: z.string().optional(),
  whatsappNumber: z.string().min(8).max(20),
  facebookUrl: z.string().url(),
  heroHeadline: z.string().min(10).max(140),
  heroSubheadline: z.string().min(20).max(400),
  ceoProfile: z.object({
    name: z.string(),
    photo: z.string().optional(),
    bio: z.string().optional(),
    socials: z.object({
      facebook: z.string().optional(),
      linkedin: z.string().optional(),
    }).optional(),
  }).optional(),
  metrics: z.object({
    visaSuccessRate: z.string(),
    universitiesCount: z.string(),
    studentsCount: z.string(),
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
});

// Utility to get current settings
async function getSiteSettings(dbClient: ReturnType<typeof db>) {
  const [row] = await dbClient.select().from(siteSettings).where(eq(siteSettings.id, 1));
  if (!row) {
    // Basic defaults if empty
    return {}; 
  }
  return row;
}

// Public endpoint to get settings
settingsRouter.get('/', async (c) => {
  try {
    const settings = await getSiteSettings(db(c.env.DB));
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

  const data = c.req.valid('json');

  try {
    const existing = await db(c.env.DB).query.siteSettings.findFirst({
        where: eq(siteSettings.id, 1)
    });

    if (existing) {
        await db(c.env.DB)
            .update(siteSettings)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(siteSettings.id, 1));
    } else {
        await db(c.env.DB)
            .insert(siteSettings)
            .values({ id: 1, ...data, updatedAt: new Date() });
    }

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

export default settingsRouter;
