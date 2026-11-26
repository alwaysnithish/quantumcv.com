import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { db } from '@/db/client';
import { users, creditTransactions, supportThreads, resumes } from '@/db/schema';
import { sql, eq } from 'drizzle-orm';

/** GET /api/admin/overview — high-level stats for the admin dashboard home */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const [userCounts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      premium: sql<number>`count(*) filter (where ${users.premiumUnlocked} = true)::int`,
    })
    .from(users);

  const revenueByCurrency = await db
    .select({
      currency: creditTransactions.currency,
      total: sql<number>`coalesce(sum(${creditTransactions.amountPaid}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(creditTransactions)
    .where(eq(creditTransactions.type, 'purchase'))
    .groupBy(creditTransactions.currency);

  const [creditsIssued] = await db
    .select({
      total: sql<number>`coalesce(sum(${creditTransactions.amount}) filter (where ${creditTransactions.type} = 'purchase'), 0)::int`,
      count: sql<number>`count(*) filter (where ${creditTransactions.type} = 'purchase')::int`,
    })
    .from(creditTransactions);

  const [openTickets] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(supportThreads)
    .where(eq(supportThreads.unreadByAdmin, true));

  const [resumeCount] = await db.select({ count: sql<number>`count(*)::int` }).from(resumes);

  return NextResponse.json({
    totalUsers: userCounts.total,
    premiumUsers: userCounts.premium,
    freeUsers: userCounts.total - userCounts.premium,
    totalPurchases: creditsIssued.count,
    totalCreditsIssued: creditsIssued.total,
    revenueByCurrency: revenueByCurrency.map((r) => ({
      currency: r.currency,
      // amountPaid is stored in smallest currency unit (paise/cents)
      total: r.total / 100,
      count: r.count,
    })),
    openSupportTickets: openTickets.count,
    totalResumes: resumeCount.count,
  });
}
