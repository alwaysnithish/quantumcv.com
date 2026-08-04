import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { db } from '@/db/client';
import { resumes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getResumeForUser, createVersion, parseGeneratedData } from '@/lib/resumes';

type Params = { params: Promise<{ id: string }> };

/** GET /api/resumes/[id] — used by the builder page to load a resume. */
export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const resume = await getResumeForUser(id, auth.id);
  if (!resume) return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 });

  return NextResponse.json({
    resume: { ...resume, generatedData: parseGeneratedData(resume) },
  });
}

/** PATCH /api/resumes/[id] — port of resume/views.py::save_resume (auto-versions before overwrite) */
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const resume = await getResumeForUser(id, auth.id);
  if (!resume) return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 });

  const data = await request.json().catch(() => null);
  if (!data) return NextResponse.json({ success: false, message: 'Invalid JSON.' }, { status: 400 });

  if (resume.generatedData) {
    await createVersion(id, 'Auto-save');
  }

  const updatedAt = new Date().toISOString();
  await db
    .update(resumes)
    .set({
      title: data.title ?? resume.title,
      generatedData: data.generated_data ? JSON.stringify(data.generated_data) : resume.generatedData,
      rawData: data.raw_data ?? resume.rawData,
      jobDescription: data.job_description ?? resume.jobDescription,
      updatedAt,
    })
    .where(eq(resumes.id, id));

  return NextResponse.json({
    success: true,
    message: 'Saved.',
    updated_at: updatedAt,
  });
}

/** DELETE /api/resumes/[id] — port of resume/views.py::delete_resume */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const resume = await getResumeForUser(id, auth.id);
  if (!resume) return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 });

  await db.delete(resumes).where(eq(resumes.id, id));
  return NextResponse.json({ success: true });
}
