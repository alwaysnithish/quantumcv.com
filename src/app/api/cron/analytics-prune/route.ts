import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

export const maxDuration = 60;

/** Weekly: raw analytics older than 400 days are deleted (data minimisation). */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  const cutoff = new Date(Date.now() - 400 * 86400000).toISOString();
  await db.execute(sql`DELETE FROM analytics_pageviews WHERE ts < ${cutoff}::timestamptz`);
  await db.execute(sql`DELETE FROM analytics_events WHERE ts < ${cutoff}::timestamptz`);
  await db.execute(sql`DELETE FROM rate_limits WHERE window_start < now() - interval '2 days'`);
  return NextResponse.json({ ok: true });
}
