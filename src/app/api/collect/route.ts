import { NextRequest, NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { analyticsPageviews, analyticsEvents } from '@/db/schema';
import { getCurrentUserId } from '@/lib/session';
import { getUserById } from '@/lib/users';
import { isBot, parseUA, classifySource, geoFromHeaders, getIp, maskIp, hashIp, clip } from '@/lib/analytics/parse';

export const maxDuration = 10;

const ID = /^[a-z0-9-]{8,40}$/i;
const done = () => new NextResponse(null, { status: 204 });

/**
 * POST /api/collect — public beacon endpoint for the first-party tracker.
 *
 * Admin traffic is NEVER recorded: when a pageview arrives with a session of
 * a staff user we drop it (and its later pings/clicks no-op, because the
 * pageview row doesn't exist). Bots are filtered by user-agent.
 */
export async function POST(request: NextRequest) {
  // same-origin only (sendBeacon sends Origin); blocks drive-by spam from other sites
  const origin = request.headers.get('origin');
  if (origin) { try { if (new URL(origin).host !== request.headers.get('host')) return done(); } catch { return done(); } }

  const ua = request.headers.get('user-agent') ?? '';
  if (isBot(ua)) return done();

  let b: any;
  try { b = JSON.parse(await request.text()); } catch { return done(); }
  if (!b || typeof b !== 'object' || !ID.test(b.vid ?? '') || !ID.test(b.sid ?? '') || !ID.test(b.pvid ?? '')) return done();
  const t = b.t;

  try {
    if (t === 'pv') {
      const path = clip(b.path, 300);
      if (!path.startsWith('/') || path.startsWith('/admin') || path.startsWith('/api')) return done();

      // admin exclusion (server-side, authoritative)
      const uid = await getCurrentUserId();
      if (uid) { const u = await getUserById(uid); if (u?.isStaff) return done(); }

      const host = (request.headers.get('host') ?? '').toLowerCase();
      const src = classifySource(clip(b.ref, 500), host, clip(b.um, 60), clip(b.us, 60));
      const geo = geoFromHeaders(request.headers);
      const ip = getIp(request.headers);
      const agent = parseUA(ua);
      await db.insert(analyticsPageviews).values({
        pvid: b.pvid, vid: b.vid, sid: b.sid, userId: uid, path,
        title: clip(b.title, 160), referrer: clip(b.ref, 500), refHost: src.host, refSource: src.source,
        utmSource: clip(b.us, 60), utmMedium: clip(b.um, 60), utmCampaign: clip(b.uc, 80),
        country: geo.country, region: geo.region, city: geo.city, ipMasked: maskIp(ip), ipHash: hashIp(ip),
        device: agent.device, browser: agent.browser, os: agent.os,
        screenW: Math.min(10000, Math.max(0, Number(b.sw) || 0)), lang: clip(b.lang, 12), isEntry: !!b.entry,
      }).onConflictDoNothing();
      return done();
    }

    if (t === 'ping') {
      const dur = Math.min(4 * 3600, Math.max(0, Math.floor(Number(b.dur) || 0)));
      const scroll = Math.min(100, Math.max(0, Math.floor(Number(b.scroll) || 0)));
      await db.update(analyticsPageviews)
        .set({ durationS: sql`GREATEST(${analyticsPageviews.durationS}, ${dur})`, maxScroll: sql`GREATEST(${analyticsPageviews.maxScroll}, ${scroll})`, lastSeen: sql`now()` })
        .where(and(eq(analyticsPageviews.pvid, b.pvid), eq(analyticsPageviews.vid, b.vid)));
      return done();
    }

    if (t === 'click') {
      // only if the (non-admin) pageview exists
      const [pv] = await db.select({ country: analyticsPageviews.country }).from(analyticsPageviews).where(and(eq(analyticsPageviews.pvid, b.pvid), eq(analyticsPageviews.vid, b.vid))).limit(1);
      if (!pv) return done();
      await db.insert(analyticsEvents).values({
        vid: b.vid, sid: b.sid, pvid: b.pvid, type: 'click', path: clip(b.path, 300),
        label: clip(b.label, 80), href: clip(b.href, 300), outbound: !!b.out, country: pv.country,
      });
      return done();
    }
  } catch (err) {
    console.error('collect error:', err);
  }
  return done();
}
