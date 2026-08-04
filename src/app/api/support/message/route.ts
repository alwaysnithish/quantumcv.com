import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { db } from '@/db/client';
import { supportThreads, supportMessages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notifySupportInboxOfNewMessage } from '@/lib/notifications';

/** POST /api/support/message — user sends a message, creating their thread if this is the first one */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const message: string = (body.message ?? '').trim();
  if (!message) {
    return NextResponse.json({ success: false, message: 'Message is required.' }, { status: 400 });
  }

  let [thread] = await db.select().from(supportThreads).where(eq(supportThreads.userId, auth.id)).limit(1);

  if (!thread) {
    const [created] = await db
      .insert(supportThreads)
      .values({ userId: auth.id, subject: message.slice(0, 60) })
      .returning();
    thread = created;
  } else {
    // Reopen a closed thread if the user is messaging again.
    await db
      .update(supportThreads)
      .set({ status: 'open', unreadByAdmin: true, lastMessageAt: new Date().toISOString() })
      .where(eq(supportThreads.id, thread.id));
  }

  await db.insert(supportMessages).values({ threadId: thread.id, sender: 'user', body: message });

  notifySupportInboxOfNewMessage({
    fromEmail: auth.email,
    fromName: auth.fullName,
    message,
    threadId: thread.id,
  }).catch((err) => console.error('Support notification email failed:', err));

  return NextResponse.json({ success: true, thread_id: thread.id });
}
