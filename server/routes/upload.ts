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

// #11 — Allowlist of permitted MIME types for document uploads
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

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

    // #11 — Validate MIME type against allowlist
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return c.json({ error: 'File type not allowed. Permitted: PDF, JPG, PNG, WebP, DOC, DOCX' }, 400);
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

    const body = await c.req.json() as { documentId?: unknown; status?: unknown; reviewNote?: unknown };
    const { documentId, status, reviewNote } = body;

    // #4 — Validate status against allowlist
    const VALID_DOC_STATUSES = ['Pending', 'Verified', 'Rejected'];
    if (!documentId || typeof documentId !== 'number') {
      return c.json({ error: 'Missing or invalid documentId' }, 400);
    }
    if (!status || !VALID_DOC_STATUSES.includes(status as string)) {
      return c.json({ error: `Invalid status. Must be one of: ${VALID_DOC_STATUSES.join(', ')}` }, 400);
    }

    await db(c.env.DB)
      .update(documents)
      .set({
        status: status as string,
        reviewedByUserId: user.id,
        reviewedAt: new Date(),
        reviewNote: (reviewNote as string) || null,
      })
      .where(eq(documents.id, documentId as number));

    return c.json({ success: true });
  } catch (error) {
    console.error("Review failed:", error);
    return c.json({ error: "Review failed" }, 500);
  }
});

export default upload;
