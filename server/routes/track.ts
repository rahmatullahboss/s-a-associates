import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/client.js';
import { siteSettings } from '../db/schema.js';
import { checkAndIncrementRateLimit } from '../lib/rate-limit.js';

type Bindings = {
  DB: D1Database;
  META_ACCESS_TOKEN?: string;
};

const trackRouter = new Hono<{ Bindings: Bindings }>();

// ── SHA-256 hash helper (required by Meta for all PII) ────────────────────────
async function sha256(value: string): Promise<string> {
  const normalized = value.trim().toLowerCase();
  const data = new TextEncoder().encode(normalized);
  const hashBuffer = await (crypto.subtle as SubtleCrypto).digest({ name: 'SHA-256' }, data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Meta standard event names whitelist (v18.0 spec) ─────────────────────────
const META_STANDARD_EVENTS = new Set([
  'AddPaymentInfo', 'AddToCart', 'AddToWishlist', 'CompleteRegistration',
  'Contact', 'CustomizeProduct', 'Donate', 'FindLocation', 'InitiateCheckout',
  'Lead', 'PageView', 'Purchase', 'Schedule', 'Search', 'StartTrial',
  'SubmitApplication', 'Subscribe', 'ViewContent',
]);

// ── Request schema ─────────────────────────────────────────────────────────────
const trackSchema = z.object({
  event_name: z.string().min(1).max(50),
  event_id: z.string().uuid(),          // required for deduplication
  event_source_url: z.string().url().optional(),
  // User data (plain — server will hash before sending to Meta)
  email: z.string().email().optional(),
  phone: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  // Browser-side Meta cookies (passed from client)
  fbp: z.string().optional(),           // _fbp cookie
  fbc: z.string().optional(),           // _fbc cookie
  // Custom data
  event_data: z.record(z.string(), z.unknown()).optional(),
});

// ── POST /api/track ────────────────────────────────────────────────────────────
trackRouter.post('/', zValidator('json', trackSchema), async (c) => {
  // Rate limit: 20 events per minute per IP (generous for SPA navigation)
  const ip = c.req.header('CF-Connecting-IP')
    ?? c.req.header('X-Forwarded-For')?.split(',')[0].trim()
    ?? '0.0.0.0';
  const rl = await checkAndIncrementRateLimit(db(c.env.DB), `track:${ip}`, 20, 60);
  if (rl.limited) {
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }

  const data = c.req.valid('json');

  // Validate event name (allow custom events prefixed with "Custom")
  if (!META_STANDARD_EVENTS.has(data.event_name) && !data.event_name.startsWith('Custom')) {
    return c.json({ error: `Unknown event: ${data.event_name}` }, 400);
  }

  // Load settings — Pixel ID + CAPI token
  const [settings] = await db(c.env.DB).select().from(siteSettings).limit(1);
  const pixelId = settings?.facebookPixelId;
  // Prefer env secret over DB (env secret overrides DB value if both set)
  const accessToken = c.env.META_ACCESS_TOKEN || settings?.metaAccessToken;
  const testEventCode = settings?.metaTestEventCode || undefined;

  if (!pixelId || !accessToken) {
    // Pixel not configured — silently skip (not an error)
    return c.json({ skipped: true, reason: 'pixel_not_configured' });
  }

  // ── Build user_data — hash all PII per Meta spec ──────────────────────────
  const user_data: Record<string, string | string[]> = {};

  if (data.email) user_data['em'] = await sha256(data.email);
  if (data.phone) {
    // Meta requires E.164 digits only before hashing e.g. "8801712345678"
    const digitsOnly = data.phone.replace(/\D/g, '');
    user_data['ph'] = await sha256(digitsOnly);
  }
  if (data.first_name) user_data['fn'] = await sha256(data.first_name);
  if (data.last_name)  user_data['ln'] = await sha256(data.last_name);

  // Non-PII fields — passed raw (Meta spec)
  if (data.fbp) user_data['fbp'] = data.fbp;
  if (data.fbc) user_data['fbc'] = data.fbc;

  // Client IP + User Agent (required by Meta for match quality score)
  const clientIpAddress = ip !== '0.0.0.0' ? ip : undefined;
  const clientUserAgent = c.req.header('User-Agent');
  if (clientIpAddress) user_data['client_ip_address'] = clientIpAddress;
  if (clientUserAgent) user_data['client_user_agent'] = clientUserAgent;

  // ── Build server event payload (Meta CAPI v18.0 spec) ────────────────────
  const serverEvent: Record<string, unknown> = {
    event_name: data.event_name,
    event_time: Math.floor(Date.now() / 1000),   // Unix timestamp (seconds)
    event_id: data.event_id,                      // deduplication key
    action_source: 'website',                     // required by Meta
    user_data,
  };

  // event_source_url: use client-provided URL, fall back to Referer header
  const eventSourceUrl = data.event_source_url
    ?? c.req.header('Referer')
    ?? undefined;
  if (eventSourceUrl) serverEvent['event_source_url'] = eventSourceUrl;
  if (data.event_data && Object.keys(data.event_data).length > 0) {
    serverEvent['custom_data'] = data.event_data;
  }

  // ── Post to Meta Graph API ────────────────────────────────────────────────
  // Meta docs: access_token should be in request body, not URL query param
  // (URL param also works but body is more secure — token not in server logs)
  const metaUrl = `https://graph.facebook.com/v19.0/${pixelId}/events`;

  const body: Record<string, unknown> = {
    data: [serverEvent],
    access_token: accessToken,   // ✅ body, not URL query string
  };
  if (testEventCode) body['test_event_code'] = testEventCode;

  try {
    const metaRes = await fetch(metaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const metaJson = await metaRes.json() as Record<string, unknown>;

    if (!metaRes.ok) {
      console.error('[CAPI] Meta API error:', JSON.stringify(metaJson));
      return c.json({ capiSuccess: false, metaError: (metaJson as { error?: { message?: string } }).error?.message }, 502);
    }

    // Log events_received for debugging (no PII)
    console.log(`[CAPI] ${data.event_name} → events_received: ${(metaJson as { events_received?: number }).events_received ?? '?'}`);
    return c.json({ capiSuccess: true, events_received: (metaJson as { events_received?: number }).events_received });

  } catch (err) {
    console.error('[CAPI] fetch error:', err);
    return c.json({ capiSuccess: false, error: 'Network error reaching Meta API' }, 502);
  }
});

export default trackRouter;
