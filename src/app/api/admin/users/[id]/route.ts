import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { db } from '@/db/client';
import { users, creditTransactions, resumes } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

type Params = { params: Promise<{ id: string }> };

/** GET /api/admin/users/[id] — full detail: profile, transaction history, resume count */
export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });

  const transactions = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, id))
    .orderBy(desc(creditTransactions.createdAt));

  const [{ count: resumeCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(resumes)
    .where(eq(resumes.userId, id));

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      credits: user.credits,
      premiumUnlocked: user.premiumUnlocked,
      isStaff: user.isStaff,
      dateJoined: user.dateJoined,
      lastLogin: user.lastLogin,
      resumeCount,
    },
    transactions,
  });
}

/** DELETE /api/admin/users/[id] — deletes the user and everything cascades (resumes, versions, transactions, support threads) */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  if (id === auth.id) {
    return NextResponse.json({ success: false, message: "You can't delete your own admin account from here." }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });

  await db.delete(users).where(eq(users.id, id));
  return NextResponse.json({ success: true });
}
