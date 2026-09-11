// src/lib/resume-canvas/pdf-export.ts
import puppeteer from 'puppeteer';
import { TEMPLATES } from './templates';
import { AnyData } from './sections';
import { buildPrintHtml, PrintOptions } from './print-html';

const FONT_CSS: Record<string, { css: string; gUrl: string | null }> = {
  inter: { css: "'Inter',Arial,sans-serif", gUrl: 'Inter:wght@400;500;600;700;800' },
  lato: { css: "'Lato',Arial,sans-serif", gUrl: 'Lato:wght@400;700;900' },
  'source-sans': { css: "'Source Sans 3',Arial,sans-serif", gUrl: 'Source+Sans+3:wght@400;500;600;700' },
  calibri: { css: "Calibri,Arial,sans-serif", gUrl: null },
  'dm-sans': { css: "'DM Sans',system-ui,sans-serif", gUrl: 'DM+Sans:wght@400;500;600;700' },
  syne: { css: "'Syne',system-ui,sans-serif", gUrl: 'Syne:wght@400;600;700;800' },
  merriweather: { css: "'Merriweather',Georgia,serif", gUrl: 'Merriweather:wght@300;400;700' },
  playfair: { css: "'Playfair Display',Georgia,serif", gUrl: 'Playfair+Display:wght@400;600;700' },
  georgia: { css: "Georgia,'Times New Roman',serif", gUrl: null },
  jetbrains: { css: "'JetBrains Mono',monospace", gUrl: 'JetBrains+Mono:wght@400;500' },
};

const PDF_CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{background:white;margin:0;width:210mm}
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
  .resume-section-heading{break-after:avoid;page-break-after:avoid}
  .resume-entry{break-inside:avoid;page-break-inside:avoid}
  .resume-bullet{break-inside:avoid;page-break-inside:avoid;orphans:3;widows:3}
  a{color:inherit}
`;

/**
 * Runs in the page before printing. Guarantees the PDF text stream is emitted
 * in DOM order = visual order for every template:
 *  1. removes interactive chrome (buttons, handles, hover actions) from the DOM
 *  2. strips contenteditable/handlers so each editable element is just styled text
 *  3. flattens small flex/grid TEXT rows (bullets, skill rows, tag pills) into
 *     inline block flow — with hanging indents so wrapped lines still align
 *  4. deliberately SPARES structural layouts (headers, sidebars, two-column
 *     grids, entry date-columns) — their DOM order already matches the visual
 *     reading order, and flattening them would destroy the template's look.
 */
export const PRINT_FLATTEN_JS = String.raw`(() => {
  document.querySelectorAll(
    '.sec-drag-handle,.sec-controls,.bullet-actions,.add-item-btn,.tbl-resize,' +
    '.skill-step-btn,.skill-move-btn,.skill-enhance-btn,.bullet-enhance-btn,button'
  ).forEach((el) => el.remove());

  document.querySelectorAll('[contenteditable]').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name !== 'style' && attr.name !== 'class') el.removeAttribute(attr.name);
    }
  });

  const isLeafish = (el) => {
    for (const child of Array.from(el.children)) {
      if (child.tagName === 'IMG' || child.tagName === 'TABLE') return false;
      if (child.children.length > 0) return false;
    }
    return true;
  };

  document.querySelectorAll('div,li').forEach((row) => {
    const cs = getComputedStyle(row);
    const d = cs.display;
    if (d !== 'flex' && d !== 'inline-flex' && d !== 'grid' && d !== 'inline-grid') return;
    if (!row.querySelector('[contenteditable], .rp-dot, .rp-sbar-track')) return;
    // spare structural layouts: any non-leaf child that actually carries text
    const structural = Array.from(row.children).some(
      (c) => !isLeafish(c) && (c.textContent || '').trim()
    );
    if (structural) return;

    const gap = parseFloat(cs.columnGap) || 0;
    row.style.display = 'block';
    row.style.position = 'static';
    Array.from(row.children).forEach((c) => {
      const h = c;
      const ccs = getComputedStyle(h);
      if (ccs.position === 'absolute') { h.remove(); return; }
      if (ccs.display.includes('flex') || ccs.display.includes('grid')) h.style.display = 'inline-block';
      else h.style.display = 'inline';
      if (gap) h.style.marginRight = gap + 'px';
    });

    // hanging indent so "▸ Bullet text…" wraps with aligned continuation lines
    const first = row.firstElementChild;
    if (first && first.children.length === 0 && (first.textContent || '').trim().length <= 2) {
      row.style.paddingLeft = '13px';
      row.style.textIndent = '-13px';
    }
  });
})()`;

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
    line-height:1.3;
    color:#0f172a;
    text-rendering:optimizeLegibility;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }
  .resume-wrap{width:210mm;min-height:calc(297mm - 30mm);padding:15mm;background:white}
  [data-sec-id]{break-inside:auto}
  @page{size:A4;margin:0}
</style>
</head>
<body>
  <div class="resume-wrap">${bodyHtml}</div>
</body>
</html>`;
}

async function launchBrowser() {
  if (process.env.NODE_ENV === 'production') {
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteerCore = await import('puppeteer-core');
    chromium.setGraphicsMode = false;
    return puppeteerCore.launch({
      args: await puppeteerCore.defaultArgs({ args: chromium.args, headless: 'shell' }),
      executablePath: await chromium.executablePath(),
      headless: 'shell',
    });
  }
  const puppeteerMod = await import('puppeteer');
  return puppeteerMod.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });
}

export async function generateTemplatedPdf(
  data: AnyData,
  templateId: string,
  accent: string,
  fontId = 'dm-sans',
  fontScale = 1
): Promise<Buffer> {
  const html = buildTemplatedResumeHtml(data, templateId, accent, fontId, fontScale);

  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(15000);

    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    await page.emulateMediaType('print');

    // 1) Strip contenteditable/handlers from the template DOM
    await page.evaluate(() => {
      document.querySelectorAll('[contenteditable]').forEach((el) => {
        el.removeAttribute('contenteditable');
        el.removeAttribute('spellcheck');
        el.removeAttribute('oninput');
        el.removeAttribute('onmouseenter');
        el.removeAttribute('onmouseleave');
        el.removeAttribute('onclick');
      });
    });

    // 2) Flatten small text rows (bullets, skill bars/dots, tags) so Chromium
    //    emits them in visual order. Structural layouts (sidebars, grids, columns) are spared.
    await page.evaluate(PRINT_FLATTEN_JS);

    await Promise.race([
      page.evaluateHandle('document.fonts.ready'),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function generatePrintPdf(data: AnyData, opts: PrintOptions = {}): Promise<Buffer> {
  const html = buildPrintHtml(data, opts);

  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(15000);
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await Promise.race([
      page.evaluateHandle('document.fonts.ready'),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

// Legacy helper kept for any callers that still import it
export async function generatePdf(html: string): Promise<Buffer> {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    await page.emulateMediaType('print');
    await page.evaluate(() => {
      document.querySelectorAll('[contenteditable]').forEach((el) => {
        el.removeAttribute('contenteditable');
        el.removeAttribute('spellcheck');
        el.removeAttribute('oninput');
        el.removeAttribute('onmouseenter');
        el.removeAttribute('onmouseleave');
        el.removeAttribute('onclick');
      });
    });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
