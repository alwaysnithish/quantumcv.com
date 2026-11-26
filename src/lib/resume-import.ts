/**
 * src/lib/resume-import.ts
 * Text extraction (PDF / DOCX / TXT) and normalisation of parsed resumes into
 * the builder's section model.
 */
import mammoth from 'mammoth';
import { randomBytes } from 'crypto';
import { extractTextFromPdfBuffer } from './pdf-parser';

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export type ImportKind = 'pdf' | 'docx' | 'txt';

/** Decide by file signature first (never trust the extension alone). */
export function detectKind(buf: Buffer, name: string): ImportKind | null {
  if (buf.subarray(0, 5).toString('latin1') === '%PDF-') return 'pdf';
  if (buf[0] === 0x50 && buf[1] === 0x4b) return name.toLowerCase().endsWith('.docx') ? 'docx' : null; // zip container
  if (/\.(txt|md)$/i.test(name) && !buf.includes(0)) return 'txt';
  return null;
}

export async function extractText(buf: Buffer, kind: ImportKind): Promise<string> {
  if (kind === 'docx') return (await mammoth.extractRawText({ buffer: buf })).value.trim();
  if (kind === 'txt') return buf.toString('utf-8').trim();
  return extractTextFromPdfBuffer(buf);
}

const uid = (p: string) => p + Date.now().toString(36) + randomBytes(3).toString('hex');
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const strList = (v: unknown): string[] => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);

export function normaliseImported(parsed: any, opts: { country?: string } = {}): Record<string, any> {
  const rawSections: any[] = Array.isArray(parsed?.sections) ? parsed.sections : [];
  const sections: any[] = [];

  for (const s of rawSections) {
    if (!s || typeof s !== 'object') continue;
    const title = str(s.title) || str(s.type).toUpperCase();
    let type = str(s.type) || 'custom-text';
    const base: any = { id: uid('s'), title, order: sections.length + 1 };

    if (Array.isArray(s.skill_groups)) {
      const groups = s.skill_groups
        .map((g: any) => ({ category: str(g?.category), skills: strList(g?.skills) }))
        .filter((g: any) => g.skills.length);
      if (groups.length) sections.push({ ...base, type: 'skills', skill_groups: groups });
      continue;
    }
    if (Array.isArray(s.entries)) {
      const entries = s.entries
        .map((e: any) => ({
          id: uid('e'),
          title: str(e?.title),
          subtitle: str(e?.subtitle),
          location: str(e?.location),
          date_start: str(e?.date_start),
          date_end: str(e?.date_end),
          bullets: strList(e?.bullets),
        }))
        .filter((e: any) => e.title || e.bullets.length);
      if (entries.length) sections.push({ ...base, type: type === 'skills' ? 'experience' : type, entries });
      continue;
    }
    if (Array.isArray(s.bullets)) {
      const bullets = strList(s.bullets);
      if (bullets.length) sections.push({ ...base, type: 'bullet-list', bullets });
      continue;
    }
    const text = str(s.summary_text);
    if (text) {
      if (!['summary', 'objective', 'profile', 'personal_statement', 'custom-text'].includes(type)) type = 'custom-text';
      sections.push({ ...base, type, summary_text: text });
    }
  }

  return {
    name: str(parsed?.name) || 'Your Full Name',
    email: str(parsed?.email),
    phone: str(parsed?.phone),
    linkedin: str(parsed?.linkedin),
    github: str(parsed?.github),
    location: str(parsed?.location),
    target_role: str(parsed?.target_role),
    country: opts.country || 'India',
    ai_confidence: 0,
    ats_score: 0,
    layout_config: { accent_color: '#2058e8', template_id: 'classic-clean' },
    sections,
  };
}
