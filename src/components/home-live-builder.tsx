'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Loader2, Plus, ChevronUp, ChevronDown, X, Palette, LayoutTemplate, Download, SlidersHorizontal } from 'lucide-react';
// NOTE: this imports a homepage-only FORK of templates/sections
// (home-templates.ts / home-sections.ts), not the ones your real
// /builder page uses. That's intentional — the homepage demo's tighter
// spacing, bullet cap, etc. must never affect the real builder, so
// nothing here touches the shared templates.ts/sections.ts at all.
import { TEMPLATES } from '@/lib/resume-canvas/home-templates';
import { SECTION_DEFS, SECTION_TYPE_LABELS, PREVIEW_DATA } from '@/lib/resume-canvas/skeleton';
import { buildResumeFromText, looksParseable } from '@/lib/resume-canvas/text-parser';

// ─────────────────────────────────────────────────────────
// This is the *real* builder engine — same TEMPLATES, same
// SECTION_DEFS, same text-parser.ts used as the offline fallback
// inside the actual /builder page. Nothing here calls the AI or an
// account; "Generate" runs buildResumeFromText() against the sample
// data below, entirely in the browser.
// ─────────────────────────────────────────────────────────
const DEMO_CAREER_DATA = `Name: John Carter
Job Title:
Software Engineer

Email:
[john.carter@example.com](mailto:john.carter@example.com)

Phone:
+1 555 014 7823

Location:
San Francisco, CA

LinkedIn:
linkedin.com/in/john-carter-demo

GitHub:
github.com/john-carter-demo

Portfolio:
johncarter.dev

Professional Summary:
Software Engineer with 4+ years of experience building reliable web applications and scalable backend services. Experienced in developing modern user interfaces, REST APIs, database systems, and cloud-based applications.

Experience

Software Engineer
Vertex Labs
Jan 2023 – Present

Responsibilities:

* Developed scalable web applications used by more than 40,000 monthly users.
* Built REST APIs using Node.js and TypeScript.
* Improved application performance by 38% through caching and database optimisation.
* Collaborated with designers and product teams to deliver new features.
* Introduced automated testing that reduced production issues by 25%.

Junior Software Developer
BluePeak Systems
Jun 2020 – Dec 2022

Responsibilities:

* Developed responsive web interfaces using React and JavaScript.
* Built backend services and database integrations.
* Created reusable UI components for internal applications.
* Automated repetitive development and deployment workflows.

Projects

TaskFlow — Project Management Platform
Technologies: React, Node.js, PostgreSQL

* Built a project management platform for small development teams.
* Implemented authentication, project boards, task tracking, and notifications.
* Designed REST APIs and PostgreSQL database schemas.
* Added responsive layouts for desktop and mobile devices.

ShopLite — E-Commerce Application
Technologies: Next.js, TypeScript, MongoDB

* Developed a fictional e-commerce platform with product browsing and shopping cart functionality.
* Implemented search, filtering, and user authentication.
* Created an admin dashboard for managing products and orders.

Education

Bachelor of Science
Computer Science
Westbridge University
2016 – 2020
GPA: 3.7/4.0

Skills

Languages:
JavaScript
TypeScript
Python
Java
SQL

Frontend:
React
Next.js
HTML
CSS
Tailwind CSS

Backend:
Node.js
Express
REST APIs

Databases:
PostgreSQL
MongoDB
MySQL

Tools:
Git
GitHub
Docker
Linux
VS Code

Cloud:
AWS
Vercel

Certifications

AWS Certified Developer – Associate
Amazon Web Services
2024

Meta Front-End Developer Certificate
Meta
2023

JavaScript Algorithms and Data Structures
Code Academy
2022

Languages

English — Fluent
Spanish — Intermediate
French — Basic

Achievements

* Won first place in the fictional Vertex Labs Innovation Challenge.
* Completed more than 250 programming challenges.
* Recognised as Developer of the Quarter at Vertex Labs.

Hobbies

Photography
Cycling
Gaming
Open-source projects
Reading technology blogs

Volunteer Experience

Coding Mentor
Community Tech Club
2021 – 2023

* Mentored beginners learning web development.
* Conducted introductory JavaScript workshops.
* Helped students build their first web applications.

Awards

Developer of the Quarter — Vertex Labs — 2024

Leadership

Technical Lead — Developer Community
2023 – Present

* Coordinated a small team of developers.
* Organised monthly technical workshops.
* Reviewed projects and helped members improve their development practices.
`;

const GEN_MESSAGES = [
  'Reading the career data…',
  'Structuring the right sections…',
  'Writing ATS-optimised bullet points…',
  'Polishing the final details…',
];

