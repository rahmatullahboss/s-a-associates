import { Hono } from 'hono';
import { db } from '../db/client.js';
import { documents, users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  R2_PUBLIC_URL: string;
};

type Variables = {
  user: typeof users.$inferSelect;
};

const upload = new Hono<{ Bindings: Bindings; Variables: Variables }>();

upload.use('*', authMiddleware);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

upload.post('/', async (c) => {
  try {
    const user = c.get('user');
    const formData = await c.req.formData();
    
    const file = formData.get("file") as unknown as File;
    const name = (formData.get("name") as string)?.trim();
    const type = (formData.get("type") as string) || "Other";
    
    if (!file || !name) {
      return c.json({ error: 'Missing file or name' }, 400);
    }
    
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return c.json({ error: 'File too large (max 10MB)' }, 400);
    }

    const safeFileName = sanitizeFileName(file.name);
    const key = `users/${user.id}/${Date.now()}-${safeFileName}`;
    
    // Upload to Cloudflare R2 using native binding!
    const buffer = await file.arrayBuffer();
    await c.env.BUCKET.put(key, buffer, {
      httpMetadata: { contentType: file.type }
    });

    const publicUrl = c.env.R2_PUBLIC_URL || '';
    const baseUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
    const finalUrl = baseUrl ? `${baseUrl}/${key}` : key;

    await db(c.env.DB).insert(documents).values({
      userId: user.id,
      name,
      url: finalUrl,
      type,
      size: file.size,
      mimeType: file.type,
      status: "Pending",
    });

    return c.json({ success: true, url: finalUrl });
  } catch (error) {
    console.error("Upload failed:", error);
    return c.json({ error: "Upload failed" }, 500);
  }
});

upload.post('/review', async (c) => {
  try {
    const user = c.get('user');
    
    if (user.role !== "admin" && user.role !== "agent") {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const { documentId, status, reviewNote } = await c.req.json();

    if (!documentId || !status) {
      return c.json({ error: 'Missing documentId or status' }, 400);
    }

    await db(c.env.DB)
      .update(documents)
      .set({
        status,
        reviewedByUserId: user.id,
        reviewedAt: new Date(),
        reviewNote: reviewNote || null,
      })
      .where(eq(documents.id, documentId));

    return c.json({ success: true });
  } catch (error) {
    console.error("Review failed:", error);
    return c.json({ error: "Review failed" }, 500);
  }
});

export default upload;
