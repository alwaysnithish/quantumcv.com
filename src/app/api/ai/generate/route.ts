import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { generateResume } from '@/lib/gemini';
import { db } from '@/db/client';
import { resumes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getResumeForUser, newResumeId } from '@/lib/resumes';
import { deductCredits, getCredits, InsufficientCreditsError, CREDIT_COSTS } from '@/lib/credits';

/** POST /api/ai/generate — port of resume/views.py::generate_resume_view */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  const body = await request.json().catch(() => ({}));
  const rawData: string = (body.raw_data ?? '').trim();
  const jobDescription: string = (body.job_description ?? '').trim();
  const country: string = body.country ?? 'India';
  const role: string = body.role ?? 'Software Engineer';
  const resumeId: string | undefined = body.resume_id;

  if (!rawData) {
    return NextResponse.json({ success: false, message: 'Career data is required.' }, { status: 400 });
  }

  // Reject clearly-insufficient input before it ever reaches the credit
  // check or the AI call — a one-word or single-line input can't produce a
  // real resume, and the user shouldn't be charged credits for it.
  const wordCount = rawData.split(/\s+/).filter(Boolean).length;
  if (rawData.length < 60 || wordCount < 12) {
    return NextResponse.json(
      {
        success: false,
        code: 'insufficient_data',
        message:
          "That's not quite enough to work with yet. Add a bit more detail — your education, any experience or projects, and your skills — then try again.",
      },
      { status: 400 }
    );
  }

  // Check credits before spending money on a Gemini call.
  const balance = await getCredits(user.id);
  if (balance < CREDIT_COSTS.generate) {
    return NextResponse.json(
      {
        success: false,
        code: 'insufficient_credits',
        message: `You need ${CREDIT_COSTS.generate} credits to generate a resume — you have ${balance}. Buy more credits to continue.`,
        required: CREDIT_COSTS.generate,
        available: balance,
      },
      { status: 402 }
    );
  }

  let result;
  try {
    result = await generateResume(rawData, jobDescription, country, role);
  } catch (err: any) {
    console.error('AI generation error:', err);
    return NextResponse.json(
      { success: false, message: err.message ?? 'Generation failed. Please try again.' },
      { status: 500 }
    );
  }

  // Only deduct credits after a successful generation — a failed AI call
  // shouldn't cost the user anything.
  let newBalance: number;
  try {
    newBalance = await deductCredits(user.id, 'generate');
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      // Rare race condition (concurrent requests) — the pre-check above
      // should catch this in the overwhelming majority of cases.
      return NextResponse.json(
        { success: false, code: 'insufficient_credits', message: 'Insufficient credits.' },
        { status: 402 }
      );
    }
    throw err;
  }

  const existing = resumeId ? await getResumeForUser(resumeId, user.id) : null;

  const commonFields = {
    generatedData: JSON.stringify(result),
    rawData,
    jobDescription,
    status: 'generated' as const,
    aiConfidenceScore: result.ai_confidence ?? 0,
    atsScore: result.ats_score ?? 0,
    title: `${result.name ?? 'Resume'} — ${role}`,
    targetRole: role,
    updatedAt: new Date().toISOString(),
  };

  let finalId: string;
  if (existing) {
    finalId = existing.id;
    await db.update(resumes).set(commonFields).where(eq(resumes.id, existing.id));
  } else {
    finalId = newResumeId();
    await db.insert(resumes).values({ id: finalId, userId: user.id, country, ...commonFields });
  }

  return NextResponse.json({ success: true, resume_id: finalId, data: result, credits_remaining: newBalance });
}
