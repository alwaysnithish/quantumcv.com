/**
 * src/lib/session.ts
 *
 * Replaces Django's `django.contrib.auth` session cookies.
 * Two cookies are used:
 *   - "qcv_session"    : signed JWT holding { userId }, set after OTP/Google
 *                        verification. Long-lived (30 days), httpOnly.
 *   - "qcv_pending_otp": signed JWT holding { email }, short-lived (10 min),
 *                        set after send-otp and read by verify-otp/resend-otp.
 *                        This replaces Django's `request.session['pending_otp_email']`.
 */
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'qcv_session';
const PENDING_OTP_COOKIE = 'qcv_pending_otp';

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'SESSION_SECRET is not set. Add it to .env.local (any long random string).'
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createUserSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
}

export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return (payload.userId as string) ?? null;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// ── pending OTP email (short-lived, pre-login) ──────────

export async function setPendingOtpEmail(email: string) {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(getSecret());

  const store = await cookies();
  store.set(PENDING_OTP_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  });
}

export async function getPendingOtpEmail(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(PENDING_OTP_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return (payload.email as string) ?? null;
  } catch {
    return null;
  }
}

export async function clearPendingOtpEmail() {
  const store = await cookies();
  store.delete(PENDING_OTP_COOKIE);
}
