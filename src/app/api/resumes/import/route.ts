import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { db } from '@/db/client';
import { resumes } from '@/db/schema';
import { newResumeId } from '@/lib/resumes';
import { parseResumeToStructured } from '@/lib/gemini';
import { detectKind, extractText, normaliseImported, MAX_IMPORT_BYTES } from '@/lib/resume-import';
import { rateLimit } from '@/lib/rate-limit';

export const maxDuration = 60;

/**
 * POST /api/resumes/import  (multipart: file, country?)
 * Parses an existing PDF / DOCX / TXT resume into an editable QuantumCV resume.
 * Costs 0 credits (it is a transcription, not a rewrite); capped per user per day.
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const limit = await rateLimit(`import:${auth.id}`, 10, 24 * 3600).catch(() => ({ allowed: true }));
  if (!limit.allowed) {
    return NextResponse.json({ success: false, message: 'Daily import limit reached (10). Try again tomorrow, or edit your existing resumes.' }, { status: 429 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ success: false, message: 'Choose a PDF or Word (.docx) file.' }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ success: false, message: 'That file is empty.' }, { status: 400 });
  if (file.size > MAX_IMPORT_BYTES) return NextResponse.json({ success: false, message: 'Keep uploads below 5 MB.' }, { status: 413 });

  const buf = Buffer.from(await file.arrayBuffer());
  const kind = detectKind(buf, file.name);
  if (!kind) {
    return NextResponse.json({ success: false, message: 'Unsupported file. Upload a PDF, a .docx Word file, or a .txt file (older .doc files: save as .docx first).' }, { status: 415 });
  }

  const country = String(form?.get('country') ?? 'India').slice(0, 40);

  let parsed: any;
  try {
    if (kind === 'pdf') {
      parsed = await parseResumeToStructured({ pdfBase64: buf.toString('base64'), country });
    } else {
      const text = await extractText(buf, kind);
      if (text.length < 40) return NextResponse.json({ success: false, message: 'We could not read any text in that file.' }, { status: 422 });
      parsed = await parseResumeToStructured({ text, country });
    }
  } catch (err) {
    console.error('Resume import error:', err);
    return NextResponse.json({ success: false, message: 'We could not read that resume. Try another file, or paste the text into the builder.' }, { status: 502 });
  }

  const data = normaliseImported(parsed, { country });
  if (!data.sections.length) {
    return NextResponse.json({ success: false, message: 'No resume content was found in that file. If it is a scanned image, upload a text-based PDF or a Word file.' }, { status: 422 });
  }

  const id = newResumeId();
  const now = new Date().toISOString();
  await db.insert(resumes).values({
    id,
    userId: auth.id,
    title: `${data.name} — Imported`,
    targetRole: data.target_role,
    country,
    rawData: '',
    generatedData: JSON.stringify(data),
    status: 'draft',
    updatedAt: now,
  });

  return NextResponse.json({ success: true, resume_id: id, sections: data.sections.length });
}
