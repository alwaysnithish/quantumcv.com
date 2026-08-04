import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { db } from '@/db/client';
import { resumes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getResumeForUser, parseGeneratedData } from '@/lib/resumes';
import { generateTemplatedPdf } from '@/lib/resume-canvas/pdf-export';
import { TEMPLATES } from '@/lib/resume-canvas/templates';
import { isPremiumUnlocked } from '@/lib/credits';

// Launching a real headless browser + rendering + printing to PDF routinely
// takes longer than Vercel's default serverless function timeout (10s on
// Hobby, 15s default elsewhere), especially on a cold start where Chromium
// itself has to decompress first. This raises the ceiling for this route
// specifically. Hobby plans are capped at 60s regardless of this setting —
// if PDF generation is still timing out on Hobby, that's the hard limit;
// Pro plans allow up to 300s.
export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

function pdfFilename(resumeData: any, targetRole: string): string {
  const nameSlug = (resumeData.name ?? 'resume').replaceAll(' ', '_');
  const roleSlug = (targetRole ?? '').replaceAll(' ', '_');
  return `QuantumCV_${nameSlug}_${roleSlug}.pdf`;
}

/**
 * Renders using the SAME template/accent/font the user picked in the builder
 * (persisted in resumeData.layout_config), so the downloaded PDF matches
 * what's on screen exactly — including skill bars/dots/tags/tables, and
 * with real selectable/ATS-readable text (Puppeteer prints actual DOM text,
 * not a rasterized screenshot).
 *
 * Server-side template gating: even though the builder UI already hides
 * premium templates from free users, this re-checks here too — a client
 * could otherwise call selectTemplate() directly via devtools to bypass
 * the UI gate. Falls back to a free template rather than failing outright.
 */
async function buildPdfResponse(userId: string, resumeId: string, targetRole: string, resumeData: any) {
  const lc = resumeData.layout_config || {};
  let templateId: string = lc.template_id || 'classic-clean';
  const accent: string = lc.accent_color || '#2058e8';
  const fontId: string = lc.font_id || 'dm-sans';
  const fontScale: number = lc.font_scale || 1;

  const tpl = TEMPLATES.find((t) => t.id === templateId);
  if (tpl?.premium) {
    const unlocked = await isPremiumUnlocked(userId);
    if (!unlocked) {
      templateId = 'classic-clean';
    }
  }

  let pdfBytes: Buffer;
  try {
    pdfBytes = await generateTemplatedPdf(resumeData, templateId, accent, fontId, fontScale);
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
export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const resume = await getResumeForUser(id, auth.id);
  if (!resume) return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 });

  const data = parseGeneratedData(resume);
  if (!data) return NextResponse.json({ success: false, message: 'No resume data to export.' }, { status: 400 });

  return buildPdfResponse(auth.id, id, resume.targetRole, data);
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

  return buildPdfResponse(auth.id, id, resume.targetRole, data);
}
