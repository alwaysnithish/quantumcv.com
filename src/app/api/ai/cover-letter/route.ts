import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { generateCoverLetter } from '@/lib/gemini';
import { getResumeForUser, parseGeneratedData } from '@/lib/resumes';

/** POST /api/ai/cover-letter — port of resume/views.py::generate_cover_letter_endpoint */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const resumeId: string | undefined = body.resume_id;
  const jobDescription: string = (body.job_description ?? '').trim();

  if (!resumeId || !jobDescription) {
    return NextResponse.json(
      { success: false, error: 'Resume ID and job description required' },
      { status: 400 }
    );
  }

  const resume = await getResumeForUser(resumeId, auth.id);
  if (!resume) return NextResponse.json({ success: false, error: 'Resume not found' }, { status: 404 });

  try {
    const coverLetter = await generateCoverLetter(parseGeneratedData(resume), jobDescription);
    return NextResponse.json({ success: true, cover_letter: coverLetter });
  } catch (err: any) {
    console.error('Cover letter generation error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
