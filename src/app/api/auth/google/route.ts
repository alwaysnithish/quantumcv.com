import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { db } from '@/db/client';
import { users, creditTransactions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { createUserSession } from '@/lib/session';
import { getUserByGoogleId } from '@/lib/users';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifies the Google One Tap / OAuth ID token.
 * Direct equivalent of accounts/views.py::_verify_google_token, using
 * google-auth-library instead of the Python google-auth package.
 */
async function verifyGoogleToken(credential: string) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload() ?? null;
  } catch (err) {
    console.error('Google token verification error:', err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  // Two ways this endpoint gets called:
  // 1. JSON body { credential } — from the "Sign in with Google" button's
  //    JS callback (src/components/google-sign-in-button.tsx). Returns JSON.
  // 2. Form-encoded body — from Google's redirect-based One Tap flow.
  //    Returns a redirect response.
  const contentType = request.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  let credential: string | null = null;
  if (isJson) {
    const body = await request.json().catch(() => ({}));
    credential = body.credential ?? null;
  } else {
    const form = await request.formData().catch(() => null);
    credential =
      form?.get('credential')?.toString() ??
      new URL(request.url).searchParams.get('credential');
  }

  const fail = (message: string, status = 400) =>
    isJson
      ? NextResponse.json({ success: false, message }, { status })
      : NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, request.url));

  if (!credential) return fail('no_credential');

  const payload = await verifyGoogleToken(credential);
  if (!payload) return fail('invalid_token', 401);

  const googleId = payload.sub;
  const email = (payload.email ?? '').toLowerCase();
  const name = payload.name ?? '';
  const picture = payload.picture ?? '';

  if (!email || !googleId) return fail('missing_fields');

  let user = await getUserByGoogleId(googleId);
  if (!user) {
    const [byEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    user = byEmail ?? null;
  }

  if (!user) {
    const id = randomUUID();
    await db.insert(users).values({ id, email, fullName: name });
    await db.insert(creditTransactions).values({ userId: id, type: 'bonus', amount: 10, status: 'completed' });
    const [created] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    user = created;
  }

  await db
    .update(users)
    .set({
      googleId,
      fullName: user.fullName || name,
      avatarUrl: picture || user.avatarUrl,
      lastLogin: new Date().toISOString(),
    })
    .where(eq(users.id, user.id));

  await createUserSession(user.id);

  return isJson
    ? NextResponse.json({ success: true, redirect: '/dashboard' })
    : NextResponse.redirect(new URL('/dashboard', request.url));
}
