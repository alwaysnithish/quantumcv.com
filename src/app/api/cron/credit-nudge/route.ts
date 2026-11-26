import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull, lte, gte, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { sendCreditNudgeEmail } from '@/lib/lifecycle-emails';

export const maxDuration = 60;

/**
 * Daily cron (vercel.json). Nudges users who signed up 48h–7d ago and have
 * never spent a credit on AI. Protected by CRON_SECRET (Vercel sends it as a
 * Bearer token automatically). nudgeSentAt guarantees one nudge per user.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const now = Date.now();
  const older = new Date(now - 48 * 3600e3).toISOString();
  const newer = new Date(now - 7 * 24 * 3600e3).toISOString();

  const candidates = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.isActive, true),
        eq(users.emailOptOut, false),
        isNull(users.nudgeSentAt),
        lte(users.dateJoined, older),
        gte(users.dateJoined, newer),
        gte(users.credits, 5),
        sql`NOT EXISTS (SELECT 1 FROM credit_transactions t WHERE t.user_id = ${users.id} AND t.type IN ('generate','chat_edit','enhance_bullet'))`
      )
    )
    .limit(200);

  let sent = 0;
  for (const u of candidates) {
    // Claim first so an overlapping run can't double-send.
    const claimed = await db
      .update(users)
      .set({ nudgeSentAt: new Date().toISOString() })
      .where(and(eq(users.id, u.id), isNull(users.nudgeSentAt)))
      .returning({ id: users.id });
    if (!claimed.length) continue;
    const ok = await sendCreditNudgeEmail({ id: u.id, email: u.email, fullName: u.fullName, credits: u.credits }).catch(() => false);
    if (ok) sent++;
  }
  return NextResponse.json({ ok: true, candidates: candidates.length, sent });
}
