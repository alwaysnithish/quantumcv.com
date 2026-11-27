import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { requireAdmin } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
const csv = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/** GET /api/admin/analytics/export?range=30d → raw page views as CSV (for your own research). */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const days = DAYS[request.nextUrl.searchParams.get('range') ?? '30d'] ?? 30;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const r: any = await db.execute(sql`SELECT ts, vid, sid, path, title, ref_source, ref_host, utm_source, utm_medium, utm_campaign,
      country, region, city, ip_masked, device, browser, os, screen_w, lang, is_entry, duration_s, max_scroll
    FROM analytics_pageviews WHERE ts >= ${since}::timestamptz ORDER BY ts DESC LIMIT 100000`);
  const rows: any[] = r?.rows ?? r ?? [];
  const cols = ['ts', 'vid', 'sid', 'path', 'title', 'ref_source', 'ref_host', 'utm_source', 'utm_medium', 'utm_campaign', 'country', 'region', 'city', 'ip_masked', 'device', 'browser', 'os', 'screen_w', 'lang', 'is_entry', 'duration_s', 'max_scroll'];
  const body = [cols.join(','), ...rows.map((row) => cols.map((c) => csv(row[c])).join(','))].join('\n');
  return new NextResponse(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="quantumcv-pageviews-${days}d.csv"` } });
}
