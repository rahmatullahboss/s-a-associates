import { Hono } from 'hono';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { bookings, documents, users, applications, bookingEvents, leads, studentProfiles, siteSettings } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { sendBookingConfirmedEmail, sendBookingCancelledEmail } from '../lib/email.js';

type Bindings = {
  DB: D1Database;
  RESEND_API_KEY?: string;
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

  } catch (error: unknown) {
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
  } catch(e: unknown) {
      console.error(e);
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
  } catch (e: unknown) {
    console.error(e);
    return c.json({ error: 'Failed to fetch booking' }, 500);
  }
});

// PUT /api/dashboard/bookings/:id
app.put('/bookings/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'));
    const { status, meetLink, agentNote } = await c.req.json();
    
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
    
    // Get site settings for defaultMeetLink and companyName
    const [settings] = await db(c.env.DB).select({
      defaultMeetLink: siteSettings.defaultMeetLink,
      companyName: siteSettings.companyName,
    }).from(siteSettings).where(eq(siteSettings.id, 1));
    const companyName = settings?.companyName || 'Tawakkul Education';

    // Auto-fill meetLink from defaultMeetLink if admin left it blank and we're confirming
    const resolvedMeetLink =
      meetLink !== undefined && meetLink !== ''
        ? meetLink
        : (status === 'confirmed' ? (booking.meetingLink || settings?.defaultMeetLink || '') : (meetLink ?? ''));

    // Update booking
    const updateData: Record<string, string | Date> = { status, updatedAt: new Date() };
    if (resolvedMeetLink !== undefined) updateData.meetingLink = resolvedMeetLink;
    if (agentNote !== undefined) updateData.agentNote = agentNote;
    await db(c.env.DB).update(bookings).set(updateData).where(eq(bookings.id, id));
    
    // Insert event
    await db(c.env.DB).insert(bookingEvents).values({
      bookingId: id,
      eventType: 'status_change',
      toStatus: status,
    });
    
    const [updatedBooking] = await db(c.env.DB).select().from(bookings).where(eq(bookings.id, id));
    const events = await db(c.env.DB).select().from(bookingEvents).where(eq(bookingEvents.bookingId, id)).orderBy(desc(bookingEvents.createdAt));

    // Send email notifications (non-blocking)
    if (status === 'confirmed') {
      sendBookingConfirmedEmail(
        { RESEND_API_KEY: c.env.RESEND_API_KEY, companyName },
        {
          toEmail: booking.email,
          toName: booking.name,
          date: booking.date,
          timeSlot: booking.timeSlot,
          bookingId: booking.id,
          meetLink: resolvedMeetLink || '',
          agentNote: agentNote ?? booking.agentNote ?? undefined,
          companyName,
        }
      ).catch(err => console.error('[Email] confirmed email failed:', err));
    } else if (status === 'cancelled') {
      sendBookingCancelledEmail(
        { RESEND_API_KEY: c.env.RESEND_API_KEY, companyName },
        {
          toEmail: booking.email,
          toName: booking.name,
          date: booking.date,
          timeSlot: booking.timeSlot,
          bookingId: booking.id,
          companyName,
        }
      ).catch(err => console.error('[Email] cancelled email failed:', err));
    }

    return c.json({ success: true, booking: updatedBooking, events });
  } catch (e: unknown) {
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
  } catch (e: unknown) {
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
  } catch (e: unknown) {
    console.error(e);
    return c.json({ error: 'Failed to fetch documents' }, 500);
  }
});

