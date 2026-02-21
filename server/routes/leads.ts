import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/client.js';
import { leads, users, bookings } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { getCookie } from 'hono/cookie';

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
};

const leadsRouter = new Hono<{ Bindings: Bindings }>();

leadsRouter.post('/', zValidator('json', leadSchema), async (c) => {
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

    // Check if slot is taken
    const [existing] = await db(c.env.DB).select().from(bookings).where(
      and(
        eq(bookings.date, bookingDate), 
        eq(bookings.timeSlot, data.timeSlot),
        eq(bookings.status, 'pending')
      )
    ).limit(1);

    if (existing) {
      return c.json({ error: 'This time slot is already booked. Please choose another.' }, 400);
    }

    // Detect logged in user from session cookie
    let studentUserId: number | null = null;
    const sessionToken = getCookie(c, 'session_token');
    if (sessionToken) {
      const userId = parseInt(sessionToken, 10);
      if (!isNaN(userId)) {
        const user = await db(c.env.DB).query.users.findFirst({
          where: eq(users.id, userId),
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
      const [booking] = await db(c.env.DB).insert(bookings).values({
        name: data.name,
        email: data.email,
        phone: data.phone,
        date: bookingDate,
        timeSlot: data.timeSlot,
        source: 'homepage',
        status: 'pending',
        timezone: 'Asia/Dhaka',
        studentUserId: studentUserId ?? undefined,
        createdAt: new Date(),
      }).returning({ id: bookings.id });

      return c.json({ success: true, bookingId: booking.id });
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

// GET /api/leads/booked-slots?date=YYYY-MM-DD
leadsRouter.get('/booked-slots', async (c) => {
  try {
    const date = c.req.query('date');
    if (!date) return c.json({ slots: [] });

    const bookedSlots = await db(c.env.DB)
      .select({ timeSlot: bookings.timeSlot })
      .from(bookings)
      .where(eq(bookings.date, date));

    return c.json({ slots: bookedSlots.map(b => b.timeSlot) });
  } catch (error) {
    console.error("Failed to fetch booked slots:", error);
    return c.json({ slots: [] });
  }
});

export default leadsRouter;
