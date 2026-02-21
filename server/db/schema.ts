import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').default('student'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const studentProfiles = sqliteTable('student_profiles', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  preferredProgram: text('preferred_program'),
  budgetRange: text('budget_range'),
  countryInterest: text('country_interest'),
  phone: text('phone'),
  address: text('address'),
  profileCompletion: integer('profile_completion').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const studentAssignments = sqliteTable('student_assignments', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  studentUserId: integer('student_user_id').references(() => users.id).notNull(),
  agentUserId: integer('agent_user_id').references(() => users.id).notNull(),
  assignedByUserId: integer('assigned_by_user_id').references(() => users.id),
  assignedAt: integer('assigned_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  active: integer('active', { mode: 'boolean' }).default(true),
});

export const bookings = sqliteTable('bookings', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  studentUserId: integer('student_user_id').references(() => users.id),
  leadId: integer('lead_id').references(() => leads.id),
  source: text('source').default('homepage'),
  date: text('date').notNull(),
  timeSlot: text('time_slot').notNull(),
  timezone: text('timezone').default('Asia/Dhaka'),
  status: text('status').default('pending'),
  assignedAgentId: integer('assigned_agent_id').references(() => users.id),
  meetingLink: text('meet_link'),
  studentNote: text('student_note'),
  agentNote: text('agent_note'),
  requestedNewDate: text('requested_new_date'),
  requestedNewTimeSlot: text('requested_new_time_slot'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const bookingEvents = sqliteTable('booking_events', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  bookingId: integer('booking_id').references(() => bookings.id).notNull(),
  actorUserId: integer('actor_user_id').references(() => users.id),
  eventType: text('event_type').notNull(),
  fromStatus: text('from_status'),
  toStatus: text('to_status'),
  payloadJson: text('payload_json', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const applications = sqliteTable('applications', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  university: text('university').notNull(),
  course: text('course').notNull(),
  status: text('status').notNull(),
  date: text('date').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const documents = sqliteTable('documents', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  name: text('name').notNull(),
  url: text('url').notNull(),
  type: text('type'),
  mimeType: text('mime_type'),
  size: integer('size'),
  status: text('status').default('Pending'),
  reviewedByUserId: integer('reviewed_by_user_id').references(() => users.id),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  reviewNote: text('review_note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const messages = sqliteTable('messages', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  fromUserId: integer('from_user_id').references(() => users.id),
  toUserId: integer('to_user_id').references(() => users.id),
  subject: text('subject').notNull(),
  content: text('content').notNull(),
  channel: text('channel').default('in_app'),
  bookingId: integer('booking_id').references(() => bookings.id),
  applicationId: integer('application_id').references(() => applications.id),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const leads = sqliteTable('leads', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  program: text('program').notNull(),
  budget: text('budget').notNull(),
  countryInterest: text('country_interest'),
  message: text('message'),
  source: text('source').default('website'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const siteSettings = sqliteTable('site_settings', {
  id: integer('id').primaryKey(),
  companyName: text('company_name').notNull(),
  companyEmail: text('company_email').notNull(),
  companyPhone: text('company_phone').notNull(),
  companyAddress: text('company_address'),
  companyLogo: text('company_logo'),
  companyFavicon: text('company_favicon'),
  primaryColor: text('primary_color'),
  whatsappNumber: text('whatsapp_number').notNull(),
  facebookUrl: text('facebook_url').notNull(),
  heroHeadline: text('hero_headline').notNull(),
  heroSubheadline: text('hero_subheadline').notNull(),
  ceoProfile: text('ceo_profile', { mode: 'json' }),
  metrics: text('metrics', { mode: 'json' }),
  countries: text('countries', { mode: 'json' }),
  defaultMeetLink: text('default_meet_link'),
  universityLogos: text('university_logos', { mode: 'json' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  expiresAt: integer('expires_at').notNull(),
});
