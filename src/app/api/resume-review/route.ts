import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { reviewResume } from '@/lib/resume-review';

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const body = await request.json().catch(() => ({}));
  const source = body.resume_data ?? body.resume_text;
  if (!source) return NextResponse.json({ success: false, message: 'Paste or provide a resume first.' }, { status: 400 });
  return NextResponse.json({ success: true, review: reviewResume(source, body.role ?? '', body.job_description ?? '') });
}
