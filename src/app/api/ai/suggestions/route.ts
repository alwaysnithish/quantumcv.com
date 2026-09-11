import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { analyzeResumeForImprovements } from '@/lib/gemini';
import { getResumeForUser, parseGeneratedData } from '@/lib/resumes';

/** GET /api/ai/suggestions?id=... — port of resume/views.py::get_resume_suggestions */
export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const resumeId = request.nextUrl.searchParams.get('id');
  if (!resumeId) {
    return NextResponse.json({ success: false, error: 'Resume ID required' }, { status: 400 });
  }

  const resume = await getResumeForUser(resumeId, auth.id);
  if (!resume) return NextResponse.json({ success: false, error: 'Resume not found' }, { status: 404 });

  try {
    const suggestions = await analyzeResumeForImprovements(parseGeneratedData(resume));
    return NextResponse.json({ success: true, suggestions });
  } catch (err: any) {
    console.error('Suggestions error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
