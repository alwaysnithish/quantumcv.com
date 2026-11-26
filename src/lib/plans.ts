export type PlanId = 'starter' | 'pro';
export type Currency = 'INR' | 'USD';

export const PLANS: Record<
  PlanId,
  { credits: number; resumeCount: number; price: Record<Currency, number> }
> = {
  starter: {
    credits: 20, // 3 resume generations (5 credits each = 15) + 5 bonus credits for AI chat-edit/enhance
    resumeCount: 3,
    price: { INR: 39, USD: 1.99 },
  },
  pro: {
    credits: 35, // 5 resume generations (5 credits each = 25) + 5 bonus credits for AI chat-edit/enhance
    resumeCount: 6,
    price: { INR: 65, USD: 2.49 },
  },
};

/** Razorpay wants amounts in the smallest currency unit (paise / cents). */
export function toSmallestUnit(amount: number): number {
  return Math.round(amount * 100);
}
