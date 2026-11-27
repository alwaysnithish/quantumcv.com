/** Server-side conversion events (signup, scan) linked to the visitor via the qcv_vid cookie. */
import { db } from '@/db/client';
import { analyticsEvents } from '@/db/schema';
import { getUserById } from '@/lib/users';

export async function trackServerEvent(type: 'signup' | 'scan', vid: string | null | undefined, userId?: string) {
  if (!vid || !/^[a-z0-9-]{8,40}$/i.test(vid)) return;
  try {
    // admins never count — not even their own signups/scans
    if (userId) { const u = await getUserById(userId); if (u?.isStaff) return; }
    await db.insert(analyticsEvents).values({ vid, type, userId: userId ?? null, path: type === 'signup' ? '/login' : '/resumeanalyser' });
  } catch (e) { console.error('track event:', e); }
}
