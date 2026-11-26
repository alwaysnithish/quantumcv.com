/**
 * src/lib/user-lifecycle.ts
 * Side effects of account creation and first ATS scan. Always called from
 * next/server `after()` so they never slow down the user-facing response,
 * and every step swallows its own errors (a failed email must never break
 * sign-in or a scan).
 */
import { ensureReferralCode, attachReferral, rewardReferralOnFirstScan } from './referrals';
import { sendWelcomeEmail, sendReferralRewardEmail, sendAtsReportEmail } from './lifecycle-emails';

type U = { id: string; email: string; fullName: string };

export async function onNewUser(user: U, referralCookie: string | null | undefined) {
  try { await ensureReferralCode(user.id); } catch (e) { console.error('referral code:', e); }
  try { await attachReferral(user, referralCookie); } catch (e) { console.error('attach referral:', e); }
  try { await sendWelcomeEmail(user); } catch (e) { console.error('welcome email:', e); }
}

export async function onScanCompleted(user: U & { credits: number }, report: any, role?: string) {
  try {
    const result = await rewardReferralOnFirstScan(user.id);
    if (result.rewarded && result.referrer && result.referee) {
      await Promise.allSettled([
        sendReferralRewardEmail({ to: result.referrer, friendName: result.referee.fullName || result.referee.email.split('@')[0], role: 'referrer', totalRewarded: result.referrerRewardedTotal, unlockedTemplates: result.unlockedTemplates }),
        sendReferralRewardEmail({ to: result.referee, friendName: result.referrer.fullName || 'your friend', role: 'friend' }),
      ]);
    }
  } catch (e) { console.error('referral reward:', e); }
  try { await sendAtsReportEmail(user, report, role); } catch (e) { console.error('ats report email:', e); }
}
