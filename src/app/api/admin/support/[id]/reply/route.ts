import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { db } from '@/db/client';
import { supportThreads, supportMessages, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendSupportReplyEmail } from '@/lib/notifications';

type Params = { params: Promise<{ id: string }> };

/** POST /api/admin/support/[id]/reply — admin sends a reply as "Team QuantumCV" */
export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const threadId = Number(id);

  const body = await request.json().catch(() => ({}));
  const message: string = (body.message ?? '').trim();
  if (!message) {
    return NextResponse.json({ success: false, message: 'Reply text is required.' }, { status: 400 });
  }

  const [thread] = await db
    .select({ id: supportThreads.id, userId: users.id, userEmail: users.email, userName: users.fullName })
    .from(supportThreads)
    .innerJoin(users, eq(supportThreads.userId, users.id))
    .where(eq(supportThreads.id, threadId))
    .limit(1);

  if (!thread) return NextResponse.json({ success: false, message: 'Thread not found.' }, { status: 404 });

  await db.insert(supportMessages).values({ threadId, sender: 'admin', body: message });
  await db
    .update(supportThreads)
    .set({ unreadByUser: true, unreadByAdmin: false, lastMessageAt: new Date().toISOString() })
    .where(eq(supportThreads.id, threadId));

  sendSupportReplyEmail({
    email: thread.userEmail,
    fullName: thread.userName,
    message,
    threadId,
  }).catch((err) => console.error('Support reply email failed:', err));

  return NextResponse.json({ success: true });
}
