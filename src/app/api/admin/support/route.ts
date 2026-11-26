import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { db } from '@/db/client';
import { supportThreads, supportMessages, users } from '@/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';

/** GET /api/admin/support — every support thread, newest activity first, with unread badge info */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const threads = await db
      .select({
        id: supportThreads.id,
        subject: supportThreads.subject,
        status: supportThreads.status,
        unreadByAdmin: supportThreads.unreadByAdmin,
        lastMessageAt: supportThreads.lastMessageAt,
        userEmail: users.email,
        userName: users.fullName,
        userId: users.id,
      })
      .from(supportThreads)
      .innerJoin(users, eq(supportThreads.userId, users.id))
      .orderBy(desc(supportThreads.lastMessageAt));

    if (threads.length === 0) {
      return NextResponse.json({ threads: [] });
    }

    // Fetch all messages for these threads and pick the latest per thread
    // in application code — avoids a fragile correlated subquery.
    const threadIds = threads.map((t) => t.id);
    const allMessages = await db
      .select({ threadId: supportMessages.threadId, body: supportMessages.body, createdAt: supportMessages.createdAt })
      .from(supportMessages)
      .where(inArray(supportMessages.threadId, threadIds))
      .orderBy(desc(supportMessages.createdAt));

    const lastMessageByThread = new Map<number, string>();
    for (const m of allMessages) {
      if (!lastMessageByThread.has(m.threadId)) lastMessageByThread.set(m.threadId, m.body);
    }

    return NextResponse.json({
      threads: threads.map((t) => ({ ...t, lastMessage: lastMessageByThread.get(t.id) ?? '' })),
    });
  } catch (err) {
    console.error('Admin support list query failed:', err);
    return NextResponse.json({ success: false, message: 'Failed to load support threads.' }, { status: 500 });
  }
}
