import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { db } from '@/db/client';
import { supportThreads, supportMessages, users } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

type Params = { params: Promise<{ id: string }> };

/** GET /api/admin/support/[id] — full message history for one thread; marks it read by admin */
export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const [thread] = await db
    .select({
      id: supportThreads.id,
      subject: supportThreads.subject,
      status: supportThreads.status,
      userEmail: users.email,
      userName: users.fullName,
      userId: users.id,
    })
    .from(supportThreads)
    .innerJoin(users, eq(supportThreads.userId, users.id))
    .where(eq(supportThreads.id, Number(id)))
    .limit(1);

  if (!thread) return NextResponse.json({ success: false, message: 'Thread not found.' }, { status: 404 });

  const messages = await db
    .select()
    .from(supportMessages)
    .where(eq(supportMessages.threadId, thread.id))
    .orderBy(asc(supportMessages.createdAt));

  await db.update(supportThreads).set({ unreadByAdmin: false }).where(eq(supportThreads.id, thread.id));

  return NextResponse.json({ thread, messages });
}
