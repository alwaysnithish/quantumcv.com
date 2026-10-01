# QuantumCV — Next.js Rewrite

This is the Next.js rewrite of the QuantumCV Django app, replacing Django
entirely (not just the frontend). Built incrementally — this is **Month 1:
Foundation**.

## What's ported and working (verified with real requests, not just written)

- **Auth**: Passwordless email OTP (rate-limited 3/15min, 10min expiry,
  console-logged in dev when SMTP isn't configured) + Google OAuth ID token
  verification. Sessions are signed JWT cookies (`jose`), not Django sessions.
- **Database**: Drizzle ORM + Neon (serverless Postgres) — see "Database" section below for setup.
  Schema mirrors `accounts/models.py` and `resume/models.py` 1:1: `users`,
  `otp_sessions`, `resumes`, `resume_versions`.
- **Resume CRUD**: create, list w/ dashboard stats, get, save (auto-versions
  before overwrite, same as the Django version), delete.
- **Gemini AI engine**: full port of `ai_engine/gemini.py` — career-stage
  detection, country-specific formatting rules (India/US/UK/UAE/Canada/
  Germany/Australia/Singapore), resume generation, chat-based editing,
  bullet enhancement, resume analysis, cover letter generation. Same prompts.
- **PDF export**: HTML/CSS template ported from `pdf_engine/generator.py`
  exactly, rendered via Puppeteer instead of xhtml2pdf (strictly better CSS
  support). Works locally out of the box; serverless deploy uses
  `puppeteer-core` + `@sparticuz/chromium` (already wired in `src/lib/pdf.ts`).
- **Version history + restore**: matches `resume/views.py` behavior.
- **Pages**: login (OTP flow), dashboard (list/stats/create/delete), builder
  (career data input -> AI generate -> live preview -> chat editor -> save/export).

## What's simplified for now (flagged honestly, not hidden)

- The builder UI is functional but not a pixel-for-pixel port of the
  506-line `builder.html` template (no drag-and-drop section reordering yet,
  simpler preview styling). Core flow -- generate, edit via chat, save,
  export -- all works.
- No Product Hunt / social sharing, no mock interviews, no job matching yet --
  matches the priority order we already agreed on (ATS/job-match first).

## Setup

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL (Neon) + GEMINI_API_KEY at minimum
npm run db:generate          # only needed if you change schema.ts
npm run db:migrate           # creates the tables in your Neon project
npm run dev
```

Required for basic auth+AI flow to work: `SESSION_SECRET` (any long random
string) and `GEMINI_API_KEY`. Everything else (SMTP, Google OAuth) degrades
gracefully in dev -- OTP codes print to the console if SMTP isn't set.

## Email delivery — SMTP (your own account)

OTP emails send via SMTP using nodemailer, through your own email account
(e.g. Gmail) — no third-party email API. The SMTP host is resolved to an
explicit IPv4 address before connecting, which avoids the `ENETUNREACH`
errors seen on hosts/networks where DNS returns an IPv6 address with no
working IPv6 route.

**Gmail setup**: use an [App Password](https://myaccount.google.com/apppasswords)
(not your regular password) — this requires 2-Step Verification to be
enabled on the account first.

**Production note**: raw SMTP connections can be blocked entirely by some
serverless hosting platforms' network policies — this is a hosting
limitation, not something fixable in application code. If SMTP works
locally but fails only in production, deploy to a platform that runs a
persistent Node process (Railway, Render, a plain VPS) rather than
ephemeral serverless functions, where SMTP behaves like it does on a
normal server.

## Database — Neon (serverless Postgres)

The app runs on [Neon](https://neon.tech), not SQLite — this matches how
it'll actually run in production and avoids the "works locally, breaks on
Vercel" class of bugs serverless SQLite setups run into.

Setup:
1. Sign up free at https://neon.tech (no card required for the free tier)
2. Create a project -- Neon gives you a connection string immediately
3. Put it in `.env.local` as `DATABASE_URL`
4. Run `npm run db:migrate` -- this creates all 4 tables in your Neon project

The app uses `@neondatabase/serverless`'s HTTP driver (`drizzle-orm/neon-http`),
not a traditional connection pool -- each query is a single HTTPS request,
which is what you want for serverless deploys (Vercel, etc.) since a
long-lived TCP pool doesn't survive serverless's many-short-lived-invocations
model well.

Why Neon over Supabase: this app already has its own OTP + Google auth built
in `src/lib/session.ts` / `src/lib/otp.ts`, so Supabase's Auth/Storage/
Realtime features would go unused -- you'd just be using it as a Postgres
host, and Neon is purpose-built for exactly that, with a free tier that
doesn't cold-pause your database the way Supabase's does.

## Admin dashboard

`/admin` — gated by `users.isStaff` (reused the existing column from the
Django port). There's deliberately no self-serve way to become an admin;
non-staff users hitting `/admin` get silently redirected to `/dashboard`
rather than shown a "forbidden" page, so the existence of an admin area
isn't advertised.

**To make your own account an admin**, run this once against your Neon
database (Neon dashboard → your project → SQL Editor):
```sql
UPDATE users SET is_staff = true WHERE email = 'you@example.com';
```

What's in there:
- **Overview** — total/premium/free user counts, credits issued, revenue by
  currency, open support ticket count, resumes created
- **Users** — every user, credit balance, premium status, lifetime credits
  purchased, order count, delete (cascades to their resumes/transactions/
  support history)
- **Transactions** — every credit event across all users (purchases with
  Razorpay order/payment IDs, and consumption from generate/chat/enhance),
  newest first
- **Support** — inbox-style view of every user's support thread; replying
  sends as "Team QuantumCV," emails the user, and shows up in their
  in-app support widget

**Support flow, end to end**: user clicks the chat bubble on their dashboard
→ message saved + emailed to `SUPPORT_INBOX_EMAIL` (defaults to
`support@quantumcv.app`) → you see it in `/admin` → Support tab (unread
badge) → reply → user gets it both by email and in their widget (the widget
polls every 20s while open).

## Credits, billing, and template tiers

- `/billing` — full transaction ledger (purchases, generations, chat edits,
  bullet enhances, welcome bonus), plus current balance and premium status.
- Only 7 templates are free (Classic Clean, Minimal Line, Compact Pro,
  Classic Centered, Split Header, Executive, Minimalist) — the other 23
  require having bought any credit pack at least once (`users.premiumUnlocked`,
  set permanently true on first purchase). Enforced both in the builder UI
  (lock icons + upsell modal) and server-side at PDF export time (falls back
  to a free template rather than trusting the client).
- Run `npm run db:migrate` again after pulling this update — it adds the
  `users.premium_unlocked` column and the `credit_transactions` ledger table.

## Roadmap (month-by-month, as agreed)

- **Month 1 (this drop)**: Foundation -- auth, DB, resume CRUD, AI generation,
  chat editing, PDF export, version history.
- **Month 2**: Job Matching + ATS Simulation module (your stated MVP
  priority) -- recruiter/HR/technical review simulation, missing keywords,
  interview probability.
- **Month 3**: Application Tracker + polish builder UI (drag-reorder,
  richer preview, template variety).
- Later: Career Memory (structured profile feeding all modules), AI Career
  Assistant chat, skill gap analysis, learning roadmap.

Deliberately deferred (per our earlier discussion): the professional social
network, voice mock interviews, resume git-style version UI beyond what's
built, custom domains -- these come after the core product has real users.
