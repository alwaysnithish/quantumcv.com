// src/lib/resume-canvas/print-html.ts
// PDF-safe, reading-order-safe document built directly from resume data.
// Uses ONLY block-level flow: no flex, no grid, no position:absolute/relative,
// no contenteditable, no hover-only controls. Guarantees the PDF text layer
// is emitted in DOM order = visual order = copy order (ATS-parseable too).

import { AnyData, esc, contacts } from './sections';

const FONT_CSS: Record<string, { css: string; gUrl: string | null }> = {
  inter: { css: "'Inter',Arial,sans-serif", gUrl: 'Inter:wght@400;500;600;700;800' },
  lato: { css: "'Lato',Arial,sans-serif", gUrl: 'Lato:wght@400;700;900' },
  'source-sans': { css: "'Source Sans 3',Arial,sans-serif", gUrl: 'Source+Sans+3:wght@400;500;600;700' },
  calibri: { css: "Calibri,Arial,sans-serif", gUrl: null },
  'dm-sans': { css: "'DM Sans',system-ui,sans-serif", gUrl: 'DM+Sans:wght@400;500;600;700' },
  merriweather: { css: "'Merriweather',Georgia,serif", gUrl: 'Merriweather:wght@300;400;700' },
  playfair: { css: "'Playfair Display',Georgia,serif", gUrl: 'Playfair+Display:wght@400;600;700' },
  georgia: { css: "Georgia,'Times New Roman',serif", gUrl: null },
};

export interface PrintOptions {
  accent?: string;
  fontId?: string;
  fontScale?: number;
}

/** One entry (experience / education / project / certification / …) */
function printEntry(en: AnyData, ac: string): string {
  const meta = [en.subtitle, en.location, [en.date_start, en.date_end].filter(Boolean).join(' – ')]
    .filter(Boolean)
    .map((v: string) => esc(v))
    .join(' · ');
  const bullets = (en.bullets || [])
    .map((b: string) => `<li>${esc(b)}</li>`)
    .join('');
  return `
    <div class="entry">
      <p class="entry-title">${esc(en.title)}</p>
      ${meta ? `<p class="entry-meta">${meta}</p>` : ''}
      ${bullets ? `<ul class="bullets">${bullets}</ul>` : ''}
    </div>`;
}

/** Section body dispatch — mirrors renderSection() but with print-safe markup */
function printSectionBody(sec: AnyData, ac: string): string {
  switch (sec.type) {
    case 'summary':
    case 'objective':
    case 'profile':
    case 'personal_statement':
    case 'custom-text':
      return `<p class="para">${esc(sec.summary_text || '')}</p>`;

    case 'skills':
      return (sec.skill_groups || [])
        .map(
          (g: AnyData) => `
        <p class="para skill-line"><span class="skill-cat">${esc(g.category)}:</span> ${esc((g.skills || []).join(', '))}</p>`
        )
        .join('');

    case 'skills-bars':
      return (sec.skills || [])
        .map(
          (s: AnyData) => `
        <div class="sbar">
          <p class="sbar-name">${esc(s.name)}</p>
          <div class="sbar-track"><div class="sbar-fill" style="width:${esc(String(s.level))}%;background:${ac}"></div></div>
        </div>`
        )
        .join('');

    case 'skills-dots':
      return (sec.skills || [])
        .map((s: AnyData) => {
          const dots = [1, 2, 3, 4, 5]
            .map((d) => `<span class="dot ${s.level >= d ? 'on' : ''}">●</span>`)
            .join('');
          return `<p class="para skill-line"><span class="skill-cat">${esc(s.name)}</span> <span class="dots">${dots}</span></p>`;
        })
        .join('');

    case 'skills-tags':
      return `<p class="para">${esc((sec.tags || []).join(', '))}</p>`;

    case 'languages':
      return (sec.entries || [])
        .map(
          (en: AnyData) =>
            `<p class="para skill-line"><span class="skill-cat">${esc(en.title)}</span>${en.subtitle ? ` — ${esc(en.subtitle)}` : ''}</p>`
        )
        .join('');

    case 'bullet-list':
      return `<ul class="bullets">${(sec.bullets || []).map((b: string) => `<li>${esc(b)}</li>`).join('')}</ul>`;

    case 'table': {
      const td = sec.tableData || { hasHeader: true, colWidths: [50, 50], rows: [['', '']] };
      const rows = td.rows
        .map(
          (row: string[], ri: number) => `
        <tr>${row.map((cell: string) => (td.hasHeader && ri === 0 ? `<th>${esc(cell)}</th>` : `<td>${esc(cell)}</td>`)).join('')}</tr>`
        )
        .join('');
      return `<table class="ptable"><tbody>${rows}</tbody></table>`;
    }

    case 'divider':
      return '<hr class="pdiv">';

    default:
      return (sec.entries || []).map((en: AnyData) => printEntry(en, ac)).join('');
  }
}

