/**
 * src/lib/resume-canvas/pdf-export.ts
 *
 * Backend PDF generation using the EXACT same template render() functions
 * that draw the live browser canvas (see templates.ts). Because sections.ts
 * and templates.ts have no DOM/window dependency (see esc()/photoEl()),
 * these same functions run identically in Node — so what you see in the
 * browser is what comes out of the PDF, including skill bars/dots/tags/
 * tables, which the old client-side window.print() approach could silently
 * break if browser print CSS handling didn't match (a common source of
 * "bars/dots missing from the exported PDF" bugs).
 *
 * The resulting PDF is real selectable/copyable text (not a rasterized
 * image) because Puppeteer's page.pdf() prints actual DOM text content —
 * this is what makes it ATS-readable, unlike a screenshot-based export.
 */
import { TEMPLATES } from './templates';
import { AnyData } from './sections';

const FONT_CSS: Record<string, { css: string; gUrl: string | null }> = {
  'dm-sans': { css: "'DM Sans',system-ui,sans-serif", gUrl: 'DM+Sans:wght@400;500;600;700' },
  syne: { css: "'Syne',system-ui,sans-serif", gUrl: 'Syne:wght@400;600;700;800' },
  merriweather: { css: "'Merriweather',Georgia,serif", gUrl: 'Merriweather:wght@300;400;700' },
  playfair: { css: "'Playfair Display',Georgia,serif", gUrl: 'Playfair+Display:wght@400;600;700' },
  georgia: { css: "Georgia,'Times New Roman',serif", gUrl: null },
  jetbrains: { css: "'JetBrains Mono',monospace", gUrl: 'JetBrains+Mono:wght@400;500' },
};

/**
 * Visual-only CSS needed to render skill bars/dots/tags/tables correctly.
 * Interactive-only affordances (drag handles, +/- steppers, add buttons,
 * delete buttons, table resize handles) are hidden entirely — a PDF export
 * should look like a finished document, not the editor.
 */
const PDF_CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{background:white}
  [contenteditable]{outline:none!important}
  .sec-drag-handle,.sec-controls,.bullet-actions,.add-item-btn,.sec-ctrl-btn,
  .tbl-resize,.skill-step-btn,.skill-move-btn,.skill-enhance-btn,.bullet-enhance-btn,
  button[onclick*="delSkillBar"],button[onclick*="delSkillDot"],button[onclick*="delTag"],
  button[onclick*="addTag"],button[onclick*="triggerPhotoUpload"],button[onclick*="deleteBulletListItem"]{
    display:none!important;
  }
  .rp-sbar-item{margin-bottom:5px}
  .rp-sbar-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:3px}
  .rp-sbar-name{font-size:0.78rem;font-weight:600}
  .rp-sbar-right{display:flex;align-items:center;gap:5px}
  .rp-sbar-pct{font-size:0.65rem;color:#94a3b8;font-family:monospace}
  .rp-sbar-track{height:5px;background:#e2e8f0;border-radius:99px;overflow:hidden}
  .rp-sbar-fill{height:100%;border-radius:99px}
  .rp-sdot-item{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px}
  .rp-sdot-name{font-size:0.78rem;font-weight:600;flex:1}
  .rp-dot{width:9px;height:9px;border-radius:50%;display:inline-block;border:1.5px solid #cbd5e1;background:transparent}
  .rp-dot.filled{background:currentColor;border-color:currentColor}
  a{color:inherit}
`;

export function buildTemplatedResumeHtml(
  data: AnyData,
  templateId: string,
  accent: string,
  fontId = 'dm-sans',
  fontScale = 1
): string {
  const tpl = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
  const font = FONT_CSS[fontId] || FONT_CSS['dm-sans'];
  const gLink = font.gUrl
    ? `<link href="https://fonts.googleapis.com/css2?family=${font.gUrl}&display=swap" rel="stylesheet">`
    : '';
  const bodyHtml = tpl.render(data, accent);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
${gLink}
<style>
  ${PDF_CSS}
  body{
    font-family:${font.css};
    font-size:${fontScale}em;
    color:#0f172a;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }
  .resume-wrap{width:210mm;min-height:297mm;padding:14mm 13mm;margin:0 auto;background:white}
  @page{size:A4;margin:0}
</style>
</head>
<body>
  <div class="resume-wrap">${bodyHtml}</div>
</body>
</html>`;
}

export async function generateTemplatedPdf(
  data: AnyData,
  templateId: string,
  accent: string,
  fontId = 'dm-sans',
  fontScale = 1
): Promise<Buffer> {
  const html = buildTemplatedResumeHtml(data, templateId, accent, fontId, fontScale);

  let browser;
  if (process.env.NODE_ENV === 'production') {
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteer = await import('puppeteer-core');
    chromium.setGraphicsMode = false; // we don't render WebGL content; skips extra extraction work
    browser = await puppeteer.launch({
      args: await puppeteer.defaultArgs({ args: chromium.args, headless: 'shell' }),
      executablePath: await chromium.executablePath(),
      headless: 'shell',
    });
  } else {
    const puppeteer = await import('puppeteer');
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
    browser = await puppeteer.launch({ headless: true, executablePath });
  }

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(15000);

    // Use domcontentloaded, not 'load' — waiting for 'load' blocks on every
    // external resource (Google Fonts stylesheet/font files) finishing,
    // which can hang indefinitely on networks that block/throttle external
    // requests (e.g. restrictive institutional proxies). We don't need
    // external resources to finish for the HTML/CSS itself to be ready.
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    // Give web fonts a brief chance to apply, but never block more than 2s
    // on it — if the font request is stuck/blocked, fall back to system
    // fonts rather than failing the whole export.
    await Promise.race([
      page.evaluateHandle('document.fonts.ready'),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
