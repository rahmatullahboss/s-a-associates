import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/client.js';
import { leads, users, bookings, siteSettings, availabilitySchedules, availabilityOverrides } from '../db/schema.js';
import { eq, and, sql, ne } from 'drizzle-orm';
import { z } from 'zod';
import { getCookie } from 'hono/cookie';
import { sendBookingCreatedEmail } from '../lib/email.js';
import { verifySessionToken } from '../lib/session.js';
import { checkAndIncrementRateLimit } from '../lib/rate-limit.js';

// ── Slot generation helper ────────────────────────────────────────────────────
// Generates time slot strings (e.g. "10:00 AM") for a given date
// based on admin-configured weekly schedule + overrides + already-booked slots.
async function generateAvailableSlots(
  dbClient: ReturnType<typeof db>,
  dateStr: string // "YYYY-MM-DD"
): Promise<{ slots: string[]; isOff: boolean; offNote?: string }> {
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

  // 1. Check for date override
  const [override] = await dbClient
    .select()
    .from(availabilityOverrides)
    .where(eq(availabilityOverrides.date, dateStr));

  if (override) {
    if (override.isOff) {
      return { slots: [], isOff: true, offNote: override.note ?? undefined };
    }
    // Custom hours for this date
    if (override.startTime && override.endTime) {
      const bookedSlots = await getBookedSlots(dbClient, dateStr);
      const settings = await getSlotSettings(dbClient);
      const slots = buildSlots(override.startTime, override.endTime, settings.slotDuration, settings.bufferTime, bookedSlots);
      return { slots, isOff: false };
    }
  }

  // 2. Use weekly schedule
  const [schedule] = await dbClient
    .select()
    .from(availabilitySchedules)
    .where(and(
      eq(availabilitySchedules.dayOfWeek, dayOfWeek),
      eq(availabilitySchedules.isActive, true)
    ));

  if (!schedule) {
    return { slots: [], isOff: true, offNote: 'Not available on this day' };
  }

  const bookedSlots = await getBookedSlots(dbClient, dateStr);
  const settings = await getSlotSettings(dbClient);

  // Check max bookings per day
  if (bookedSlots.length >= settings.maxBookingsPerDay) {
    return { slots: [], isOff: false };
  }

  const slots = buildSlots(schedule.startTime, schedule.endTime, settings.slotDuration, settings.bufferTime, bookedSlots);
  return { slots, isOff: false };
}

async function getBookedSlots(dbClient: ReturnType<typeof db>, dateStr: string): Promise<string[]> {
  const rows = await dbClient
    .select({ timeSlot: bookings.timeSlot })
    .from(bookings)
    .where(and(eq(bookings.date, dateStr), sql`${bookings.status} != 'cancelled'`));
  return rows.map(r => r.timeSlot);
}

async function getSlotSettings(dbClient: ReturnType<typeof db>) {
  const [s] = await dbClient
    .select({ slotDuration: siteSettings.slotDuration, bufferTime: siteSettings.bufferTime, maxBookingsPerDay: siteSettings.maxBookingsPerDay })
    .from(siteSettings)
    .where(eq(siteSettings.id, 1));
  return {
    slotDuration: s?.slotDuration ?? 60,
    bufferTime: s?.bufferTime ?? 0,
    maxBookingsPerDay: s?.maxBookingsPerDay ?? 8,
  };
}

// Build slots between startTime and endTime, excluding already-booked ones
function buildSlots(startTime: string, endTime: string, durationMin: number, bufferMin: number, bookedSlots: string[]): string[] {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;
  // #9 — Guard against NaN from malformed DB time values
  if (!Number.isFinite(startTotal) || !Number.isFinite(endTotal) || startTotal >= endTotal) {
    console.error(`[buildSlots] Invalid time range: ${startTime} → ${endTime}`);
    return [];
  }
  const step = durationMin + bufferMin;

  const slots: string[] = [];
  for (let mins = startTotal; mins + durationMin <= endTotal; mins += step) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h < 12 ? 'AM' : 'PM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const label = `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
    if (!bookedSlots.includes(label)) {
      slots.push(label);
    }
  }
  return slots;
}

const leadSchema = z.object({
  name: z.string().min(1).max(256),
  email: z.string().email().max(256),
  phone: z.string().min(1).max(50),
  program: z.string().min(1).max(256),
  budget: z.string().min(1).max(256),
  countryInterest: z.string().max(256).optional(),
  message: z.string().max(2000).optional(),
  source: z.string().max(50).optional(),
});

type Bindings = {
  DB: D1Database;
  RESEND_API_KEY?: string;
  SESSION_SECRET: string;
};

const leadsRouter = new Hono<{ Bindings: Bindings }>();

leadsRouter.post('/', zValidator('json', leadSchema), async (c) => {
  // #2 — Rate limit lead submissions: 5 per 10 minutes per IP
  const ip = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For')?.split(',')[0].trim() ?? '0.0.0.0';
  const rl = await checkAndIncrementRateLimit(db(c.env.DB), `lead:${ip}`, 5, 10 * 60);
  if (rl.limited) {
    return c.json({ error: 'Too many submissions. Please try again later.' }, 429);
  }
  try {
    const data = c.req.valid('json');

    // Insert the lead
    const [lead] = await db(c.env.DB).insert(leads).values({
      name: data.name,
      email: data.email,
      phone: data.phone,
      program: data.program,
      budget: data.budget,
      countryInterest: data.countryInterest,
      message: data.message,
      source: data.source,
    }).returning({ id: leads.id });

    // Check if user exists with this email
    const existingUser = await db(c.env.DB).query.users.findFirst({
        where: eq(users.email, data.email)
    });

    // Create a pending booking if user exists
    if (existingUser) {
        await db(c.env.DB).insert(bookings).values({
            name: data.name,
            email: data.email,
            phone: data.phone,
            studentUserId: existingUser.id,
            leadId: lead.id,
            source: 'website_lead',
            date: 'Pending Coordination',
            timeSlot: 'Pending',
            status: 'pending',
            createdAt: new Date(),
        });
    }

    return c.json({ success: true, leadId: lead.id });
  } catch (error) {
    console.error("Failed to submit lead:", error);
    return c.json({ error: "Failed to submit lead" }, 500);
  }
});

