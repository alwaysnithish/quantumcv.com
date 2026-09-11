import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { db } from '@/db/client';
import { creditTransactions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

/** GET /api/billing/history — full credit ledger (purchases + AI-action consumption) */
export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const rows = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, auth.id))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(200);

  return NextResponse.json({
    transactions: rows.map((r) => ({
      id: r.id,
      type: r.type,
      amount: r.amount,
      status: r.status,
      createdAt: r.createdAt,
    })),
  });
}