const FONTS = [
  { id: 'system', name: 'System sans', css: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif' },
  { id: 'georgia', name: 'Georgia', css: 'Georgia,Cambria,"Times New Roman",serif' },
  { id: 'mono', name: 'Mono', css: '"Courier New",monospace' },
];

const COLOR_PRESETS = ['#2058e8', '#0f766e', '#7c3aed', '#dc2626', '#059669', '#0f172a', '#ea580c', '#db2777'];
const COUNTRIES = ['India', 'United States', 'United Kingdom', 'UAE', 'Canada', 'Germany', 'Australia', 'Singapore'];

type Tab = 'generate' | 'elements' | 'style';

function newId(prefix: string) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function HomeLiveBuilder() {
  const dataRef = useRef<any>(null);
  const [tick, setTick] = useState(0);
  const repaint = () => setTick((t) => t + 1);

  const [tab, setTab] = useState<Tab>('generate');
  const [careerData, setCareerData] = useState(DEMO_CAREER_DATA);
  const [role, setRole] = useState('Senior Software Engineer');
  const [country, setCountry] = useState('India');
  const [templateId, setTemplateId] = useState(TEMPLATES.find((t) => t.id === 'harvard')?.id || TEMPLATES[0].id);
  const [accent, setAccent] = useState('#2058e8');
  const [fontId, setFontId] = useState('system');
  const [scale, setScale] = useState(1);
  const MOBILE_SCALE = 0.9;
  const [autoFit, setAutoFit] = useState(1);
  const canvasScrollRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [genMsgIdx, setGenMsgIdx] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);

  function toast(text: string) {
    const id = Date.now();
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }

  // ---- Wire the same window-scoped handlers the real templates call ----
  useEffect(() => {
    const findSection = (id: string) => (dataRef.current?.sections || []).find((s: any) => s.id === id);
    const findEntry = (sec: any, id: string) => (sec?.entries || []).find((e: any) => e.id === id);

    (window as any).moveSection = (secId: string, dir: number) => {
      const secs = (dataRef.current.sections || []).slice().sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      const idx = secs.findIndex((s: any) => s.id === secId);
      const swapIdx = idx + dir;
      if (idx < 0 || swapIdx < 0 || swapIdx >= secs.length) return;
      const tmp = secs[idx].order; secs[idx].order = secs[swapIdx].order; secs[swapIdx].order = tmp;
      repaint();
    };
    (window as any).deleteSection = (secId: string) => {
      dataRef.current.sections = (dataRef.current.sections || []).filter((s: any) => s.id !== secId);
      repaint();
    };
    (window as any).updateSecTitle = (secId: string, text: string) => { const s = findSection(secId); if (s) s.title = text; };
    (window as any).handleEdit = (kind: string, secId: string, entryId: string, bulletIndex: number, text: string) => {
      if (kind === 'summary') { const s = findSection(secId); if (s) s.summary_text = text; return; }
      const sec = findSection(secId); const en = findEntry(sec, entryId); if (!en) return;
      if (kind === 'title') en.title = text;
      else if (kind === 'subtitle') en.subtitle = text;
      else if (kind === 'date') { const p = text.split('–').map((x: string) => x.trim()); en.date_start = p[0] || ''; en.date_end = p[1] || ''; }
      else if (kind === 'bullet') { en.bullets = en.bullets || []; en.bullets[bulletIndex] = text; }
    };
    // entryHtml's title/subtitle/date/bullet spans carry a `data-edit-field`
    // attribute but no oninput of their own — they rely on the *outer*
    // contenteditable wrapper's oninput (which only gives us the wrapper
    // element, not which field changed). Walk up from the current text
    // selection to find the actual field that was edited, then reuse the
    // same handleEdit() logic already used elsewhere.
    (window as any).handleSectionEntryEdit = (secId: string) => {
      const sel = window.getSelection?.();
      if (!sel || sel.rangeCount === 0) return;
      let node: Node | null = sel.anchorNode;
      let fieldEl: HTMLElement | null = null;
      while (node) {
        if (node instanceof HTMLElement && node.hasAttribute('data-edit-field')) { fieldEl = node; break; }
        node = node.parentNode;
      }
      if (!fieldEl) return;
      const field = fieldEl.getAttribute('data-edit-field') || '';
      const entryEl = fieldEl.closest('[data-entry-id]') as HTMLElement | null;
      const entryId = entryEl?.getAttribute('data-entry-id') || '';
      const bulletIndex = field === 'bullet' ? Number(fieldEl.getAttribute('data-bullet-index')) : -1;
      let text = fieldEl.textContent || '';
      if (field === 'date') text = text.replace(/^[\s·]+/, ''); // strip the leading " · " the span renders inline
      (window as any).handleEdit(field, secId, entryId, bulletIndex, text);
    };
    (window as any).addEntry = (secId: string) => {
      const sec = findSection(secId); if (!sec) return;
      sec.entries = sec.entries || [];
      sec.entries.push({
        id: newId('e'),
        title: 'New Entry Title',
        subtitle: 'Organisation / Context',
        location: '',
        date_start: '2024',
        date_end: 'Present',
        bullets: ['Click to edit — start with a strong action verb'],
      });
      repaint();
    };
    (window as any).addBullet = (secId: string, entryId: string) => {
      const sec = findSection(secId); const en = findEntry(sec, entryId); if (!en) return;
      en.bullets = en.bullets || []; en.bullets.push('New bullet — click to edit'); repaint();
    };
    (window as any).updateSkillGroup = (secId: string, category: string, text: string, field: string) => {
      const sec = findSection(secId); if (!sec) return;
      const g = (sec.skill_groups || []).find((g: any) => g.category === category); if (!g) return;
      if (field === 'cat') g.category = text; else g.skills = text.split(',').map((s: string) => s.trim()).filter(Boolean);
    };
    (window as any).editSkillBarName = (secId: string, i: number, text: string) => { const s = findSection(secId); if (s?.skills?.[i]) s.skills[i].name = text; };
    (window as any).editSkillDotName = (window as any).editSkillBarName;
    (window as any).stepSkillBarLevel = (secId: string, i: number, delta: number) => {
      const s = findSection(secId); if (!s) return; s.skills[i].level = Math.max(0, Math.min(100, (s.skills[i].level || 0) + delta)); repaint();
    };
    (window as any).setSkillBarLevel = (secId: string, i: number, evt: any) => {
      const s = findSection(secId); if (!s) return;
      const rect = evt.currentTarget.getBoundingClientRect();
      const pct = Math.round(((evt.clientX - rect.left) / rect.width) * 20) * 5;
      s.skills[i].level = Math.max(0, Math.min(100, pct)); repaint();
    };
    (window as any).delSkillBar = (secId: string, i: number) => { const s = findSection(secId); s.skills.splice(i, 1); repaint(); };
    (window as any).addSkillBar = (secId: string) => { const s = findSection(secId); s.skills.push({ name: 'New skill', level: 60 }); repaint(); };
    (window as any).setSkillDotLevel = (secId: string, i: number, d: number) => { const s = findSection(secId); s.skills[i].level = d; repaint(); };
    (window as any).delSkillDot = (secId: string, i: number) => { const s = findSection(secId); s.skills.splice(i, 1); repaint(); };
    (window as any).addSkillDot = (secId: string) => { const s = findSection(secId); s.skills.push({ name: 'New skill', level: 3 }); repaint(); };
    (window as any).moveSkillItem = (secId: string, i: number, dir: number) => {
      const s = findSection(secId); const arr = s.skills; const j = i + dir; if (j < 0 || j >= arr.length) return;
      const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; repaint();
    };
    (window as any).editTag = (secId: string, i: number, text: string) => { const s = findSection(secId); s.tags[i] = text; };
    (window as any).delTag = (secId: string, i: number) => { const s = findSection(secId); s.tags.splice(i, 1); repaint(); };
    (window as any).addTag = (secId: string) => { const s = findSection(secId); s.tags.push('New tag'); repaint(); };

    // Table section — none of this was wired before, so add/remove row/col
    // and cell edits silently did nothing.
    (window as any).tableCellEdit = (secId: string, ri: number, ci: number, text: string) => {
      const s = findSection(secId); if (!s?.tableData) return;
      s.tableData.rows[ri][ci] = text;
    };
    (window as any).tableAddRow = (secId: string) => {
      const s = findSection(secId); if (!s?.tableData) return;
      s.tableData.rows.push(new Array(s.tableData.colWidths.length).fill(''));
      repaint();
    };
    (window as any).tableDelRow = (secId: string) => {
      const s = findSection(secId); if (!s?.tableData || s.tableData.rows.length <= 1) return;
      s.tableData.rows.pop();
      repaint();
    };
    (window as any).tableAddCol = (secId: string) => {
      const s = findSection(secId); if (!s?.tableData) return;
      s.tableData.rows.forEach((r: string[]) => r.push(''));
      const n = s.tableData.colWidths.length + 1;
      s.tableData.colWidths = new Array(n).fill(Math.round(100 / n));
      repaint();
    };
    (window as any).tableDelCol = (secId: string) => {
      const s = findSection(secId); if (!s?.tableData || s.tableData.colWidths.length <= 1) return;
      s.tableData.rows.forEach((r: string[]) => r.pop());
      const n = s.tableData.colWidths.length - 1;
      s.tableData.colWidths = new Array(n).fill(Math.round(100 / n));
      repaint();
    };
    (window as any).tableToggleHeader = (secId: string) => {
      const s = findSection(secId); if (!s?.tableData) return;
      s.tableData.hasHeader = !s.tableData.hasHeader;
      repaint();
    };
    (window as any).tableStartResize = (evt: MouseEvent, secId: string, colIndex: number) => {
      const s = findSection(secId); if (!s?.tableData) return;
      const table = (evt.target as HTMLElement)?.closest('table') as HTMLElement | null;
      if (!table) return;
      const startX = evt.clientX;
      const startWidths = [...s.tableData.colWidths];
      const tableWidth = table.clientWidth || 1;
      const onMove = (e: MouseEvent) => {
        const deltaPct = ((e.clientX - startX) / tableWidth) * 100;
        const w = [...startWidths];
        w[colIndex] = Math.max(8, startWidths[colIndex] + deltaPct);
        w[colIndex + 1] = Math.max(8, startWidths[colIndex + 1] - deltaPct);
        s.tableData.colWidths = w;
        repaint();
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };

    // Bullet-list section — same story, add/edit/delete/move/enhance were all missing.
    (window as any).editBulletListItem = (secId: string, i: number, text: string) => {
      const s = findSection(secId); if (!s) return;
      s.bullets = s.bullets || []; s.bullets[i] = text;
    };
    (window as any).addBulletListItem = (secId: string) => {
      const s = findSection(secId); if (!s) return;
      s.bullets = s.bullets || []; s.bullets.push('New bullet point');
      repaint();
    };
    (window as any).deleteBulletListItem = (secId: string, i: number) => {
      const s = findSection(secId); if (!s?.bullets) return;
      s.bullets.splice(i, 1); repaint();
    };
    (window as any).moveBulletListItem = (secId: string, i: number, dir: number) => {
      const s = findSection(secId); if (!s?.bullets) return;
      const j = i + dir; if (j < 0 || j >= s.bullets.length) return;
      const tmp = s.bullets[i]; s.bullets[i] = s.bullets[j]; s.bullets[j] = tmp; repaint();
    };
    (window as any).enhanceBulletListItem = () => toast('AI bullet enhancement needs a free QuantumCV account');

    (window as any).enhanceBullet = () => toast('AI bullet enhancement needs a free QuantumCV account');
    (window as any).enhanceSkillItem = () => toast('AI skill suggestions need a free QuantumCV account');
    (window as any).triggerPhotoUpload = () => toast('Photo upload needs a free QuantumCV account');
    (window as any).scheduleAutoSave = () => {};

    return () => {
      // Don't leave these lying around for the real /builder page's own
      // engine.ts to collide with after a client-side navigation.
      ['moveSection', 'deleteSection', 'updateSecTitle', 'handleEdit', 'handleSectionEntryEdit', 'addEntry', 'addBullet', 'updateSkillGroup',
        'editSkillBarName', 'editSkillDotName', 'stepSkillBarLevel', 'setSkillBarLevel', 'delSkillBar', 'addSkillBar',
        'setSkillDotLevel', 'delSkillDot', 'addSkillDot', 'moveSkillItem', 'editTag', 'delTag', 'addTag',
        'tableCellEdit', 'tableAddRow', 'tableDelRow', 'tableAddCol', 'tableDelCol', 'tableToggleHeader', 'tableStartResize',
        'editBulletListItem', 'addBulletListItem', 'deleteBulletListItem', 'moveBulletListItem', 'enhanceBulletListItem',
        'enhanceBullet', 'enhanceSkillItem', 'triggerPhotoUpload', 'scheduleAutoSave'].forEach((k) => { delete (window as any)[k]; });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fit the fixed 210mm (~794px) page to whatever width the canvas
  // panel actually has (phones, narrow splits, etc). Without this the page
  // just overflows its rounded/overflow-hidden wrapper and gets clipped.
  useEffect(() => {
    const el = canvasScrollRef.current;
    if (!el) return;
    const PAGE_PX = 794; // 210mm at 96dpi
    const update = () => {
      const horizontalPadding = window.innerWidth < 640 ? 32 : 64; // p-4 vs sm:p-8
      const usable = el.clientWidth - horizontalPadding;
      const fit = usable > 0 ? usable / PAGE_PX : 1;
      setAutoFit(Math.max(0.28, Math.min(1, fit)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Mobile has no text-size picker — lock it to a fixed, sane 90% instead
  // of inheriting whatever the desktop default/last-picked value was.
  useEffect(() => {
    if (window.innerWidth < 640) setScale(MOBILE_SCALE);
  }, []);

  function runGenerate() {
    if (generating) return;
    setGenerating(true);
    setGenMsgIdx(0);
    const interval = setInterval(() => setGenMsgIdx((i) => Math.min(i + 1, GEN_MESSAGES.length - 1)), 480);
    setTimeout(() => {
      clearInterval(interval);
      if (looksParseable(careerData)) {
        dataRef.current = buildResumeFromText(careerData, { role, country, accentColor: accent });
      } else {
        dataRef.current = buildResumeFromText(DEMO_CAREER_DATA, { role, country, accentColor: accent });
        toast("Couldn't find recognisable sections — used the sample data instead");
      }
      setGenerating(false);
      repaint();
      setTab('style');
      setMobilePanelOpen(false);
    }, 2000);
  }

  function addSection(type: string) {
    if (!dataRef.current) { toast('Generate a resume first'); return; }
    const def = (SECTION_DEFS as any)[type]; if (!def) return;
    const sec = def();
    const maxOrder = Math.max(0, ...(dataRef.current.sections || []).map((s: any) => s.order || 0));
    sec.order = maxOrder + 1;
    dataRef.current.sections.push(sec);
    repaint();
  }

  const tpl = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
  const font = FONTS.find((f) => f.id === fontId)!;
  const sortedSections = dataRef.current ? (dataRef.current.sections || []).slice().sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) : [];
  const categories = Array.from(new Set(TEMPLATES.map((t) => t.category)));

  return (
    <div className="relative rounded-3xl border border-[var(--border)] bg-[var(--card)] overflow-hidden h-[600px] md:h-[750px] lg:h-[900px] xl:h-[980px]">
      {/* Mobile drawer backdrop */}
      {mobilePanelOpen && (
        <div className="absolute inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobilePanelOpen(false)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-0 h-full w-full">
        {/* ---------- Sidebar — bottom sheet on mobile, static side column on desktop ---------- */}
        <div
          className={`absolute inset-x-0 bottom-0 z-50 max-h-[82%] rounded-t-2xl border-t shadow-2xl transition-transform duration-300 ease-out
            lg:static lg:z-auto lg:inset-auto lg:max-h-none lg:rounded-none lg:border-t-0 lg:border-r lg:shadow-none lg:translate-y-0
            border-[var(--border)] bg-[var(--card)] flex flex-col overflow-y-auto
            ${mobilePanelOpen ? 'translate-y-0' : 'translate-y-full'}`}
        >
          <div className="flex justify-center pt-2 pb-1 lg:hidden shrink-0">
            <div className="w-9 h-1 rounded-full bg-[var(--border)]" />
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 lg:py-3 lg:hidden border-b border-[var(--border)] shrink-0">
            <span className="text-sm font-bold">Edit resume</span>
            <button onClick={() => setMobilePanelOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-subtle)] text-[var(--fg-muted)]">
              <X size={16} />
            </button>
          </div>
          <div className="flex border-b border-[var(--border)] shrink-0">
            {(['generate', 'elements', 'style'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wide transition-colors border-b-2 ${
                  tab === t ? 'text-[var(--accent)] border-[var(--accent)]' : 'text-[var(--fg-muted)] border-transparent hover:text-[var(--fg)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {tab === 'generate' && (
              <>
                <label className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide">Career data</label>
                <textarea
                  value={careerData}
                  onChange={(e) => setCareerData(e.target.value)}
                  rows={9}
                  className="mt-1.5 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-[12.5px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide">Target role</label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide">Country</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    >
                      {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <button
                  onClick={runGenerate}
                  disabled={generating}
                  className="mt-4 w-full rounded-lg bg-[var(--accent)] text-white font-semibold py-2.5 text-sm hover:bg-[var(--accent-hover)] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                >
                  {generating && <Loader2 size={15} className="animate-spin" />}
                  {generating ? 'Generating…' : dataRef.current ? 'Regenerate resume' : 'Generate resume with AI'}
                </button>
                <p className="mt-2.5 text-[11px] text-[var(--fg-muted)] leading-relaxed">
                  Runs the same offline parser your real builder falls back to — nothing is sent to a server.
                </p>
              </>
            )}

            {tab === 'elements' && (
              <>
                <label className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide">Add section</label>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {SECTION_TYPE_LABELS.map((s) => (
                    <button
                      key={s.type}
                      onClick={() => addSection(s.type)}
                      className="text-[11px] rounded-lg border border-[var(--border)] px-2 py-2 hover:border-[var(--accent)] hover:bg-[var(--accent)]/10 text-left flex items-center gap-1.5"
                    >
                      <span>{s.icon}</span><span className="truncate">{s.label}</span>
                    </button>
                  ))}
                </div>
                <label className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide mt-5 block">Your sections</label>
                {!dataRef.current ? (
                  <p className="mt-2 text-xs text-[var(--fg-muted)]">Generate a resume first to manage its sections.</p>
                ) : (
                  <div className="mt-1.5 space-y-1.5">
                    {sortedSections.map((s: any, i: number) => (
                      <div key={s.id} className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-2.5 py-2 text-xs font-semibold">
                        <span className="flex-1 truncate">{s.title || s.type}</span>
                        <button disabled={i === 0} onClick={() => (window as any).moveSection(s.id, -1)} className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center disabled:opacity-30 hover:bg-[var(--bg-subtle)]"><ChevronUp size={12} /></button>
                        <button disabled={i === sortedSections.length - 1} onClick={() => (window as any).moveSection(s.id, 1)} className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center disabled:opacity-30 hover:bg-[var(--bg-subtle)]"><ChevronDown size={12} /></button>
                        <button onClick={() => (window as any).deleteSection(s.id)} className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center hover:bg-red-50 hover:border-red-300 hover:text-red-500"><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-4 text-[11px] text-[var(--fg-muted)] leading-relaxed">Hover any section on the resume itself for the same move/delete controls.</p>
              </>
            )}

            {tab === 'style' && (
              <>
                <label className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide">Accent color</label>
                <div className="mt-1.5 flex flex-wrap gap-2 mb-3">
                  {COLOR_PRESETS.map((hex) => (
                    <button
                      key={hex}
                      onClick={() => { setAccent(hex); if (dataRef.current) { dataRef.current.layout_config = dataRef.current.layout_config || {}; dataRef.current.layout_config.accent_color = hex; } }}
                      className="w-7 h-7 rounded-full"
                      style={{ background: hex, boxShadow: accent === hex ? '0 0 0 2px var(--fg), 0 0 0 4px var(--bg)' : '0 0 0 1px var(--border)' }}
                    />
                  ))}
                </div>
                <label className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide">Font</label>
                <div className="mt-1.5 mb-3 space-y-1">
                  {FONTS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFontId(f.id)}
                      style={{ fontFamily: f.css }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${fontId === f.id ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-bold' : 'hover:bg-[var(--bg-subtle)]'}`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
                <label className="hidden sm:block text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide">Text size</label>
                <div className="hidden sm:flex mt-1.5 gap-1.5">
                  {[0.9, 1, 1.1, 1.2].map((s) => (
                    <button
                      key={s}
                      onClick={() => setScale(s)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold ${scale === s ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] hover:bg-[var(--bg-subtle)]'}`}
                    >
                      {Math.round(s * 100)}%
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ---------- Canvas ---------- */}
        <div className="relative bg-[var(--bg-subtle)] flex flex-col min-h-0 h-full">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--card)] shrink-0">
            <span className="text-xs font-semibold text-[var(--fg-muted)] truncate">{tpl.name}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setDrawerOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--bg-subtle)]">
                <LayoutTemplate size={13} /> All templates
              </button>
              <Link href="/login" onClick={() => toast('Sign up to export your real resume')} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] text-white px-3 py-1.5 text-xs font-semibold hover:bg-[var(--accent-hover)]">
                <Download size={13} /> Export
              </Link>
            </div>
          </div>

          <div ref={canvasScrollRef} className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start pt-8">
            {!dataRef.current && !generating && (
              <div className="self-center max-w-xs text-center">
                <Sparkles size={22} className="text-[var(--accent)] mx-auto mb-3" />
                <p className="text-sm text-[var(--fg-muted)] hidden lg:block">
                  Hit &ldquo;Generate resume with AI&rdquo; on the left to see this canvas come alive — move sections, swap templates, change colors, all live.
                </p>
                <p className="text-sm text-[var(--fg-muted)] lg:hidden">
                  Tap below to see this canvas come alive — move sections, swap templates, change colors, all live.
                </p>
                {/* Mobile: generate straight from the canvas — no need to open the edit sheet first. */}
                <button
                  onClick={runGenerate}
                  className="lg:hidden mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-white font-semibold px-5 py-2.5 text-sm hover:bg-[var(--accent-hover)] active:scale-[0.97] transition-all"
                >
                  <Sparkles size={15} /> Generate resume with AI
                </button>
                <button
                  onClick={() => setMobilePanelOpen(true)}
                  className="lg:hidden mt-3 block mx-auto text-xs font-semibold text-[var(--fg-muted)] underline underline-offset-2"
                >
                  Use my own career data instead
                </button>
              </div>
            )}
            {generating && (
              <div className="self-center text-center px-6">
                <div className="relative w-14 h-14 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-full border-2 border-[var(--accent)]/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--accent)] animate-spin" />
                  <Sparkles size={20} className="absolute inset-0 m-auto text-[var(--accent)]" />
                </div>
                <p className="text-sm font-semibold mb-1">Generating your resume…</p>
                <p className="text-xs text-[var(--fg-muted)]">{GEN_MESSAGES[genMsgIdx]}</p>
              </div>
            )}
            {dataRef.current && !generating && (
              <div className="bg-white text-black shadow-2xl rounded-sm w-[210mm] shrink-0 origin-top" style={{ fontFamily: font.css, zoom: (autoFit * scale) as any }}>
                <div
                  key={tick}
                  className="p-[15mm] resume-live-canvas"
                  dangerouslySetInnerHTML={{ __html: tpl.render(dataRef.current, accent) }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile floating "Edit" button — opens the bottom sheet. Only shown
          once a resume actually exists; before that, the canvas's own
          "Generate resume with AI" button is the primary action. */}
      <button
        onClick={() => setMobilePanelOpen(true)}
        className="lg:hidden absolute bottom-4 left-4 z-30 inline-flex items-center gap-2 rounded-full bg-[var(--fg)] text-[var(--bg)] shadow-lg px-4 py-2.5 text-xs font-semibold"
        style={{
          opacity: mobilePanelOpen || (!dataRef.current && !generating) ? 0 : 1,
          pointerEvents: mobilePanelOpen || (!dataRef.current && !generating) ? 'none' : 'auto',
        }}
      >
        <SlidersHorizontal size={14} /> Edit
      </button>

      {/* ---------- Template drawer ---------- */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[80] flex justify-end" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative w-full max-w-[560px] h-full bg-[var(--bg)] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <span className="text-sm font-extrabold flex items-center gap-2"><Palette size={16} className="text-[var(--accent)]" /> Choose a template</span>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-[var(--bg-subtle)]"><X size={15} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {categories.map((cat) => (
                <div key={cat} className="mb-6">
                  <div className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[var(--fg-muted)] mb-2.5">{cat}</div>
                  <div className="grid grid-cols-3 gap-3">
                    {TEMPLATES.filter((t) => t.category === cat).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => { setTemplateId(t.id); setDrawerOpen(false); toast(`Switched to ${t.name}`); }}
                        className={`rounded-lg overflow-hidden border-2 text-left transition-colors ${templateId === t.id ? 'border-[var(--accent)]' : 'border-[var(--border)] hover:border-[var(--accent)]/50'}`}
                      >
                        <div className="relative h-[104px] bg-white overflow-hidden">
                          <div
                            className="absolute top-1.5 left-1/2 -translate-x-1/2 pointer-events-none qcv-preview"
                            style={{ width: '210mm', transformOrigin: 'top center', transform: 'scale(0.13)' }}
                            dangerouslySetInnerHTML={{ __html: t.render(dataRef.current || PREVIEW_DATA, accent) }}
                          />
                        </div>
                        <div className="px-2 py-1.5 bg-[var(--bg-subtle)]">
                          <p className="text-[10.5px] font-bold truncate">{t.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------- Toasts ---------- */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[90] flex flex-col items-center gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="bg-[#0f172a] text-white text-xs px-4 py-2.5 rounded-lg shadow-xl">{t.text}</div>
        ))}
      </div>

      <style jsx global>{`
        .resume-live-canvas [data-sec-id] { position: relative; }
        .resume-live-canvas [data-sec-id]:hover .sec-controls { opacity: 1; }
        .resume-live-canvas [data-sec-id]:hover .sec-drag-handle { opacity: 1; }
        .resume-live-canvas .sec-controls { position: absolute; right: -38px; top: 0; display: flex; flex-direction: column; gap: 3px; opacity: 0; transition: opacity .15s ease; }
        .resume-live-canvas .sec-ctrl-btn { width: 26px; height: 26px; border-radius: 6px; border: 1.5px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: .65rem; box-shadow: 0 1px 2px rgba(0,0,0,.04); }
        .resume-live-canvas .sec-ctrl-btn:hover { background: #f1f5f9; color: #0f172a; }
        .resume-live-canvas .sec-ctrl-btn.del:hover { background: #fef2f2; border-color: #ef4444; color: #ef4444; }
        .resume-live-canvas .sec-drag-handle { position: absolute; left: -26px; top: 14px; color: #cbd5e1; opacity: 0; transition: opacity .15s ease; padding: 4px; }
        .resume-live-canvas .bullet-actions { display: none; gap: 3px; align-items: center; flex-shrink: 0; }
        .resume-live-canvas .bullet-enhance-btn { font-size: .62rem; padding: 2px 6px; border: 1.5px solid #bfdbfe; border-radius: 5px; background: #eff6ff; color: #2563eb; cursor: pointer; font-weight: 600; }
        .resume-live-canvas .bullet-enhance-btn:hover { background: #2563eb; color: #fff; }
        .resume-live-canvas .skill-enhance-btn { font-size: .6rem; padding: 1px 5px; border: 1px solid #e2e8f0; border-radius: 5px; background: none; color: #94a3b8; cursor: pointer; }
        .resume-live-canvas .skill-enhance-btn:hover { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
        .resume-live-canvas .add-item-btn { width: 100%; padding: 6px; border: 1.5px dashed #cbd5e1; border-radius: 6px; background: transparent; color: #94a3b8; font-size: .76rem; cursor: pointer; margin-top: 4px; }
        .resume-live-canvas .add-item-btn:hover { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
        .resume-live-canvas .rp-sbar-item { margin-bottom: 5px; }
        .resume-live-canvas .rp-sbar-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
        .resume-live-canvas .rp-sbar-name { font-size: .78rem; font-weight: 600; outline: none; cursor: text; }
        .resume-live-canvas .rp-sbar-right { display: flex; align-items: center; gap: 5px; }
        .resume-live-canvas .rp-sbar-pct { font-size: .65rem; color: #94a3b8; font-family: monospace; }
        .resume-live-canvas .rp-sbar-track { height: 5px; background: #e2e8f0; border-radius: 99px; cursor: pointer; overflow: hidden; }
        .resume-live-canvas .rp-sbar-fill { height: 100%; border-radius: 99px; }
        .resume-live-canvas .rp-sdot-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
        .resume-live-canvas .rp-sdot-name { font-size: .78rem; font-weight: 600; flex: 1; outline: none; cursor: text; }
        .resume-live-canvas .rp-dot { width: 9px; height: 9px; border-radius: 50%; cursor: pointer; border: 1.5px solid #cbd5e1; background: transparent; display: inline-block; }
        .resume-live-canvas .rp-dot.filled { background: currentColor; border-color: currentColor; }
        .resume-live-canvas .skill-step-btn, .resume-live-canvas .skill-move-btn { font-size: .6rem; width: 15px; height: 15px; line-height: 1; border: 1px solid #e2e8f0; border-radius: 4px; background: none; color: #64748b; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 0; }
        .resume-live-canvas .skill-step-btn:hover, .resume-live-canvas .skill-move-btn:hover { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
        .resume-live-canvas .bullet-list > div:nth-child(n + 7) { display: none; }
        .resume-live-canvas .add-item-row { display: none; }
        .resume-live-canvas [data-sec-id]:hover .add-item-row { display: block; }

        /* Template drawer thumbnails are pure previews, never edited —
           hide the editor chrome outright instead of relying on :hover
           (which a tiny scaled-down thumbnail will never trigger anyway,
           but the always-visible "+ bullet"/"+ Add Entry" buttons need
           an explicit rule). */
        .qcv-preview .sec-controls, .qcv-preview .sec-drag-handle, .qcv-preview .bullet-actions,
        .qcv-preview .add-item-btn, .qcv-preview .add-item-row, .qcv-preview .bullet-enhance-btn, .qcv-preview .skill-enhance-btn,
        .qcv-preview .skill-step-btn, .qcv-preview .skill-move-btn { display: none !important; }
        .qcv-preview .bullet-list > div:nth-child(n + 7) { display: none !important; }
        @media print {
          .resume-live-canvas .sec-controls, .resume-live-canvas .sec-drag-handle, .resume-live-canvas .bullet-actions,
          .resume-live-canvas .add-item-btn, .resume-live-canvas .add-item-row, .resume-live-canvas .bullet-enhance-btn,
          .resume-live-canvas .skill-enhance-btn, .resume-live-canvas .skill-step-btn, .resume-live-canvas .skill-move-btn { display: none !important; }
          .resume-live-canvas .bullet-list > div:nth-child(n + 7) { display: none !important; }
          [style*='zoom'] { zoom: 1 !important; }
        }
      `}</style>
    </div>
  );
}