const bookingSchema = z.object({
  name: z.string().min(1).max(256),
  email: z.string().email().max(256),
  phone: z.string().min(1).max(50),
  date: z.string().min(1).max(50),
  timeSlot: z.string().min(1).max(50),
});

leadsRouter.post('/book', zValidator('json', bookingSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const bookingDate = new Date(data.date).toISOString().split('T')[0];

    // #3 — Check if slot is taken across ALL non-cancelled statuses
    const [existing] = await db(c.env.DB).select().from(bookings).where(
      and(
        eq(bookings.date, bookingDate),
        eq(bookings.timeSlot, data.timeSlot),
        ne(bookings.status, 'cancelled')
      )
    ).limit(1);

    if (existing) {
      return c.json({ error: 'This time slot is already booked. Please choose another.' }, 400);
    }

    // #1 — Detect logged-in user via proper HMAC-verified session token
    let studentUserId: number | null = null;
    const sessionToken = getCookie(c, 'session_token');
    if (sessionToken) {
      const verifiedUserId = await verifySessionToken(sessionToken, c.env.SESSION_SECRET);
      if (verifiedUserId !== null) {
        const user = await db(c.env.DB).query.users.findFirst({
          where: eq(users.id, verifiedUserId),
        });
        if (user && user.role === 'student') {
          studentUserId = user.id;
        }
      }
    }

    // If no session, try to find user by email
    if (!studentUserId && data.email) {
      const user = await db(c.env.DB).query.users.findFirst({
        where: eq(users.email, data.email),
      });
      if (user && user.role === 'student') {
        studentUserId = user.id;
      }
    }

    // Insert booking — the DB unique index on (date, timeSlot) is the
    // authoritative guard against double-booking race conditions.
    try {
      // Get defaultMeetLink from settings for auto-confirm
      const [bookingSettings] = await db(c.env.DB)
        .select({ defaultMeetLink: siteSettings.defaultMeetLink, companyName: siteSettings.companyName })
        .from(siteSettings)
        .where(eq(siteSettings.id, 1));
      const meetLinkValue = bookingSettings?.defaultMeetLink || '';
      const companyName = bookingSettings?.companyName || 'Tawakkul Education';

      const [booking] = await db(c.env.DB).insert(bookings).values({
        name: data.name,
        email: data.email,
        phone: data.phone,
        date: bookingDate,
        timeSlot: data.timeSlot,
        source: 'homepage',
        status: 'confirmed', // Auto-confirm (approval flow disabled for now)
        meetingLink: meetLinkValue,
        timezone: 'Asia/Dhaka',
        studentUserId: studentUserId ?? undefined,
        createdAt: new Date(),
      }).returning({ id: bookings.id });

      // Also add to leads list so admin can track all inquiries
      const existingLead = await db(c.env.DB).select({ id: leads.id }).from(leads).where(eq(leads.email, data.email)).limit(1);
      if (existingLead.length === 0) {
        await db(c.env.DB).insert(leads).values({
          name: data.name,
          email: data.email,
          phone: data.phone,
          program: 'Not specified',
          budget: 'Not specified',
          source: 'homepage_booking',
        });
      }

      // Send confirmation email to student (non-blocking)
      sendBookingCreatedEmail(
        { RESEND_API_KEY: c.env.RESEND_API_KEY, companyName },
        {
          toEmail: data.email,
          toName: data.name,
          date: bookingDate,
          timeSlot: data.timeSlot,
          bookingId: booking.id,
          companyName,
        }
      ).catch(err => console.error('[Email] booking created email failed:', err));

      return c.json({ success: true, bookingId: booking.id, meetLink: meetLinkValue });
    } catch (insertError: unknown) {
      // Catch UNIQUE constraint violation from concurrent bookings
      const msg = insertError instanceof Error ? insertError.message : String(insertError);
      if (msg.includes('UNIQUE constraint failed') || msg.includes('SQLITE_CONSTRAINT')) {
        return c.json({ error: 'This time slot is already booked. Please choose another.' }, 400);
      }
      throw insertError;
    }
  } catch (error) {
    console.error("Failed to submit booking:", error);
    return c.json({ error: "Failed to book consultation" }, 500);
  }
});

// GET /api/leads/available-slots?date=YYYY-MM-DD
// Returns server-generated available slots for a date (respects schedule, overrides, booked slots)
leadsRouter.get('/available-slots', async (c) => {
  try {
    const date = c.req.query('date');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return c.json({ slots: [], isOff: false });
    }
    const result = await generateAvailableSlots(db(c.env.DB), date);
    return c.json(result);
  } catch (error) {
    console.error("Failed to fetch available slots:", error);
    return c.json({ slots: [], isOff: false });
  }
});

// GET /api/leads/booked-slots?date=YYYY-MM-DD (kept for backward compat)
leadsRouter.get('/booked-slots', async (c) => {
  try {
    const date = c.req.query('date');
    if (!date) return c.json({ slots: [] });
    const bookedSlots = await getBookedSlots(db(c.env.DB), date);
    return c.json({ slots: bookedSlots });
  } catch (error) {
    console.error("Failed to fetch booked slots:", error);
    return c.json({ slots: [] });
  }
});

export default leadsRouter;
