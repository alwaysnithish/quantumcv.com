import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { db } from '@/db/client';
import { creditTransactions, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

/** GET /api/admin/transactions — every credit transaction, across all users, newest first */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const rows = await db
    .select({
      id: creditTransactions.id,
      type: creditTransactions.type,
      amount: creditTransactions.amount,
      currency: creditTransactions.currency,
      amountPaid: creditTransactions.amountPaid,
      razorpayOrderId: creditTransactions.razorpayOrderId,
      razorpayPaymentId: creditTransactions.razorpayPaymentId,
      status: creditTransactions.status,
      createdAt: creditTransactions.createdAt,
      userEmail: users.email,
      userName: users.fullName,
    })
    .from(creditTransactions)
    .innerJoin(users, eq(creditTransactions.userId, users.id))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(500);

  return NextResponse.json({ transactions: rows });
}
