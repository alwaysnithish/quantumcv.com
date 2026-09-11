import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { db } from '@/db/client';
import { users, creditTransactions } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

/** GET /api/admin/users — every user, with credit balance, premium status, and lifetime purchase totals */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        credits: users.credits,
        premiumUnlocked: users.premiumUnlocked,
        isStaff: users.isStaff,
        dateJoined: users.dateJoined,
        lastLogin: users.lastLogin,
        totalCreditsPurchased: sql<number>`coalesce(sum(${creditTransactions.amount}) filter (where ${creditTransactions.type} = 'purchase'), 0)::int`,
        totalOrders: sql<number>`count(*) filter (where ${creditTransactions.type} = 'purchase')::int`,
      })
      .from(users)
      .leftJoin(creditTransactions, eq(creditTransactions.userId, users.id))
      .groupBy(users.id)
      .orderBy(desc(users.dateJoined));

    return NextResponse.json({ users: rows });
  } catch (err) {
    console.error('Admin users query failed:', err);
    return NextResponse.json({ success: false, message: 'Failed to load users.' }, { status: 500 });
  }
}
