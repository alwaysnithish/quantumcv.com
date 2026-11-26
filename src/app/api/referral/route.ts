import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { getReferralStats } from '@/lib/referrals';
import { REFERRAL_REWARD_CREDITS, SITE_URL } from '@/lib/credit-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const stats = await getReferralStats(auth.id);
  return NextResponse.json({
    success: true,
    ...stats,
    reward: REFERRAL_REWARD_CREDITS,
    link: `${SITE_URL}/?ref=${stats.code}`,
    premiumUnlocked: auth.premiumUnlocked,
  });
}
