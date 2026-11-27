import { NextRequest, NextResponse } from 'next/server';
import { sql, type SQL } from 'drizzle-orm';
import { db } from '@/db/client';
import { requireAdmin } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DAY = 86400000;
const RANGES: Record<string, { back: number; len: number; label: string }> = {
  today: { back: 0, len: 1, label: 'Today' },
  yesterday: { back: 1, len: 1, label: 'Yesterday' },
  '7d': { back: 6, len: 7, label: 'Last 7 days' },
  '30d': { back: 29, len: 30, label: 'Last 30 days' },
  '90d': { back: 89, len: 90, label: 'Last 90 days' },
};

const rowsOf = (r: any): any[] => r?.rows ?? r ?? [];
const run = async (q: SQL) => rowsOf(await db.execute(q));

function validTz(tz: string | null) {
  const t = tz || 'Asia/Kolkata';
  try { new Intl.DateTimeFormat('en', { timeZone: t }); return t; } catch { return 'Asia/Kolkata'; }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  // lightweight poll used by the dashboard's live panel (every 15s)
  if (request.nextUrl.searchParams.get('live')) {
    const [live, liveCount, feed] = await Promise.all([
      run(sql`SELECT path, country, city, device, browser, ip_masked, ref_source, duration_s, ts
        FROM analytics_pageviews WHERE last_seen > now() - interval '75 seconds' ORDER BY last_seen DESC LIMIT 30`),
      run(sql`SELECT count(DISTINCT vid) FILTER (WHERE last_seen > now() - interval '75 seconds')::int AS now_users,
          count(DISTINCT vid) FILTER (WHERE last_seen > now() - interval '30 minutes')::int AS last30
        FROM analytics_pageviews WHERE last_seen > now() - interval '30 minutes'`),
      run(sql`(SELECT ts, 'view' AS kind, path AS detail, country FROM analytics_pageviews ORDER BY ts DESC LIMIT 15)
        UNION ALL (SELECT ts, type AS kind, COALESCE(NULLIF(label, ''), path) AS detail, country FROM analytics_events ORDER BY ts DESC LIMIT 15)
        ORDER BY ts DESC LIMIT 30`),
    ]);
    return NextResponse.json({ success: true, live, liveCount: liveCount[0] ?? { now_users: 0, last30: 0 }, feed });
  }

  const rangeKey = request.nextUrl.searchParams.get('range') ?? '7d';
  const range = RANGES[rangeKey] ?? RANGES['7d'];
  const tz = validTz(request.nextUrl.searchParams.get('tz'));

  // start of "today" in the admin's timezone, as an absolute instant
  const [{ t0 }] = await run(sql`SELECT (date_trunc('day', now() AT TIME ZONE ${tz}) AT TIME ZONE ${tz}) AS t0`);
  const today0 = new Date(t0).getTime();
  const start = new Date(today0 - range.back * DAY).toISOString();
  const end = new Date(today0 - range.back * DAY + range.len * DAY).toISOString();
  const pstart = new Date(today0 - range.back * DAY - range.len * DAY).toISOString();
  const yesterday0 = new Date(today0 - DAY).toISOString();
  const d7 = new Date(today0 - 6 * DAY).toISOString();
  const d30 = new Date(today0 - 29 * DAY).toISOString();
  const t0iso = new Date(today0).toISOString();
  const tomorrow0 = new Date(today0 + DAY).toISOString();
  const gran = range.len <= 1 ? 'hour' : 'day';

  const W = (a = start, b = end) => sql`ts >= ${a}::timestamptz AND ts < ${b}::timestamptz`;

  // sessions rolled up from page views inside a window
  const sessCte = (a = start, b = end) => sql`
    v AS (SELECT * FROM analytics_pageviews WHERE ${W(a, b)}),
    sess AS (
      SELECT sid, min(vid) AS vid, min(ts) AS started, count(*)::int AS pvs,
        COALESCE(sum(duration_s), 0)::int AS dur,
        (array_agg(path ORDER BY ts))[1] AS landing,
        (array_agg(path ORDER BY ts DESC))[1] AS exit_path,
        (array_agg(ref_source ORDER BY ts))[1] AS src,
        (array_agg(ref_host ORDER BY ts))[1] AS ref_host,
        (array_agg(country ORDER BY ts))[1] AS country,
        (array_agg(city ORDER BY ts))[1] AS city,
        (array_agg(ip_masked ORDER BY ts))[1] AS ip,
        (array_agg(device ORDER BY ts))[1] AS device,
        (array_agg(browser ORDER BY ts))[1] AS browser,
        (array_agg(path ORDER BY ts))[1:8] AS journey
      FROM v GROUP BY sid
    )`;

  const summarySql = (a: string, b: string) => sql`
    WITH ${sessCte(a, b)}
    SELECT count(*)::int AS sessions,
      count(*) FILTER (WHERE pvs = 1 AND dur < 10)::int AS bounces,
      COALESCE(avg(dur), 0)::float AS avg_dur,
      COALESCE(avg(pvs), 0)::float AS avg_pvs,
      count(DISTINCT vid)::int AS visitors,
      COALESCE(sum(pvs), 0)::int AS views
    FROM sess`;

  const [
    kpiR, summary, prev, series, live, liveCount, pages, landing, exits, sources, hosts, utm, organic,
    countries, cities, tech, visitorsMix, heat, clicks, outbound, funnel, signupSrc, recent, feed,
  ] = await Promise.all([
    run(sql`SELECT
        count(*) FILTER (WHERE ts >= ${t0iso}::timestamptz AND ts < ${tomorrow0}::timestamptz)::int AS today_views,
        count(DISTINCT vid) FILTER (WHERE ts >= ${t0iso}::timestamptz AND ts < ${tomorrow0}::timestamptz)::int AS today_visitors,
        count(*) FILTER (WHERE ts >= ${yesterday0}::timestamptz AND ts < ${t0iso}::timestamptz)::int AS y_views,
        count(DISTINCT vid) FILTER (WHERE ts >= ${yesterday0}::timestamptz AND ts < ${t0iso}::timestamptz)::int AS y_visitors,
        count(*) FILTER (WHERE ts >= ${d7}::timestamptz)::int AS d7_views,
        count(DISTINCT vid) FILTER (WHERE ts >= ${d7}::timestamptz)::int AS d7_visitors,
        count(*)::int AS d30_views,
        count(DISTINCT vid)::int AS d30_visitors
      FROM analytics_pageviews WHERE ts >= ${d30}::timestamptz`),
    run(summarySql(start, end)),
    run(summarySql(pstart, start)),
    run(sql`SELECT to_char(b, 'YYYY-MM-DD"T"HH24:MI') AS b, count(*)::int AS views, count(DISTINCT vid)::int AS visitors
      FROM (SELECT date_trunc(${gran}, ts AT TIME ZONE ${tz}) AS b, vid FROM analytics_pageviews WHERE ${W()}) x
      GROUP BY b ORDER BY b`),
    run(sql`SELECT path, country, city, device, browser, ip_masked, ref_source, duration_s, ts
      FROM analytics_pageviews WHERE last_seen > now() - interval '75 seconds' ORDER BY last_seen DESC LIMIT 30`),
    run(sql`SELECT count(DISTINCT vid) FILTER (WHERE last_seen > now() - interval '75 seconds')::int AS now_users,
        count(DISTINCT vid) FILTER (WHERE last_seen > now() - interval '30 minutes')::int AS last30
      FROM analytics_pageviews WHERE last_seen > now() - interval '30 minutes'`),
    run(sql`WITH ${sessCte()} SELECT path, count(*)::int AS views, count(DISTINCT vid)::int AS visitors,
        COALESCE(avg(NULLIF(duration_s, 0)), 0)::float AS avg_dur, COALESCE(avg(max_scroll), 0)::float AS avg_scroll
      FROM v GROUP BY path ORDER BY views DESC LIMIT 25`),
    run(sql`WITH ${sessCte()} SELECT landing AS path, count(*)::int AS sessions,
        count(*) FILTER (WHERE pvs = 1 AND dur < 10)::int AS bounces, COALESCE(avg(dur), 0)::float AS avg_dur, COALESCE(avg(pvs), 0)::float AS avg_pvs
      FROM sess GROUP BY landing ORDER BY sessions DESC LIMIT 20`),
    run(sql`WITH ${sessCte()} SELECT exit_path AS path, count(*)::int AS exits FROM sess GROUP BY 1 ORDER BY 2 DESC LIMIT 15`),
    run(sql`WITH ${sessCte()} SELECT src, count(*)::int AS sessions, count(DISTINCT vid)::int AS visitors,
        COALESCE(avg(dur), 0)::float AS avg_dur, count(*) FILTER (WHERE pvs = 1 AND dur < 10)::int AS bounces
      FROM sess GROUP BY src ORDER BY sessions DESC`),
    run(sql`WITH ${sessCte()} SELECT ref_host, src, count(*)::int AS sessions FROM sess WHERE ref_host <> '' GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 20`),
    run(sql`WITH ${sessCte()} SELECT utm_source, utm_medium, utm_campaign, count(DISTINCT sid)::int AS sessions, count(DISTINCT vid)::int AS visitors
      FROM v WHERE utm_source <> '' OR utm_campaign <> '' GROUP BY 1, 2, 3 ORDER BY 4 DESC LIMIT 15`),
    run(sql`WITH ${sessCte()} SELECT landing AS path, ref_host AS engine, count(*)::int AS sessions,
        COALESCE(avg(dur), 0)::float AS avg_dur, count(*) FILTER (WHERE pvs = 1 AND dur < 10)::int AS bounces
      FROM sess WHERE src = 'organic' GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 20`),
    run(sql`SELECT country, count(DISTINCT vid)::int AS visitors, count(*)::int AS views, count(DISTINCT sid)::int AS sessions
      FROM analytics_pageviews WHERE ${W()} GROUP BY country ORDER BY visitors DESC, views DESC LIMIT 40`),
    run(sql`SELECT country, region, city, count(DISTINCT vid)::int AS visitors FROM analytics_pageviews
      WHERE ${W()} AND city <> '' GROUP BY 1, 2, 3 ORDER BY 4 DESC LIMIT 20`),
    run(sql`SELECT k, name, n FROM (
        SELECT 'device' AS k, device AS name, count(DISTINCT vid)::int AS n FROM analytics_pageviews WHERE ${W()} GROUP BY device
        UNION ALL SELECT 'browser', browser, count(DISTINCT vid)::int FROM analytics_pageviews WHERE ${W()} GROUP BY browser
        UNION ALL SELECT 'os', os, count(DISTINCT vid)::int FROM analytics_pageviews WHERE ${W()} GROUP BY os
        UNION ALL SELECT 'screen', CASE WHEN screen_w = 0 THEN 'unknown' WHEN screen_w < 480 THEN '< 480px' WHEN screen_w < 768 THEN '480–767px'
          WHEN screen_w < 1024 THEN '768–1023px' WHEN screen_w < 1440 THEN '1024–1439px' ELSE '1440px +' END, count(DISTINCT vid)::int
          FROM analytics_pageviews WHERE ${W()} GROUP BY 2
      ) t ORDER BY k, n DESC`),
    run(sql`WITH vis AS (SELECT DISTINCT vid FROM analytics_pageviews WHERE ${W()})
      SELECT count(*)::int AS total, count(*) FILTER (WHERE seen_before)::int AS returning_v FROM (
        SELECT vid, EXISTS (SELECT 1 FROM analytics_pageviews p WHERE p.vid = vis.vid AND p.ts < ${start}::timestamptz) AS seen_before FROM vis
      ) z`),
    run(sql`SELECT dow, hr, count(*)::int AS n FROM (
        SELECT extract(dow FROM ts AT TIME ZONE ${tz})::int AS dow, extract(hour FROM ts AT TIME ZONE ${tz})::int AS hr
        FROM analytics_pageviews WHERE ${W()}) x GROUP BY 1, 2`),
    run(sql`SELECT label, href, path, outbound, count(*)::int AS n, count(DISTINCT vid)::int AS visitors FROM analytics_events
      WHERE type = 'click' AND ${W()} GROUP BY 1, 2, 3, 4 ORDER BY n DESC LIMIT 40`),
    run(sql`SELECT href, count(*)::int AS n, count(DISTINCT vid)::int AS visitors FROM analytics_events
      WHERE type = 'click' AND outbound AND ${W()} GROUP BY href ORDER BY n DESC LIMIT 15`),
    run(sql`SELECT (SELECT count(DISTINCT vid) FROM analytics_pageviews WHERE ${W()})::int AS visitors,
        (SELECT count(DISTINCT vid) FROM analytics_events WHERE type = 'signup' AND ${W()})::int AS signups,
        (SELECT count(DISTINCT vid) FROM analytics_events WHERE type = 'scan' AND ${W()})::int AS scans`),
    run(sql`SELECT COALESCE(p.ref_source, 'unknown') AS src, count(DISTINCT e.vid)::int AS signups FROM analytics_events e
      LEFT JOIN LATERAL (SELECT ref_source FROM analytics_pageviews WHERE vid = e.vid ORDER BY ts LIMIT 1) p ON true
      WHERE e.type = 'signup' AND e.ts >= ${start}::timestamptz AND e.ts < ${end}::timestamptz GROUP BY 1 ORDER BY 2 DESC`),
    run(sql`WITH ${sessCte()} SELECT to_char(started AT TIME ZONE ${tz}, 'MM-DD HH24:MI') AS at, ip, country, city, device, browser,
        landing, exit_path, pvs, dur, src, ref_host, journey FROM sess ORDER BY started DESC LIMIT 40`),
    run(sql`(SELECT ts, 'view' AS kind, path AS detail, country FROM analytics_pageviews ORDER BY ts DESC LIMIT 15)
      UNION ALL (SELECT ts, type AS kind, COALESCE(NULLIF(label, ''), path) AS detail, country FROM analytics_events ORDER BY ts DESC LIMIT 15)
      ORDER BY ts DESC LIMIT 30`),
  ]);

  const s = summary[0] ?? {};
  return NextResponse.json({
    success: true,
    range: { key: rangeKey in RANGES ? rangeKey : '7d', label: range.label, start, end, tz, gran },
    kpi: kpiR[0] ?? {},
    summary: s,
    prev: prev[0] ?? {},
    series, live, liveCount: liveCount[0] ?? { now_users: 0, last30: 0 },
    pages, landing, exits, sources, hosts, utm, organic, countries, cities, tech,
    visitorsMix: visitorsMix[0] ?? { total: 0, returning_v: 0 },
    heat, clicks, outbound, funnel: funnel[0] ?? {}, signupSrc, recent, feed,
  });
}
