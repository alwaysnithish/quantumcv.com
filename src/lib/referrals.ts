/**
 * src/lib/referrals.ts
 *
 * "Give 10, Get 10" referral engine.
 *
 *  1. Every user gets a short unique code (quantumcv.app/?ref=CODE).
 *  2. A visitor arriving with ?ref=CODE gets a 30-day `qcv_ref` cookie
 *     (see components/referral-capture.tsx).
 *  3. When that visitor creates an account, attachReferral() links the new
 *     user to the referrer (status = signed_up). Existing accounts can never
 *     be attached — only freshly created ones.
 *  4. The first time the new user completes an ATS scan,
 *     rewardReferralOnFirstScan() pays +10 credits to BOTH people.
 *
 * Anti-abuse: unique referee, self-referral and email-alias detection,
 * a per-referrer cap, and an atomic status flip so a reward can only ever
 * be paid once even under concurrent requests.
 */
import { randomInt } from 'crypto';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { users, referrals, creditTransactions } from '@/db/schema';
import {
  REFERRAL_REWARD_CREDITS,
  REFERRAL_UNLOCK_COUNT,
  REFERRAL_MAX_REWARDED,
} from './credit-config';

// No 0/O/1/I/L so codes survive being read out loud in a placement group.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_RE = /^[A-Z0-9]{6,12}$/;

export const REF_COOKIE = 'qcv_ref';

function generateCode(length = 8): string {
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export function sanitizeReferralCode(raw: string | null | undefined): string | null {
  const code = (raw ?? '').trim().toUpperCase();
  return CODE_RE.test(code) ? code : null;
}

/** Collapses Gmail-style aliases (dots, +tags) so a@gmail.com == a+1@gmail.com. */
export function normalizeEmail(email: string): string {
  const [localRaw, domainRaw = ''] = email.toLowerCase().trim().split('@');
  const domain = domainRaw === 'googlemail.com' ? 'gmail.com' : domainRaw;
  let local = localRaw.split('+')[0];
  if (domain === 'gmail.com') local = local.replaceAll('.', '');
  return `${local}@${domain}`;
}

export async function ensureReferralCode(userId: string): Promise<string> {
  const [row] = await db.select({ code: users.referralCode }).from(users).where(eq(users.id, userId)).limit(1);
  if (row?.code) return row.code;

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateCode();
    try {
      const updated = await db
        .update(users)
        .set({ referralCode: code })
        .where(and(eq(users.id, userId), isNull(users.referralCode)))
        .returning({ code: users.referralCode });
      if (updated[0]?.code) return updated[0].code;
      // Someone else (a concurrent request) filled it in — read theirs.
      const [again] = await db.select({ code: users.referralCode }).from(users).where(eq(users.id, userId)).limit(1);
      if (again?.code) return again.code;
    } catch {
      // unique-violation on the code — try another one
    }
  }
  throw new Error('Could not allocate a referral code.');
}

/** Links a brand-new user to whoever referred them. Safe to call with junk. */
export async function attachReferral(
  referee: { id: string; email: string },
  rawCode: string | null | undefined
): Promise<boolean> {
  const code = sanitizeReferralCode(rawCode);
  if (!code) return false;

  const [referrer] = await db.select().from(users).where(eq(users.referralCode, code)).limit(1);
  if (!referrer || referrer.id === referee.id) return false;
  if (normalizeEmail(referrer.email) === normalizeEmail(referee.email)) return false;

  const inserted = await db
    .insert(referrals)
    .values({ referrerId: referrer.id, refereeId: referee.id })
    .onConflictDoNothing()
    .returning({ id: referrals.id });
  if (!inserted.length) return false;

  await db.update(users).set({ referredBy: referrer.id }).where(eq(users.id, referee.id));
  return true;
}

export interface ReferralRewardResult {
  rewarded: boolean;
  referrer?: { id: string; email: string; fullName: string };
  referee?: { id: string; email: string; fullName: string };
  referrerRewardedTotal?: number;
  unlockedTemplates?: boolean;
}

/**
 * Call after any user completes an ATS scan. Does nothing unless this is
 * their FIRST scan and they were referred. Returns who to notify.
 */
export async function rewardReferralOnFirstScan(userId: string): Promise<ReferralRewardResult> {
  // Atomic "is this the first scan?" gate.
  const first = await db
    .update(users)
    .set({ firstScanAt: new Date().toISOString() })
    .where(and(eq(users.id, userId), isNull(users.firstScanAt)))
    .returning({ id: users.id });
  if (!first.length) return { rewarded: false };

  const [link] = await db
    .select()
    .from(referrals)
    .where(and(eq(referrals.refereeId, userId), eq(referrals.status, 'signed_up')))
    .limit(1);
  if (!link) return { rewarded: false };

  const [{ n: alreadyRewarded }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(referrals)
    .where(and(eq(referrals.referrerId, link.referrerId), eq(referrals.status, 'rewarded')));

  if (alreadyRewarded >= REFERRAL_MAX_REWARDED) {
    await db.update(referrals).set({ status: 'rejected' }).where(eq(referrals.id, link.id));
    return { rewarded: false };
  }

  // Atomic claim: only one concurrent caller gets a row back.
  const claimed = await db
    .update(referrals)
    .set({ status: 'rewarded', rewardedAt: new Date().toISOString() })
    .where(and(eq(referrals.id, link.id), eq(referrals.status, 'signed_up')))
    .returning({ id: referrals.id });
  if (!claimed.length) return { rewarded: false };

  const reward = REFERRAL_REWARD_CREDITS;
  for (const id of [link.referrerId, userId]) {
    await db
      .update(users)
      .set({ credits: sql`${users.credits} + ${reward}` })
      .where(eq(users.id, id));
    await db.insert(creditTransactions).values({ userId: id, type: 'referral', amount: reward, status: 'completed' });
  }

  const rewardedTotal = alreadyRewarded + 1;
  let unlockedTemplates = false;
  if (rewardedTotal >= REFERRAL_UNLOCK_COUNT) {
    await db.update(users).set({ premiumUnlocked: true }).where(eq(users.id, link.referrerId));
    unlockedTemplates = rewardedTotal === REFERRAL_UNLOCK_COUNT;
  }

  const [referrer] = await db.select().from(users).where(eq(users.id, link.referrerId)).limit(1);
  const [referee] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return {
    rewarded: true,
    referrer: referrer && { id: referrer.id, email: referrer.email, fullName: referrer.fullName },
    referee: referee && { id: referee.id, email: referee.email, fullName: referee.fullName },
    referrerRewardedTotal: rewardedTotal,
    unlockedTemplates,
  };
}

export async function getReferralStats(userId: string) {
  const code = await ensureReferralCode(userId);
  const rows = await db.select({ status: referrals.status }).from(referrals).where(eq(referrals.referrerId, userId));
  const rewarded = rows.filter((r) => r.status === 'rewarded').length;
  const pending = rows.filter((r) => r.status === 'signed_up').length;
  return {
    code,
    signedUp: rows.length,
    rewarded,
    pending,
    creditsEarned: rewarded * REFERRAL_REWARD_CREDITS,
    unlockTarget: REFERRAL_UNLOCK_COUNT,
    maxRewarded: REFERRAL_MAX_REWARDED,
  };
}
