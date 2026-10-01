'use client';

import { useMemo } from 'react';
import type { ResumeTemplate } from '@/lib/resume-canvas/templates';
import type { AnyData } from '@/lib/resume-canvas/sections';

function staticTemplateHtml(template: ResumeTemplate, data: AnyData, accent: string): string {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = template.render(data, accent);

  // The previous canvas used many nested contenteditable elements. Chromium
  // treats these as separate editing hosts, so a drag-selection can jump from
  // every title to every bullet. The preview is intentionally plain document
  // text: editing belongs in the controlled sidebar, selection belongs here.
  wrapper.querySelectorAll('[contenteditable], [spellcheck], [oninput], [onclick], [onmousedown], [onmouseenter], [onmouseleave]').forEach((el) => {
    el.removeAttribute('contenteditable');
    el.removeAttribute('spellcheck');
    el.removeAttribute('oninput');
    el.removeAttribute('onclick');
    el.removeAttribute('onmousedown');
    el.removeAttribute('onmouseenter');
    el.removeAttribute('onmouseleave');
  });
  wrapper.querySelectorAll('.sec-drag-handle, .sec-controls, .bullet-actions, .add-item-btn, .tbl-resize, button').forEach((el) => el.remove());

  return wrapper.innerHTML;
}

export function ResumeStaticCanvas({
  data,
  template,
  accent,
  fontFamily,
  fontScale,
  onSectionSelect,
}: {
  data: AnyData | null;
  template: ResumeTemplate;
  accent: string;
  fontFamily: string;
  fontScale: number;
  onSectionSelect: (sectionId: string) => void;
}) {
  const html = useMemo(() => (data ? staticTemplateHtml(template, data, accent) : ''), [data, template, accent]);

  if (!data) {
    return <p className="m-auto max-w-sm text-center text-sm text-slate-400">Paste your career data and generate your resume.</p>;
  }

  return (
    <article
      aria-label="Resume preview"
      className="builder-static-resume bg-white text-black shadow-lg rounded-sm w-[210mm] min-h-[297mm] p-[15mm] shrink-0 select-text"
      style={{ fontFamily, fontSize: `${fontScale}em` }}
      onClick={(event) => {
        const target = event.target as Element;
        const section = target.closest('[data-sec-id]');
        const id = section?.getAttribute('data-sec-id');
        if (id) onSectionSelect(id);
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
