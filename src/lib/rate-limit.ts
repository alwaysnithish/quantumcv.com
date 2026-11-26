/**
 * src/lib/rate-limit.ts
 *
 * Fixed-window rate limiter backed by Postgres (works on serverless, where
 * in-memory counters don't survive between invocations). A single atomic
 * INSERT ... ON CONFLICT statement both increments and rolls the window, so
 * concurrent requests can't race past the limit.
 */
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

export async function rateLimit(
  key: string,
  max: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; count: number }> {
  const result: any = await db.execute(sql`
    INSERT INTO rate_limits (key, count, window_start)
    VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) THEN 1
        ELSE rate_limits.count + 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) THEN now()
        ELSE rate_limits.window_start
      END
    RETURNING count
  `);
  const rows: any[] = result?.rows ?? result ?? [];
  const count = Number(rows[0]?.count ?? 1);
  return { allowed: count <= max, remaining: Math.max(0, max - count), count };
}

/** Best-effort client IP behind Vercel / proxies. */
export function clientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return headers.get('x-real-ip') ?? 'unknown';
}
