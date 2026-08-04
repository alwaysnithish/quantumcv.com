import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { db } from '@/db/client';
import { supportThreads, supportMessages } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

/** GET /api/support/thread — the current user's own support conversation (may be empty if they've never messaged) */
export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const [thread] = await db.select().from(supportThreads).where(eq(supportThreads.userId, auth.id)).limit(1);

  if (!thread) {
    return NextResponse.json({ thread: null, messages: [] });
  }

  const messages = await db
    .select()
    .from(supportMessages)
    .where(eq(supportMessages.threadId, thread.id))
    .orderBy(asc(supportMessages.createdAt));

  // Mark as read by the user now that they're viewing it.
  if (thread.unreadByUser) {
    await db.update(supportThreads).set({ unreadByUser: false }).where(eq(supportThreads.id, thread.id));
  }

  return NextResponse.json({
    thread: { id: thread.id, status: thread.status },
    messages: messages.map((m) => ({ id: m.id, sender: m.sender, body: m.body, createdAt: m.createdAt })),
  });
}
