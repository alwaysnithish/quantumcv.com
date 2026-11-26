import { NextResponse } from 'next/server';
import { createAndSendOtp } from '@/lib/otp';
import { getPendingOtpEmail } from '@/lib/session';

export async function POST() {
  const email = await getPendingOtpEmail();
  if (!email) {
    return NextResponse.json(
      { success: false, message: 'Session expired. Please start again.' },
      { status: 400 }
    );
  }

  const { success, message } = await createAndSendOtp(email);
  return NextResponse.json({ success, message });
}
