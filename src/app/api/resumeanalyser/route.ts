import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { analyzeResumeDeep } from '@/lib/gemini';
import { getResumeForUser, parseGeneratedData } from '@/lib/resumes';

const MAX_DOCUMENT_BYTES = 6 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const body = await request.json().catch(() => ({}));
  const role = typeof body.role === 'string' ? body.role.trim() : '';
  const jobDescription = typeof body.job_description === 'string' ? body.job_description.trim() : '';
  let resumeData: unknown;
  let resumeText = typeof body.resume_text === 'string' ? body.resume_text.trim() : '';

  if (typeof body.resume_id === 'string') {
    const resume = await getResumeForUser(body.resume_id, auth.id);
    if (!resume) return NextResponse.json({ success: false, message: 'Resume not found.' }, { status: 404 });
    resumeData = parseGeneratedData(resume);
    resumeText ||= resume.rawData;
  }

  let document: { base64: string; mimeType: string; name: string } | undefined;
  if (body.document?.base64 && body.document?.mimeType && body.document?.name) {
    const base64 = String(body.document.base64);
    const estimatedBytes = Math.floor((base64.length * 3) / 4);
    if (estimatedBytes > MAX_DOCUMENT_BYTES) return NextResponse.json({ success: false, message: 'Keep uploads below 6 MB.' }, { status: 413 });
    document = { base64, mimeType: String(body.document.mimeType), name: String(body.document.name) };
  }
  if (!resumeData && !resumeText && !document) return NextResponse.json({ success: false, message: 'Select, paste, or upload a resume first.' }, { status: 400 });

  try {
    const report = await analyzeResumeDeep({ resumeData, resumeText, document, role, jobDescription });
    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Resume analyser error:', error);
    return NextResponse.json({ success: false, message: 'Gemini could not complete the analysis. Please try again.' }, { status: 502 });
  }
}
