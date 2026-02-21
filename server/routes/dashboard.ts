import { Hono } from 'hono';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { bookings, documents, users, applications, bookingEvents, leads } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

type Bindings = {
  DB: D1Database;
};

type Variables = {
  user: typeof users.$inferSelect;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use('*', authMiddleware);

// GET /api/dashboard
app.get('/', async (c) => {
  try {
    const user = c.get('user');
    
    const userRole = user.role as 'student' | 'admin' | 'agent';
    const isStudent = userRole === 'student';

    const bookingFilter = isStudent ? eq(bookings.studentUserId, user.id) : undefined;

    // Get counts via SQL aggregation instead of fetching all rows
    const [statsResult] = await db(c.env.DB)
      .select({
        total: sql<number>`count(*)`,
        pending: sql<number>`count(*) filter (where ${bookings.status} = 'pending')`,
        completed: sql<number>`count(*) filter (where ${bookings.status} = 'completed')`,
        confirmed: sql<number>`count(*) filter (where ${bookings.status} = 'confirmed')`,
      })
      .from(bookings)
      .where(bookingFilter);

    // Recent bookings - only fetch 10
    const recentBookings = await db(c.env.DB).select().from(bookings)
      .where(bookingFilter)
      .orderBy(desc(bookings.createdAt))
      .limit(10);

    // Queue bookings (pending) - only for admin/agent
    const queueBookings = isStudent ? [] : await db(c.env.DB).select().from(bookings)
      .where(bookingFilter ? sql`${bookings.studentUserId} = ${user.id} AND ${bookings.status} = 'pending'` : eq(bookings.status, 'pending'))
      .orderBy(desc(bookings.createdAt));

    // Document count
    const [docCount] = await db(c.env.DB)
      .select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(isStudent ? eq(documents.userId, user.id) : undefined);

    // Applications
    const userApplications = isStudent ? await db(c.env.DB).select().from(applications).where(eq(applications.userId, user.id)).orderBy(desc(applications.createdAt)) : [];

    return c.json({
      role: userRole,
      userName: user.name,
      recentBookings,
      queueBookings,
      applications: userApplications,
      stats: {
        total: Number(statsResult?.total) || 0,
        pending: Number(statsResult?.pending) || 0,
        completed: Number(statsResult?.completed) || 0,
        confirmed: Number(statsResult?.confirmed) || 0,
        documentsUploaded: docCount?.count || 0,
      }
    });

  } catch (error: any) {
    console.error('Dashboard API Error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/dashboard/bookings
app.get('/bookings', async (c) => {
  try {
    const user = c.get('user');
    
    const userRole = user.role;
    const isStudent = userRole === 'student';
    const bookingFilter = isStudent ? eq(bookings.studentUserId, user.id) : undefined;
    
    const [statsResult] = await db(c.env.DB)
      .select({
        total: sql<number>`count(*)`,
        pending: sql<number>`count(*) filter (where ${bookings.status} = 'pending')`,
        completed: sql<number>`count(*) filter (where ${bookings.status} = 'completed')`,
        confirmed: sql<number>`count(*) filter (where ${bookings.status} = 'confirmed')`,
      })
      .from(bookings)
      .where(bookingFilter);
      
    const allBookings = await db(c.env.DB).select().from(bookings)
      .where(bookingFilter)
      .orderBy(desc(bookings.createdAt));
      
    return c.json({
        bookings: allBookings,
        stats: {
            total: Number(statsResult?.total) || 0,
            pending: Number(statsResult?.pending) || 0,
            completed: Number(statsResult?.completed) || 0,
            confirmed: Number(statsResult?.confirmed) || 0,
        }
    });
  } catch(e: any) {
      console.log(e);
      return c.json({ error: "error fetching bookings" }, 500);
  }
});

// GET /api/dashboard/bookings/:id
app.get('/bookings/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid booking ID' }, 400);
    }
    
    const [booking] = await db(c.env.DB).select().from(bookings).where(eq(bookings.id, id));
    
    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404);
    }
    
    // Check access - admin/agent can view all, student only own
    const userRole = user.role;
    const isAdmin = userRole === 'admin' || userRole === 'agent';
    
    if (!isAdmin && booking.studentUserId !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    // Get booking events
    const events = await db(c.env.DB).select().from(bookingEvents).where(eq(bookingEvents.bookingId, id)).orderBy(desc(bookingEvents.createdAt));
    
    return c.json({ booking, events });
  } catch (e: any) {
    console.error(e);
    return c.json({ error: 'Failed to fetch booking' }, 500);
  }
});

// PUT /api/dashboard/bookings/:id
app.put('/bookings/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'));
    const { status } = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid booking ID' }, 400);
    }
    
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return c.json({ error: 'Invalid status' }, 400);
    }
    
    const [booking] = await db(c.env.DB).select().from(bookings).where(eq(bookings.id, id));
    
    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404);
    }
    
    // Check access
    const userRole = user.role;
    const isAdmin = userRole === 'admin' || userRole === 'agent';
    
    if (!isAdmin && booking.studentUserId !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    // Update booking
    await db(c.env.DB).update(bookings).set({ status, updatedAt: new Date() }).where(eq(bookings.id, id));
    
    // Insert event
    await db(c.env.DB).insert(bookingEvents).values({
      bookingId: id,
      eventType: 'status_change',
      toStatus: status,
    });
    
    const [updatedBooking] = await db(c.env.DB).select().from(bookings).where(eq(bookings.id, id));
    const events = await db(c.env.DB).select().from(bookingEvents).where(eq(bookingEvents.bookingId, id)).orderBy(desc(bookingEvents.createdAt));
    
    return c.json({ success: true, booking: updatedBooking, events });
  } catch (e: any) {
    console.error(e);
    return c.json({ error: 'Failed to update booking' }, 500);
  }
});

// GET /api/dashboard/leads
app.get('/leads', async (c) => {
  try {
    const user = c.get('user');
    const userRole = user.role;
    
    if (userRole !== 'admin' && userRole !== 'agent') {
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    const allLeads = await db(c.env.DB).select().from(leads).orderBy(desc(leads.createdAt));
    
    return c.json({ leads: allLeads });
  } catch (e: any) {
    console.error(e);
    return c.json({ error: 'Failed to fetch leads' }, 500);
  }
});

// GET /api/dashboard/documents
app.get('/documents', async (c) => {
  try {
    const user = c.get('user');
    const userRole = user.role;
    const isStudent = userRole === 'student';
    
    if (isStudent) {
      // Student sees their own documents
      const studentDocs = await db(c.env.DB).select().from(documents).where(eq(documents.userId, user.id));
      return c.json({ documents: studentDocs });
    } else {
      // Admin/agent sees all documents with user info
      const allDocs = await db(c.env.DB)
        .select({
          id: documents.id,
          studentId: documents.userId,
          studentName: users.name,
          type: documents.type,
          fileName: documents.name,
          fileUrl: documents.url,
          status: documents.status,
          reviewedAt: documents.reviewedAt,
          reviewedBy: documents.reviewedByUserId,
          createdAt: documents.createdAt,
        })
        .from(documents)
        .leftJoin(users, eq(documents.userId, users.id))
        .orderBy(desc(documents.createdAt));
      
      return c.json({ documents: allDocs });
    }
  } catch (e: any) {
    console.error(e);
    return c.json({ error: 'Failed to fetch documents' }, 500);
  }
});

export default app;
