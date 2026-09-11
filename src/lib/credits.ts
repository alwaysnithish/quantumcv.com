import { db } from '@/db/client';
import { users, creditTransactions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const CREDIT_COSTS = {
  generate: 5,
  chat_edit: 1,
  enhance_bullet: 1,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

export class InsufficientCreditsError extends Error {
  constructor(public required: number, public available: number) {
    super(`Insufficient credits: need ${required}, have ${available}.`);
  }
}

export async function getCredits(userId: string): Promise<number> {
  const [user] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId)).limit(1);
  return user?.credits ?? 0;
}

/**
 * Deducts credits for an AI action. Throws InsufficientCreditsError if the
 * user doesn't have enough — callers should catch this and return a 402
 * response with a clear "buy more credits" message rather than silently
 * failing or letting the balance go negative.
 */
export async function deductCredits(userId: string, action: CreditAction): Promise<number> {
  const cost = CREDIT_COSTS[action];
  const current = await getCredits(userId);

  if (current < cost) {
    throw new InsufficientCreditsError(cost, current);
  }

  const newBalance = current - cost;
  await db.update(users).set({ credits: newBalance }).where(eq(users.id, userId));
  await db.insert(creditTransactions).values({
    userId,
    type: action,
    amount: -cost,
    status: 'completed',
  });

  return newBalance;
}

/** Adds credits after a verified purchase. Idempotent per Razorpay payment ID. */
export async function addCreditsFromPurchase(
  userId: string,
  amount: number,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  currency?: 'INR' | 'USD',
  amountPaidSmallestUnit?: number
): Promise<{ success: boolean; newBalance?: number }> {
  // Idempotency guard — if this payment ID was already processed (e.g. a
  // retried webhook), don't credit twice.
  const [existing] = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.razorpayPaymentId, razorpayPaymentId))
    .limit(1);
  if (existing) {
    const balance = await getCredits(userId);
    return { success: true, newBalance: balance };
  }

  const current = await getCredits(userId);
  const newBalance = current + amount;
  await db.update(users).set({ credits: newBalance, premiumUnlocked: true }).where(eq(users.id, userId));
  await db.insert(creditTransactions).values({
    userId,
    type: 'purchase',
    amount,
    currency,
    amountPaid: amountPaidSmallestUnit,
    razorpayOrderId,
    razorpayPaymentId,
    status: 'completed',
  });

  return { success: true, newBalance };
}

export async function isPremiumUnlocked(userId: string): Promise<boolean> {
  const [user] = await db.select({ premiumUnlocked: users.premiumUnlocked }).from(users).where(eq(users.id, userId)).limit(1);
  return !!user?.premiumUnlocked;
}