function printSection(sec: AnyData, ac: string): string {
  if (sec.type === 'divider') return '<hr class="pdiv">';
  return `
    <section class="psec">
      <h2>${esc(sec.title || '')}</h2>
      ${printSectionBody(sec, ac)}
    </section>`;
}

/** Build the full standalone print document. */
export function buildPrintHtml(data: AnyData, opts: PrintOptions = {}): string {
  const ac = opts.accent || data?.layout_config?.accent_color || '#2058e8';
  const font = FONT_CSS[opts.fontId || data?.layout_config?.font_id || 'dm-sans'] || FONT_CSS['dm-sans'];
  const scale = typeof opts.fontScale === 'number' ? opts.fontScale : (data?.layout_config?.font_scale ?? 1);
  const gLink = font.gUrl
    ? `<link href="https://fonts.googleapis.com/css2?family=${font.gUrl}&display=swap" rel="stylesheet">`
    : '';

  const secs = [...(data.sections || [])]
    .filter((s: AnyData) => s && s.id)
    .sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0))
    .map((sec: AnyData) => printSection(sec, ac))
    .join('');

  const photo =
    data?.layout_config?.show_photo && data?.layout_config?.photo_data_url
      ? `<img class="photo" src="${data.layout_config.photo_data_url}" alt="">`
      : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
${gLink}
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  @page{size:A4;margin:13mm 14mm}
  body{
    font-family:${font.css};
    font-size:${(10 * scale).toFixed(2)}pt;
    line-height:1.4;
    color:#1e293b;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }
  header{text-align:center;margin-bottom:10pt}
  header .photo{width:60pt;height:60pt;border-radius:50%;object-fit:cover;margin-bottom:6pt;display:inline-block}
  h1{font-size:${(20 * scale).toFixed(2)}pt;font-weight:800;color:#0f172a;letter-spacing:-0.01em}
  .role{font-size:${(11 * scale).toFixed(2)}pt;font-weight:700;color:${ac};margin-top:2pt}
  .contact{font-size:${(9 * scale).toFixed(2)}pt;color:#475569;margin-top:4pt}
  .contact a{color:inherit;text-decoration:none}
  header .rule{height:2pt;background:${ac};margin-top:8pt}
  h2{
    font-size:${(10.5 * scale).toFixed(2)}pt;
    font-weight:800;text-transform:uppercase;letter-spacing:0.12em;
    color:${ac};border-bottom:1pt solid ${ac}55;
    padding-bottom:2pt;margin:10pt 0 5pt;
    break-after:avoid;page-break-after:avoid;
  }
  .psec{margin-bottom:2pt}
  .para{margin-bottom:4pt}
  .entry{margin-bottom:7pt;break-inside:avoid;page-break-inside:avoid}
  .entry-title{font-weight:700;color:#0f172a;font-size:${(10.5 * scale).toFixed(2)}pt}
  .entry-meta{font-size:${(9 * scale).toFixed(2)}pt;color:#64748b;margin-top:1pt}
  ul.bullets{margin:2pt 0 0 0;padding-left:14pt}
  ul.bullets li{margin-bottom:2pt}
  .skill-cat{font-weight:700;color:#0f172a}
  .skill-line{margin-bottom:3pt}
  .dot{color:#cbd5e1;font-size:${(8 * scale).toFixed(2)}pt}
  .dot.on{color:${ac}}
  .sbar{margin-bottom:5pt;break-inside:avoid;page-break-inside:avoid}
  .sbar-name{font-weight:600;color:#0f172a;font-size:${(9.5 * scale).toFixed(2)}pt}
  .sbar-track{height:4pt;background:#e2e8f0;border-radius:99pt;margin-top:2pt}
  .sbar-fill{height:100%;border-radius:99pt}
  table.ptable{width:100%;border-collapse:collapse;margin-bottom:5pt}
  table.ptable td,table.ptable th{border:0.75pt solid #e2e8f0;padding:4pt 6pt;text-align:left;font-size:${(9.5 * scale).toFixed(2)}pt}
  table.ptable th{background:${ac}18;font-weight:700;color:#0f172a}
  hr.pdiv{border:none;border-top:1pt solid ${ac}55;margin:8pt 0}
</style>
</head>
<body>
  <header>
    ${photo}
    <h1>${esc(data.name || '')}</h1>
    ${data.target_role ? `<p class="role">${esc(data.target_role)}</p>` : ''}
    <p class="contact">${contacts(data, ' · ')}</p>
    <div class="rule"></div>
  </header>
  ${secs}
</body>
</html>`;
}
