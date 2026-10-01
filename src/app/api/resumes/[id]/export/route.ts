import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { db } from '@/db/client';
import { resumes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getResumeForUser, parseGeneratedData } from '@/lib/resumes';
import { generateTemplatedPdf, generatePrintPdf } from '@/lib/resume-canvas/pdf-export';
import { TEMPLATES } from '@/lib/resume-canvas/templates';
import { isPremiumUnlocked } from '@/lib/credits';

export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

function pdfFilename(resumeData: any, targetRole: string): string {
  const nameSlug = (resumeData.name ?? 'resume').replaceAll(' ', '_');
  const roleSlug = (targetRole ?? '').replaceAll(' ', '_');
  return `QuantumCV_${nameSlug}_${roleSlug}.pdf`;
}

/**
 * Renders either the user's selected template (default) or the ATS-safe
 * single-column print layout (?mode=ats). Template PDF now copies in order
 * thanks to PRINT_FLATTEN_JS; print PDF is maximum-ATS fallback.
 */
async function buildPdfResponse(
  userId: string,
  resumeId: string,
  targetRole: string,
  resumeData: any,
  mode: 'template' | 'ats'
) {
  const lc = resumeData.layout_config || {};
  let templateId: string = lc.template_id || 'classic-clean';
  const accent: string = lc.accent_color || '#2058e8';
  const fontId: string = lc.font_id || 'dm-sans';
  const fontScale: number = lc.font_scale || 1;

  const tpl = TEMPLATES.find((t) => t.id === templateId);
  if (tpl?.premium) {
    const unlocked = await isPremiumUnlocked(userId);
    if (!unlocked) templateId = 'classic-clean';
  }

  let pdfBytes: Buffer;
  try {
    pdfBytes = mode === 'ats'
      ? await generatePrintPdf(resumeData, { accent, fontId, fontScale })
      : await generateTemplatedPdf(resumeData, templateId, accent, fontId, fontScale);
  } catch (err) {
    console.error('PDF generation error:', err);
    return NextResponse.json({ success: false, message: 'PDF generation failed.' }, { status: 500 });
  }

  await db
    .update(resumes)
    .set({ status: 'exported', lastExported: new Date().toISOString() })
    .where(eq(resumes.id, resumeId));

  const filename = pdfFilename(resumeData, targetRole);
  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

/** GET /api/resumes/[id]/export — export using the resume's stored/saved data */
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const resume = await getResumeForUser(id, auth.id);
  if (!resume) return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 });

  const data = parseGeneratedData(resume);
  if (!data) return NextResponse.json({ success: false, message: 'No resume data to export.' }, { status: 400 });

  const mode = req.nextUrl.searchParams.get('mode') === 'ats' ? 'ats' : 'template';
  return buildPdfResponse(auth.id, id, resume.targetRole, data, mode);
}

/** POST /api/resumes/[id]/export — export using the latest in-browser state (body.generated_data) */
export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const resume = await getResumeForUser(id, auth.id);
  if (!resume) return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const data = body.generated_data ?? parseGeneratedData(resume);
  if (!data) return NextResponse.json({ success: false, message: 'No resume data to export.' }, { status: 400 });

  await db
    .update(resumes)
    .set({ generatedData: JSON.stringify(data), updatedAt: new Date().toISOString() })
    .where(eq(resumes.id, id));

  const mode = new URL(request.url).searchParams.get('mode') === 'ats' ? 'ats' : 'template';
  return buildPdfResponse(auth.id, id, resume.targetRole, data, mode);
}
