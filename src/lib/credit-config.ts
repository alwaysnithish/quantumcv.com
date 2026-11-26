/**
 * src/lib/credit-config.ts
 *
 * Pure constants (no DB / server imports) so client components such as the
 * pricing calculator and referral hub can share the exact same numbers the
 * server enforces. Change a number here and every screen + email follows.
 */
export const CREDIT_COSTS = {
  generate: 5,
  chat_edit: 1,
  enhance_bullet: 1,
} as const;

/** Credits every new account receives at signup. */
export const SIGNUP_BONUS_CREDITS = 10;

/** "Give 10, Get 10": paid to BOTH sides once the friend finishes a first ATS scan. */
export const REFERRAL_REWARD_CREDITS = 10;

/** Rewarded referrals needed to permanently unlock the premium template library. */
export const REFERRAL_UNLOCK_COUNT = 3;

/** Anti-abuse ceiling: rewards stop after this many successful referrals per user. */
export const REFERRAL_MAX_REWARDED = 25;

export const SITE_URL = 'https://quantumcv.app';
