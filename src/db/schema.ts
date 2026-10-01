/**
 * src/db/schema.ts
 *
 * Drizzle schema — Postgres (Neon), converted from the original SQLite
 * dev schema. Structurally identical: same tables, same columns, same
 * relationships. Timestamps use { mode: 'string' } so they still behave
 * as ISO strings everywhere in the app (otp.ts, resumes.ts, etc. already
 * work with string comparisons/new Date().toISOString()) — no application
 * code needed to change because of this migration.
 */
import { pgTable, text, integer, boolean, timestamp, serial } from 'drizzle-orm/pg-core';

// ── users ──────────────────────────────────────────────
// Mirrors accounts/models.py::User (email-based auth, no password,
// Google OAuth support, OTP sign-in).
export const users = pgTable('users', {
  id: text('id').primaryKey(), // uuid, generated in app code via crypto.randomUUID()
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull().default(''),

  googleId: text('google_id').unique(),
  avatarUrl: text('avatar_url').notNull().default(''),

  isActive: boolean('is_active').notNull().default(true),
  isStaff: boolean('is_staff').notNull().default(false),

  // Credit balance for AI actions (resume generation = 5 credits, chat
  // edit / bullet enhance = 1 credit each). New users get 10 free credits
  // (enough for one generation plus a few edits) so they can try the
  // product before buying a credit pack.
  credits: integer('credits').notNull().default(10),

  // Set to true the first time the user buys any credit pack — unlocks
  // all 30 resume templates permanently (free accounts get 7 basic ones).
  premiumUnlocked: boolean('premium_unlocked').notNull().default(false),

  dateJoined: timestamp('date_joined', { mode: 'string', withTimezone: true }).notNull().defaultNow(),
  lastLogin: timestamp('last_login', { mode: 'string', withTimezone: true }),
});

// ── otp_sessions ───────────────────────────────────────
// Mirrors accounts/models.py::OTPSession
export const otpSessions = pgTable('otp_sessions', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  code: text('code').notNull(),
  fullName: text('full_name').notNull().default(''),
  createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { mode: 'string', withTimezone: true }).notNull(),
  used: boolean('used').notNull().default(false),
});

// ── resumes ────────────────────────────────────────────
// Mirrors resume/models.py::Resume
export const resumes = pgTable('resumes', {
  id: text('id').primaryKey(), // uuid
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  title: text('title').notNull().default('Untitled Resume'),
  targetRole: text('target_role').notNull().default(''),
  targetCompany: text('target_company').notNull().default(''),
  country: text('country').notNull().default('India'),

  rawData: text('raw_data').notNull().default(''),
  jobDescription: text('job_description').notNull().default(''),

  // Stored as JSON string; parsed/serialized at the app layer (unchanged
  // from the SQLite version — kept as text rather than native jsonb so
  // no application code needs to change for this migration).
  generatedData: text('generated_data'),

  status: text('status', { enum: ['draft', 'generated', 'exported'] })
    .notNull()
    .default('draft'),

  createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true }).notNull().defaultNow(),
  lastExported: timestamp('last_exported', { mode: 'string', withTimezone: true }),

  atsScore: integer('ats_score'),
  aiConfidenceScore: integer('ai_confidence_score'),
});

// ── resume_versions ────────────────────────────────────
// Mirrors resume/models.py::ResumeVersion
export const resumeVersions = pgTable('resume_versions', {
  id: serial('id').primaryKey(),
  resumeId: text('resume_id')
    .notNull()
    .references(() => resumes.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull().default(1),
  snapshotData: text('snapshot_data').notNull(), // JSON string
  label: text('label').notNull().default(''),
  createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).notNull().defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type OTPSessionRow = typeof otpSessions.$inferSelect;
export type ResumeRow = typeof resumes.$inferSelect;
export type ResumeVersionRow = typeof resumeVersions.$inferSelect;

// ── credit_transactions ────────────────────────────────
// Ledger of every credit change — purchases (via Razorpay) and
// consumption (AI generate/chat/enhance actions). Purchases record the
// Razorpay order/payment IDs so a webhook retry can't double-credit the
// same payment (checked via razorpayPaymentId uniqueness before crediting).
export const creditTransactions = pgTable('credit_transactions', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: ['purchase', 'generate', 'chat_edit', 'enhance_bullet', 'bonus'],
  }).notNull(),
  amount: integer('amount').notNull(), // positive = credit added, negative = credit spent
  // Only populated for type='purchase' — the real money paid, for admin revenue reporting.
  currency: text('currency', { enum: ['INR', 'USD'] }),
  amountPaid: integer('amount_paid'), // smallest currency unit (paise/cents), matches Razorpay's convention
  razorpayOrderId: text('razorpay_order_id'),
  razorpayPaymentId: text('razorpay_payment_id').unique(),
  status: text('status', { enum: ['pending', 'completed', 'failed'] })
    .notNull()
    .default('completed'),
  createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).notNull().defaultNow(),
});

export type CreditTransactionRow = typeof creditTransactions.$inferSelect;

// ── support_threads / support_messages ─────────────────
// One ongoing support conversation per user (created lazily on first
// message). Admin replies show as "Team QuantumCV" in the UI and trigger
// an email to the user; user messages trigger an email to the site's
// support inbox so nothing requires the admin to be actively watching
// the dashboard to notice a new message.
export const supportThreads = pgTable('support_threads', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  subject: text('subject').notNull().default('Support request'),
  status: text('status', { enum: ['open', 'closed'] }).notNull().default('open'),
  unreadByAdmin: boolean('unread_by_admin').notNull().default(true),
  unreadByUser: boolean('unread_by_user').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).notNull().defaultNow(),
  lastMessageAt: timestamp('last_message_at', { mode: 'string', withTimezone: true }).notNull().defaultNow(),
});

export const supportMessages = pgTable('support_messages', {
  id: serial('id').primaryKey(),
  threadId: integer('thread_id')
    .notNull()
    .references(() => supportThreads.id, { onDelete: 'cascade' }),
  sender: text('sender', { enum: ['user', 'admin'] }).notNull(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).notNull().defaultNow(),
});

export type SupportThreadRow = typeof supportThreads.$inferSelect;
export type SupportMessageRow = typeof supportMessages.$inferSelect;
