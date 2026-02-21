import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/client.js';
import { leads, users, bookings } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

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

    // Insert booking
    const [booking] = await db(c.env.DB).insert(bookings).values({
      name: data.name,
      email: data.email,
      phone: data.phone,
      date: bookingDate,
      timeSlot: data.timeSlot,
      source: 'homepage',
      status: 'pending',
      timezone: 'Asia/Dhaka',
      createdAt: new Date(),
    }).returning({ id: bookings.id });

    return c.json({ success: true, bookingId: booking.id });
  } catch (error) {
    console.error("Failed to submit booking:", error);
    return c.json({ error: "Failed to book consultation" }, 500);
  }
});

export default leadsRouter;
