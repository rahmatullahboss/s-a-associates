import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { cache } from 'hono/cache';
import { secureHeaders } from 'hono/secure-headers';
import auth from './routes/auth.js';
import profile from './routes/profile.js';
import upload from './routes/upload.js';
import leads from './routes/leads.js';
import settings from './routes/settings.js';
import dashboard from './routes/dashboard.js';
import applicationsRoute from './routes/applications.js';
import track from './routes/track.js';

type CloudflareBindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  SESSION_SECRET: string;
};

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Explicit CORS allowlist — never reflect arbitrary *.pages.dev origins.
// credentials:true + SameSite=None is only safe when the origin set is tightly controlled.
const ALLOWED_ORIGINS = new Set([
  'https://s-a-associates.com',
  'https://www.s-a-associates.com',
  'https://s-a-associates-frontend.pages.dev',
]);

// ── Security headers on all responses ────────────────────────────────────────
app.use('*', secureHeaders());

// ── Cache public GET /api/settings at the CF edge for 5 min ─────────────────
// Settings rarely change — caching saves a D1 query on every page load.
app.get('/api/settings', cache({ cacheName: 'site-settings', cacheControl: 'public, max-age=300, s-maxage=300' }));
app.get('/api/site-settings', cache({ cacheName: 'site-settings', cacheControl: 'public, max-age=300, s-maxage=300' }));

app.use('*', cors({
  origin: (origin) => {
    if (!origin) return null; // non-browser / same-origin requests
    if (ALLOWED_ORIGINS.has(origin)) return origin;
    // Allow localhost on any port during local development
    if (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
      return origin;
    }
    return null; // reject all other origins (no CORS headers sent)
  },
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

app.get('/', (c) => {
  return c.text('Tawakkul API is running!');
});

app.route('/api/auth', auth);
app.route('/api/profile', profile);
app.route('/api/upload', upload);
app.route('/api/leads', leads);
app.route('/api/settings', settings);
app.route('/api/site-settings', settings);
app.route('/api/dashboard', dashboard);
app.route('/api/applications', applicationsRoute);
app.route('/api/track', track);

export default app;
