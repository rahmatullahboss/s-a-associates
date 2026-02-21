import { Hono } from 'hono';
import { cors } from 'hono/cors';
import auth from './routes/auth.js';
import profile from './routes/profile.js';
import upload from './routes/upload.js';
import leads from './routes/leads.js';
import settings from './routes/settings.js';

type CloudflareBindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use('*', cors({
  origin: (origin) => {
    if (!origin) return 'http://localhost:5173';
    if (origin.endsWith('.pages.dev') || origin.endsWith('.tawakkul-vite.pages.dev') || origin === 'https://s-a-associates.com' || origin.startsWith('http://localhost:')) {
      return origin;
    }
    return 'https://s-a-associates-frontend.pages.dev';
  },
  credentials: true,
}));

app.get('/', (c) => {
  return c.text('Tawakkul API is running!')
})

import dashboard from './routes/dashboard.js';
import applicationsRoute from './routes/applications.js';

app.route('/api/auth', auth);
app.route('/api/profile', profile);
app.route('/api/upload', upload);
app.route('/api/leads', leads);
app.route('/api/settings', settings);
app.route('/api/site-settings', settings);
app.route('/api/dashboard', dashboard);
app.route('/api/applications', applicationsRoute);

export default app