// PUT /api/dashboard/documents/:id
app.put('/documents/:id', async (c) => {
  try {
    const user = c.get('user');
    if (user.role !== 'admin' && user.role !== 'agent') {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const docId = parseInt(c.req.param('id'));
    if (isNaN(docId)) return c.json({ error: 'Invalid ID' }, 400);

    const { status, reviewNote } = await c.req.json() as { status: string; reviewNote?: string };

    const validStatuses = ['Pending', 'Verified', 'Rejected'];
    if (!validStatuses.includes(status)) return c.json({ error: 'Invalid status' }, 400);

    await db(c.env.DB).update(documents).set({
      status,
      reviewNote: reviewNote || null,
      reviewedByUserId: user.id,
      reviewedAt: new Date(),
    }).where(eq(documents.id, docId));

    const [updated] = await db(c.env.DB).select().from(documents).where(eq(documents.id, docId));
    return c.json({ success: true, document: updated });
  } catch (e: unknown) {
    console.error(e);
    return c.json({ error: 'Failed to update document' }, 500);
  }
});

// GET /api/dashboard/students
app.get('/students', async (c) => {
  try {
    const user = c.get('user');
    if (user.role !== 'admin' && user.role !== 'agent') {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const allStudents = await db(c.env.DB)
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        phone: studentProfiles.phone,
        preferredProgram: studentProfiles.preferredProgram,
        countryInterest: studentProfiles.countryInterest,
        profileCompletion: studentProfiles.profileCompletion,
      })
      .from(users)
      .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
      .where(eq(users.role, 'student'))
      .orderBy(desc(users.createdAt));

    return c.json({ students: allStudents });
  } catch (e: unknown) {
    console.error(e);
    return c.json({ error: 'Failed to fetch students' }, 500);
  }
});

// GET /api/dashboard/students/:id
app.get('/students/:id', async (c) => {
  try {
    const user = c.get('user');
    if (user.role !== 'admin' && user.role !== 'agent') {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const studentId = parseInt(c.req.param('id'));
    if (isNaN(studentId)) return c.json({ error: 'Invalid ID' }, 400);

    const [student] = await db(c.env.DB)
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        phone: studentProfiles.phone,
        preferredProgram: studentProfiles.preferredProgram,
        countryInterest: studentProfiles.countryInterest,
        budgetRange: studentProfiles.budgetRange,
        address: studentProfiles.address,
        profileCompletion: studentProfiles.profileCompletion,
      })
      .from(users)
      .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
      .where(eq(users.id, studentId));

    if (!student) return c.json({ error: 'Student not found' }, 404);

    // Get student's bookings
    const studentBookings = await db(c.env.DB)
      .select()
      .from(bookings)
      .where(eq(bookings.studentUserId, studentId))
      .orderBy(desc(bookings.createdAt));

    // Get student's documents
    const studentDocs = await db(c.env.DB)
      .select()
      .from(documents)
      .where(eq(documents.userId, studentId))
      .orderBy(desc(documents.createdAt));

    // Get student's applications
    const studentApps = await db(c.env.DB)
      .select()
      .from(applications)
      .where(eq(applications.userId, studentId))
      .orderBy(desc(applications.createdAt));

    return c.json({ student, bookings: studentBookings, documents: studentDocs, applications: studentApps });
  } catch (e: unknown) {
    console.error(e);
    return c.json({ error: 'Failed to fetch student' }, 500);
  }
});

// DELETE /api/dashboard/students/:id
app.delete('/students/:id', async (c) => {
  try {
    const user = c.get('user');
    if (user.role !== 'admin') {
      return c.json({ error: 'Only admins can delete students' }, 403);
    }

    const studentId = parseInt(c.req.param('id'));
    if (isNaN(studentId)) return c.json({ error: 'Invalid ID' }, 400);

    // Don't allow deleting self
    if (studentId === user.id) {
      return c.json({ error: 'Cannot delete your own account' }, 400);
    }

    // Delete related records first
    await db(c.env.DB).delete(bookingEvents).where(
      sql` EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_events.booking_id AND bookings.student_user_id = ${studentId})`
    ).catch(() => {});
    
    await db(c.env.DB).delete(documents).where(eq(documents.userId, studentId));
    await db(c.env.DB).delete(bookings).where(eq(bookings.studentUserId, studentId));
    await db(c.env.DB).delete(studentProfiles).where(eq(studentProfiles.userId, studentId));
    await db(c.env.DB).delete(users).where(eq(users.id, studentId));

    return c.json({ success: true });
  } catch (e: unknown) {
    console.error(e);
    return c.json({ error: 'Failed to delete student' }, 500);
  }
});

export default app;
