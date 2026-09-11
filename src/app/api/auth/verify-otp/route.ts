import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/otp';
import {
  getPendingOtpEmail,
  clearPendingOtpEmail,
  createUserSession,
} from '@/lib/session';
import { getOrCreateUserByEmail } from '@/lib/users';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  let code = '';
  let fullName = '';
  try {
    const body = await request.json();
    code = String(body.otp ?? '').trim();
    fullName = String(body.full_name ?? '').trim();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request.' }, { status: 400 });
  }

  const email = await getPendingOtpEmail();
  if (!email) {
    return NextResponse.json(
      { success: false, message: 'Session expired. Please start again.' },
      { status: 400 }
    );
  }

  const { success, message } = await verifyOtp(email, code);
  if (!success) {
    return NextResponse.json({ success: false, message }, { status: 401 });
  }

  const { user, created } = await getOrCreateUserByEmail(email);

  if (fullName && (created || !user.fullName)) {
    await db.update(users).set({ fullName }).where(eq(users.id, user.id));
  }
  await db
    .update(users)
    .set({ lastLogin: new Date().toISOString() })
    .where(eq(users.id, user.id));

  await createUserSession(user.id);
  await clearPendingOtpEmail();

  return NextResponse.json({ success: true, redirect: '/dashboard' });
}
