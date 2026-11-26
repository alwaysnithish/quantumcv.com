import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { chatEditResume } from '@/lib/gemini';
import { db } from '@/db/client';
import { resumes } from '@/db/schema';
import { getResumeForUser, createVersion } from '@/lib/resumes';
import { eq } from 'drizzle-orm';
import { deductCredits, getCredits, InsufficientCreditsError, CREDIT_COSTS } from '@/lib/credits';

/** POST /api/ai/chat — port of resume/views.py::chat_resume_view */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const instruction: string = (body.message ?? '').trim();
  const currentData = body.current_data;
  const resumeId: string | undefined = body.resume_id;

  if (!instruction) {
    return NextResponse.json({ success: false, message: 'Message is required.' }, { status: 400 });
  }
  if (!currentData) {
    return NextResponse.json({ success: false, message: 'No resume data to edit.' }, { status: 400 });
  }

  const balance = await getCredits(auth.id);
  if (balance < CREDIT_COSTS.chat_edit) {
    return NextResponse.json(
      {
        success: false,
        code: 'insufficient_credits',
        message: `You need ${CREDIT_COSTS.chat_edit} credit for an AI edit — you have ${balance}. Buy more credits to continue.`,
        required: CREDIT_COSTS.chat_edit,
        available: balance,
      },
      { status: 402 }
    );
  }

  let data, reply;
  try {
    ({ data, reply } = await chatEditResume(currentData, instruction));
  } catch (err: any) {
    console.error('Chat edit error:', err);
    return NextResponse.json({ success: false, message: 'AI edit failed. Please try again.' }, { status: 500 });
  }

  let newBalance: number;
  try {
    newBalance = await deductCredits(auth.id, 'chat_edit');
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { success: false, code: 'insufficient_credits', message: 'Insufficient credits.' },
        { status: 402 }
      );
    }
    throw err;
  }

  if (resumeId) {
    const resume = await getResumeForUser(resumeId, auth.id);
    if (resume) {
      await createVersion(resumeId, `Chat: ${instruction.slice(0, 50)}`);
      await db
        .update(resumes)
        .set({
          generatedData: JSON.stringify(data),
          atsScore: data.ats_score ?? resume.atsScore,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(resumes.id, resumeId));
    }
  }

  return NextResponse.json({ success: true, data, reply, credits_remaining: newBalance });
}
