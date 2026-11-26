/**
 * src/lib/resume-canvas/docx-export.ts
 *
 * Editable Microsoft Word (.docx) export. Mirrors the ATS-safe single-column
 * layout used by the PDF "ATS" mode (see print-html.ts): real text, real
 * heading/bullet structure, no tables for layout, no text boxes, no images —
 * so it parses cleanly in ATS software AND stays easy to edit in Word.
 *
 * It follows the user's accent colour, font family, font scale and section
 * order. Template-specific decoration (sidebars, skill bars, etc.) is
 * deliberately flattened — that's what makes the file ATS-safe.
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  LevelFormat,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  WidthType,
} from 'docx';
import type { AnyData } from './sections';

const PAGE_W = 11906; // A4 twips
const MARGIN = 1000;
const CONTENT_W = PAGE_W - MARGIN * 2;

const FONT_MAP: Record<string, string> = {
  inter: 'Calibri',
  lato: 'Calibri',
  'source-sans': 'Calibri',
  calibri: 'Calibri',
  'dm-sans': 'Calibri',
  merriweather: 'Georgia',
  playfair: 'Georgia',
  georgia: 'Georgia',
};

/** Resume fields may hold the editor's inline tags (<b>, <mark>, <span>) and entities. */
function unescapeHtml(s: string) {
  return s.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&amp;', '&');
}

function runs(text: unknown, base: { size: number; font: string; color?: string; bold?: boolean; italics?: boolean }): TextRun[] {
  const src = String(text ?? '');
  const out: TextRun[] = [];
  let bold = !!base.bold;
  for (const part of src.split(/(<\/?b>|<\/?strong>)/i)) {
    if (/^<b>$|^<strong>$/i.test(part)) { bold = true; continue; }
    if (/^<\/b>$|^<\/strong>$/i.test(part)) { bold = !!base.bold; continue; }
    const clean = unescapeHtml(part.replace(/<[^>]+>/g, ''));
    if (clean) out.push(new TextRun({ text: clean, size: base.size, font: base.font, color: base.color, bold, italics: base.italics }));
  }
  return out.length ? out : [new TextRun({ text: '', size: base.size, font: base.font })];
}

const hex = (c: string | undefined, fallback: string) => ((c ?? '').replace('#', '').match(/^[0-9a-fA-F]{6}$/) ? (c as string).replace('#', '').toUpperCase() : fallback);

