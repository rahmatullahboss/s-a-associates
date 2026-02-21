import { Hono } from 'hono';
import { cors } from 'hono/cors';
import auth from './routes/auth.js';
import profile from './routes/profile.js';
import upload from './routes/upload.js';
import leads from './routes/leads.js';
import settings from './routes/settings.js';
import dashboard from './routes/dashboard.js';
import applicationsRoute from './routes/applications.js';

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

export default app;
