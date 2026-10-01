import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { chatEditResume } from '@/lib/gemini';
import { db } from '@/db/client';
import { resumes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getResumeForUser, createVersion, parseGeneratedData } from '@/lib/resumes';

/** POST /api/ai/chat-detailed — port of resume/views.py::chat_edit_detailed */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const resumeId: string | undefined = body.resume_id;
  const instruction: string = (body.instruction ?? '').trim();

  if (!instruction) {
    return NextResponse.json({ success: false, error: 'Instruction is required' }, { status: 400 });
  }
  if (!resumeId) {
    return NextResponse.json({ success: false, error: 'Resume ID is required' }, { status: 400 });
  }

  const resume = await getResumeForUser(resumeId, auth.id);
  if (!resume) return NextResponse.json({ success: false, error: 'Resume not found' }, { status: 404 });

  try {
    const currentData = parseGeneratedData(resume);
    const { data, reply } = await chatEditResume(currentData, instruction);

    await db
      .update(resumes)
      .set({ generatedData: JSON.stringify(data), updatedAt: new Date().toISOString() })
      .where(eq(resumes.id, resumeId));

    await createVersion(resumeId, `AI edit: ${instruction.slice(0, 50)}`);

    return NextResponse.json({ success: true, data, message: reply });
  } catch (err: any) {
    console.error('Chat edit detailed error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