export async function generateDocx(data: AnyData, opts: { accent?: string; fontId?: string; fontScale?: number } = {}): Promise<Buffer> {
  const lc = data?.layout_config ?? {};
  const accent = hex(opts.accent ?? lc.accent_color, '2058E8');
  const font = FONT_MAP[opts.fontId ?? lc.font_id ?? 'dm-sans'] ?? 'Calibri';
  const scale = typeof opts.fontScale === 'number' ? opts.fontScale : typeof lc.font_scale === 'number' ? lc.font_scale : 1;
  const pt = (n: number) => Math.round(n * scale * 2); // docx sizes are half-points

  const body = { size: pt(10), font, color: '1E293B' };
  const muted = { size: pt(9), font, color: '64748B' };
  const children: (Paragraph | Table)[] = [];

  // ── header ──
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: runs(data.name || 'Your Name', { size: pt(20), font, color: '0F172A', bold: true }) })
  );
  if (data.target_role) {
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: runs(data.target_role, { size: pt(11), font, color: accent, bold: true }) }));
  }
  const contact = ['email', 'phone', 'linkedin', 'github', 'location'].map((f) => data[f]).filter(Boolean).join('  |  ');
  if (contact) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: accent, space: 6 } },
        children: runs(contact, muted),
      })
    );
  }

  const heading = (title: string) =>
    new Paragraph({
      spacing: { before: 200, after: 80 },
      keepNext: true,
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: accent, space: 2 } },
      children: [new TextRun({ text: String(title || '').toUpperCase(), size: pt(10.5), font, color: accent, bold: true, characterSpacing: 20 })],
    });

  const bullet = (text: string) =>
    new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { after: 30 }, children: runs(text, body) });

  const para = (text: string) => new Paragraph({ spacing: { after: 80 }, children: runs(text, body) });

  const entry = (en: AnyData) => {
    const dates = [en.date_start, en.date_end].filter(Boolean).join(' – ');
    const out: Paragraph[] = [
      new Paragraph({
        keepNext: true,
        spacing: { before: 60, after: 0 },
        tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
        children: [...runs(en.title, { ...body, size: pt(10.5), color: '0F172A', bold: true }), ...(dates ? [new TextRun({ text: `\t${dates}`, size: pt(9), font, color: '64748B' })] : [])],
      }),
    ];
    const meta = [en.subtitle, en.location].filter(Boolean).join(' · ');
    if (meta) out.push(new Paragraph({ keepNext: true, spacing: { after: 30 }, children: runs(meta, { ...muted, italics: true }) }));
    for (const b of en.bullets ?? []) out.push(bullet(b));
    return out;
  };

  const sections = [...(data.sections ?? [])].filter((s: AnyData) => s && s.type !== 'divider').sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));

  for (const sec of sections) {
    children.push(heading(sec.title || ''));
    switch (sec.type) {
      case 'summary':
      case 'objective':
      case 'profile':
      case 'personal_statement':
      case 'custom-text':
        children.push(para(sec.summary_text || ''));
        break;
      case 'skills':
        for (const g of sec.skill_groups ?? []) {
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [...runs(`${g.category}: `, { ...body, bold: true, color: '0F172A' }), ...runs((g.skills ?? []).join(', '), body)],
            })
          );
        }
        break;
      case 'skills-bars':
      case 'skills-dots':
        children.push(para((sec.skills ?? []).map((s: AnyData) => s.name).filter(Boolean).join(', ')));
        break;
      case 'skills-tags':
        children.push(para((sec.tags ?? []).join(', ')));
        break;
      case 'languages':
        for (const en of sec.entries ?? []) children.push(para(en.subtitle ? `${en.title} — ${en.subtitle}` : en.title));
        break;
      case 'bullet-list':
        for (const b of sec.bullets ?? []) children.push(bullet(b));
        break;
      case 'table': {
        const td = sec.tableData ?? { rows: [] };
        const rows: string[][] = td.rows ?? [];
        const cols = Math.max(1, ...rows.map((r) => r.length));
        if (rows.length) {
          const cellW = Math.floor(CONTENT_W / cols);
          const border = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' };
          const borders = { top: border, bottom: border, left: border, right: border };
          children.push(
            new Table({
              width: { size: CONTENT_W, type: WidthType.DXA },
              columnWidths: Array(cols).fill(cellW),
              rows: rows.map(
                (r, ri) =>
                  new TableRow({
                    children: Array.from({ length: cols }, (_, ci) =>
                      new TableCell({
                        borders,
                        width: { size: cellW, type: WidthType.DXA },
                        margins: { top: 60, bottom: 60, left: 100, right: 100 },
                        children: [new Paragraph({ children: runs(r[ci] ?? '', { ...body, bold: td.hasHeader && ri === 0 }) })],
                      })
                    ),
                  })
              ),
            })
          );
          children.push(new Paragraph({ spacing: { after: 60 }, children: [] }));
        }
        break;
      }
      default:
        for (const en of sec.entries ?? []) children.push(...entry(en));
    }
  }

  const doc = new Document({
    creator: 'QuantumCV',
    title: `${data.name ?? 'Resume'} — Resume`,
    styles: { default: { document: { run: { font, size: pt(10) } } } },
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 220 } } } }],
        },
      ],
    },
    sections: [
      {
        properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: 900, bottom: 900, left: MARGIN, right: MARGIN } } },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
