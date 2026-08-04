/**
 * src/lib/otp.ts
 * Direct port of accounts/utils.py — generate_otp, create_and_send_otp, verify_otp.
 * Same rate limit (3 per 15 min) and expiry rules as the Django version.
 */
import { db } from '@/db/client';
import { otpSessions } from '@/db/schema';
import { and, eq, gte, desc } from 'drizzle-orm';
import { sendOtpEmail } from './notifications';

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES ?? 10);
const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX = 3;

function generateOtp(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) code += Math.floor(Math.random() * 10);
  return code;
}

export async function createAndSendOtp(
  emailRaw: string,
  fullName = ''
): Promise<{ success: boolean; message: string }> {
  const email = emailRaw.toLowerCase();

  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
  ).toISOString();

  const recent = await db
    .select()
    .from(otpSessions)
    .where(
      and(eq(otpSessions.email, email), gte(otpSessions.createdAt, windowStart))
    );

  if (recent.length >= RATE_LIMIT_MAX) {
    return {
      success: false,
      message: 'Too many attempts. Please wait 15 minutes before trying again.',
    };
  }

  const code = generateOtp();
  const expiresAt = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  ).toISOString();

  await db.insert(otpSessions).values({
    email,
    code,
    fullName,
    expiresAt,
    used: false,
  });

  const sent = await sendOtpEmail(email, code);
  if (!sent) {
    return { success: false, message: 'Failed to send email. Please try again later.' };
  }

  return { success: true, message: 'Verification code sent to your email.' };
}

export async function verifyOtp(
  emailRaw: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  const email = emailRaw.toLowerCase();

  const [session] = await db
    .select()
    .from(otpSessions)
    .where(
      and(
        eq(otpSessions.email, email),
        eq(otpSessions.code, code),
        eq(otpSessions.used, false)
      )
    )
    .orderBy(desc(otpSessions.createdAt))
    .limit(1);

  if (!session) {
    return { success: false, message: 'No matching OTP found. Please request a new code.' };
  }

  const isValid = !session.used && new Date(session.expiresAt) > new Date();

  if (!isValid) {
    await db
      .update(otpSessions)
      .set({ used: true })
      .where(eq(otpSessions.id, session.id));
    return { success: false, message: 'Code has expired. Please request a new one.' };
  }

  await db.update(otpSessions).set({ used: true }).where(eq(otpSessions.id, session.id));

  return { success: true, message: 'Verified successfully.' };
}
