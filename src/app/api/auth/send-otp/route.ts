import { NextRequest, NextResponse } from 'next/server';
import { createAndSendOtp } from '@/lib/otp';
import { setPendingOtpEmail } from '@/lib/session';

export async function POST(request: NextRequest) {
  let email = '';
  try {
    const body = await request.json();
    email = String(body.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request.' }, { status: 400 });
  }

  const atIndex = email.indexOf('@');
  const domain = atIndex >= 0 ? email.slice(atIndex + 1) : '';
  if (!email || atIndex < 0 || !domain.includes('.')) {
    return NextResponse.json(
      { success: false, message: 'Please enter a valid email address.' },
      { status: 400 }
    );
  }

  const { success, message } = await createAndSendOtp(email);
  if (!success) {
    return NextResponse.json({ success: false, message }, { status: 429 });
  }

  await setPendingOtpEmail(email);

  return NextResponse.json({ success: true, message });
}
