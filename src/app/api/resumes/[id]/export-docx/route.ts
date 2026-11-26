import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { requireUser } from '@/lib/require-user';
import { db } from '@/db/client';
import { resumes } from '@/db/schema';
import { getResumeForUser, parseGeneratedData } from '@/lib/resumes';
import { generateDocx } from '@/lib/resume-canvas/docx-export';

export const maxDuration = 30;

type Params = { params: Promise<{ id: string }> };

async function respond(userId: string, resumeId: string, targetRole: string, data: any) {
  let buffer: Buffer;
  try {
    buffer = await generateDocx(data);
  } catch (err) {
    console.error('DOCX generation error:', err);
    return NextResponse.json({ success: false, message: 'Word export failed.' }, { status: 500 });
  }
  await db.update(resumes).set({ status: 'exported', lastExported: new Date().toISOString() }).where(eq(resumes.id, resumeId));

  const slug = (s: string) => String(s ?? '').trim().replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '');
  const filename = ['QuantumCV', slug(data.name ?? 'resume'), slug(targetRole)].filter(Boolean).join('_') + '.docx';
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const resume = await getResumeForUser(id, auth.id);
  if (!resume) return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 });
  const data = parseGeneratedData(resume);
  if (!data) return NextResponse.json({ success: false, message: 'No resume data to export.' }, { status: 400 });
  return respond(auth.id, id, resume.targetRole, data);
}

/** Exports the latest in-browser state (same contract as the PDF route). */
export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const resume = await getResumeForUser(id, auth.id);
  if (!resume) return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const data = body.generated_data ?? parseGeneratedData(resume);
  if (!data) return NextResponse.json({ success: false, message: 'No resume data to export.' }, { status: 400 });
  await db.update(resumes).set({ generatedData: JSON.stringify(data), updatedAt: new Date().toISOString() }).where(eq(resumes.id, id));
  return respond(auth.id, id, resume.targetRole, data);
}
