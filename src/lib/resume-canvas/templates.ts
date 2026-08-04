/**
 * src/lib/resume-canvas/templates.ts
 *
 * All 30 resume templates from the original qcv app:
 *  - 10 from static/js/templates.js   (classic-clean … gradient-banner)
 *  - 20 from static/js/templatejs.js  (classic-centered … compact-dense)
 *
 * Both sets are ported faithfully (same visual logic, same section
 * dispatch), unified under one schema: { id, name, category, ats, render }.
 * The templates.js set didn't originally have category/ats metadata, so
 * reasonable values are assigned here for consistency in the template
 * gallery UI.
 */
import {
  esc,
  contacts,
  photoEl,
  secHead,
  secCtrl,
  entryHtml,
  renderSection,
  wrapSec,
  allSections,
  sideContent,
  editableName,
  editableRole,
  AnyData,
} from './sections';

export interface ResumeTemplate {
  id: string;
  name: string;
  category: string;
  ats: number;
  desc: string;
  premium: boolean;
  render: (data: AnyData, ac: string) => string;
}

// ─────────────────────────────────────────────────────────
// SET 1 — from templates.js (10 templates)
// ─────────────────────────────────────────────────────────

const SET_1: Omit<ResumeTemplate, 'premium'>[] = [
  {
    id: 'classic-clean',
    name: 'Classic Clean',
    category: 'Standard',
    ats: 97,
    desc: 'Simple single column, safe for every ATS',
    render(data, ac) {
      const sorted = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      const secs = sorted
        .map((sec: AnyData) =>
          sec.type === 'divider'
            ? `<div data-sec-id="${sec.id}" style="position:relative;margin:4px 0">${secCtrl(sec.id)}${renderSection(sec, ac)}</div>`
            : `<div data-sec-id="${sec.id}" style="position:relative;margin-bottom:14px">
          ${secCtrl(sec.id)}
          ${secHead(sec.title, ac, sec.id)}
          ${renderSection(sec, ac)}
        </div>`
        )
        .join('');

      return `
        <div style="margin-bottom:18px;padding-bottom:14px;border-bottom:2px solid ${ac}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
            <div style="flex:1;min-width:0">
              <div contenteditable="true" spellcheck="false" style="font-size:1.5rem;font-weight:800;color:#0f172a;letter-spacing:-0.03em;outline:none;cursor:text;line-height:1.1"
                oninput="typeof window.currentData!=='undefined'&&(window.currentData.name=this.textContent,scheduleAutoSave())"
              >${esc(data.name)}</div>
              <div contenteditable="true" spellcheck="false" style="font-size:0.78rem;color:${ac};font-weight:700;letter-spacing:0.06em;text-transform:uppercase;margin-top:3px;outline:none;cursor:text"
                oninput="typeof window.currentData!=='undefined'&&(window.currentData.target_role=this.textContent,scheduleAutoSave())"
              >${esc(data.target_role || '')}</div>
              <div style="font-size:0.72rem;color:#475569;margin-top:5px;font-family:monospace">${contacts(data)}</div>
            </div>
            ${photoEl(data)}
          </div>
        </div>
        ${secs}`;
    },
  },
  {
    id: 'sidebar-split',
    name: 'Sidebar Split',
    category: 'Two Column',
    ats: 93,
    desc: 'Colored header band, two-column body',
    render(data, ac) {
      const sorted = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      const left = sorted.filter((_: AnyData, i: number) => i % 3 === 0);
      const right = sorted.filter((_: AnyData, i: number) => i % 3 !== 0);

      const renderCol = (secs: AnyData[]) =>
        secs
          .map(
            (sec) => `
        <div data-sec-id="${sec.id}" style="position:relative;margin-bottom:14px">
          ${secCtrl(sec.id)}
          ${secHead(sec.title, ac, sec.id)}
          ${renderSection(sec, ac)}
        </div>`
          )
          .join('');

      return `
        <div style="background:${ac};padding:22px 20px;margin:-1px -1px 0;display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:16px">
          <div>
            <div contenteditable="true" spellcheck="false" style="font-size:1.55rem;font-weight:800;color:white;letter-spacing:-0.03em;outline:none;cursor:text;line-height:1.1"
              oninput="typeof window.currentData!=='undefined'&&(window.currentData.name=this.textContent,scheduleAutoSave())"
            >${esc(data.name)}</div>
            <div contenteditable="true" spellcheck="false" style="font-size:0.8rem;color:rgba(255,255,255,0.8);font-weight:600;letter-spacing:0.04em;margin-top:4px;outline:none;cursor:text"
              oninput="typeof window.currentData!=='undefined'&&(window.currentData.target_role=this.textContent,scheduleAutoSave())"
            >${esc(data.target_role || '')}</div>
          </div>
          ${photoEl(data, 'border-color:rgba(255,255,255,0.5)')}
        </div>
        <div style="font-size:0.7rem;color:#475569;margin-bottom:14px;padding-bottom:10px;border-bottom:1.5px solid #e2e8f0;font-family:monospace">${contacts(data)}</div>
        <div style="display:grid;grid-template-columns:180px 1fr;gap:20px">
          <div>${renderCol(left)}</div>
          <div style="border-left:2px solid ${ac}22;padding-left:18px">${renderCol(right)}</div>
        </div>`;
    },
  },
  {
    id: 'minimal-line',
    name: 'Minimal Line',
    category: 'Standard',
    ats: 96,
    desc: 'Label-left, content-right rows',
    render(data, ac) {
      const sorted = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      const secs = sorted
        .map(
          (sec: AnyData) => `
        <div data-sec-id="${sec.id}" style="position:relative;display:grid;grid-template-columns:90px 1fr;gap:16px;margin-bottom:14px;align-items:start">
          ${secCtrl(sec.id)}
          <div style="font-size:0.62rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${ac};padding-top:1px;text-align:right;border-right:2px solid ${ac}33;padding-right:10px">${esc(sec.title)}</div>
          <div>${renderSection(sec, ac)}</div>
        </div>`
        )
        .join('');

      return `
        <div style="margin-bottom:20px">
          <div contenteditable="true" spellcheck="false" style="font-size:1.65rem;font-weight:800;color:#0f172a;letter-spacing:-0.04em;outline:none;cursor:text"
            oninput="typeof window.currentData!=='undefined'&&(window.currentData.name=this.textContent,scheduleAutoSave())"
          >${esc(data.name)}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
            <div contenteditable="true" spellcheck="false" style="font-size:0.78rem;color:${ac};font-weight:700;letter-spacing:0.05em;outline:none;cursor:text"
              oninput="typeof window.currentData!=='undefined'&&(window.currentData.target_role=this.textContent,scheduleAutoSave())"
            >${esc(data.target_role || '')}</div>
            <div style="font-size:0.7rem;color:#475569;font-family:monospace">${contacts(data, ' | ')}</div>
          </div>
          <div style="height:2px;background:${ac};margin-top:10px"></div>
        </div>
        ${secs}`;
    },
  },
  {
    id: 'bold-header',
    name: 'Bold Header',
    category: 'Header Bold',
    ats: 94,
    desc: 'Gradient header banner, bold section markers',
    render(data, ac) {
      const sorted = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      const secs = sorted
        .map(
          (sec: AnyData) => `
        <div data-sec-id="${sec.id}" style="position:relative;margin-bottom:14px">
          ${secCtrl(sec.id)}
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <div style="width:4px;height:16px;background:${ac};border-radius:2px;flex-shrink:0"></div>
            <div contenteditable="true" spellcheck="false"
              style="font-size:0.72rem;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:#0f172a;outline:none;cursor:text"
              oninput="typeof updateSecTitle!=='undefined'&&updateSecTitle('${sec.id}',this.textContent)"
            >${esc(sec.title)}</div>
          </div>
          ${renderSection(sec, ac)}
        </div>`
        )
        .join('');

      return `
        <div style="background:linear-gradient(135deg,${ac} 0%,${ac}cc 100%);padding:26px 24px;margin:-1px;margin-bottom:18px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div contenteditable="true" spellcheck="false" style="font-size:1.6rem;font-weight:900;color:white;letter-spacing:-0.04em;outline:none;cursor:text;line-height:1.05"
                oninput="typeof window.currentData!=='undefined'&&(window.currentData.name=this.textContent,scheduleAutoSave())"
              >${esc(data.name)}</div>
              <div contenteditable="true" spellcheck="false" style="font-size:0.82rem;color:rgba(255,255,255,0.85);font-weight:500;margin-top:5px;outline:none;cursor:text"
                oninput="typeof window.currentData!=='undefined'&&(window.currentData.target_role=this.textContent,scheduleAutoSave())"
              >${esc(data.target_role || '')}</div>
              <div style="font-size:0.7rem;color:rgba(255,255,255,0.7);margin-top:8px;font-family:monospace">${contacts(data)}</div>
            </div>
            ${photoEl(data, 'border-color:rgba(255,255,255,0.5)')}
          </div>
        </div>
        ${secs}`;
    },
  },
  {
    id: 'elegant-serif',
    name: 'Elegant Serif',
    category: 'Standard',
    ats: 95,
    desc: 'Centered serif header, understated rules',
    render(data, ac) {
      const sorted = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      const secs = sorted
        .map(
          (sec: AnyData) => `
        <div data-sec-id="${sec.id}" style="position:relative;margin-bottom:16px">
          ${secCtrl(sec.id)}
          <div contenteditable="true" spellcheck="false"
            style="font-family:Georgia,serif;font-size:0.7rem;font-weight:700;text-transform:uppercase;
              letter-spacing:0.18em;color:${ac};margin-bottom:4px;outline:none;cursor:text;border-bottom:0.5px solid ${ac}44;padding-bottom:3px"
            oninput="typeof updateSecTitle!=='undefined'&&updateSecTitle('${sec.id}',this.textContent)"
          >${esc(sec.title)}</div>
          ${renderSection(sec, ac)}
        </div>`
        )
        .join('');

      return `
        <div style="text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid ${ac}33">
          ${photoEl(data, 'margin:0 auto 10px')}
          <div contenteditable="true" spellcheck="false"
            style="font-family:Georgia,serif;font-size:1.75rem;font-weight:700;color:#0f172a;letter-spacing:-0.01em;outline:none;cursor:text"
            oninput="typeof window.currentData!=='undefined'&&(window.currentData.name=this.textContent,scheduleAutoSave())"
          >${esc(data.name)}</div>
          <div contenteditable="true" spellcheck="false"
            style="font-size:0.8rem;color:${ac};font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin-top:5px;outline:none;cursor:text"
            oninput="typeof window.currentData!=='undefined'&&(window.currentData.target_role=this.textContent,scheduleAutoSave())"
          >${esc(data.target_role || '')}</div>
          <div style="font-size:0.71rem;color:#475569;margin-top:7px;font-family:monospace">${contacts(data)}</div>
        </div>
        ${secs}`;
    },
  },
  {
    id: 'dark-accent',
    name: 'Dark Accent',
    category: 'Header Bold',
    ats: 92,
    desc: 'Charcoal header, accent-colored section labels',
    render(data, ac) {
      const sorted = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      const secs = sorted
        .map(
          (sec: AnyData) => `
        <div data-sec-id="${sec.id}" style="position:relative;margin-bottom:14px">
          ${secCtrl(sec.id)}
          <div style="background:#0f172a;padding:3px 8px;border-left:3px solid ${ac};margin-bottom:7px;display:inline-block;min-width:80px">
            <span contenteditable="true" spellcheck="false"
              style="font-size:0.62rem;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:white;outline:none;cursor:text"
              oninput="typeof updateSecTitle!=='undefined'&&updateSecTitle('${sec.id}',this.textContent)"
            >${esc(sec.title)}</span>
          </div>
          ${renderSection(sec, ac)}
        </div>`
        )
        .join('');

      return `
        <div style="background:#0f172a;padding:24px;margin:-1px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div contenteditable="true" spellcheck="false" style="font-size:1.55rem;font-weight:900;color:white;letter-spacing:-0.04em;outline:none;cursor:text"
              oninput="typeof window.currentData!=='undefined'&&(window.currentData.name=this.textContent,scheduleAutoSave())"
            >${esc(data.name)}</div>
            <div style="height:2px;background:${ac};width:60px;margin:6px 0"></div>
            <div contenteditable="true" spellcheck="false" style="font-size:0.78rem;color:${ac};font-weight:700;letter-spacing:0.04em;outline:none;cursor:text"
              oninput="typeof window.currentData!=='undefined'&&(window.currentData.target_role=this.textContent,scheduleAutoSave())"
            >${esc(data.target_role || '')}</div>
            <div style="font-size:0.7rem;color:rgba(255,255,255,0.55);margin-top:8px;font-family:monospace">${contacts(data)}</div>
          </div>
          ${photoEl(data)}
        </div>
        ${secs}`;
    },
  },
  {
    id: 'compact-pro',
    name: 'Compact Pro',
    category: 'Standard',
    ats: 96,
    desc: 'Tight vertical rhythm, professional split header',
    render(data, ac) {
      const sorted = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      const secs = sorted
        .map(
          (sec: AnyData) => `
        <div data-sec-id="${sec.id}" style="position:relative;margin-bottom:10px">
          ${secCtrl(sec.id)}
          ${secHead(sec.title, ac, sec.id)}
          ${renderSection({ ...sec }, ac)}
        </div>`
        )
        .join('');

      return `
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:8px;padding-bottom:8px;border-bottom:2px solid ${ac}">
          <div>
            <div contenteditable="true" spellcheck="false" style="font-size:1.3rem;font-weight:800;color:#0f172a;letter-spacing:-0.03em;outline:none;cursor:text;line-height:1.1"
              oninput="typeof window.currentData!=='undefined'&&(window.currentData.name=this.textContent,scheduleAutoSave())"
            >${esc(data.name)}</div>
            <div contenteditable="true" spellcheck="false" style="font-size:0.72rem;color:${ac};font-weight:700;margin-top:2px;outline:none;cursor:text"
              oninput="typeof window.currentData!=='undefined'&&(window.currentData.target_role=this.textContent,scheduleAutoSave())"
            >${esc(data.target_role || '')}</div>
          </div>
          <div style="font-size:0.67rem;color:#475569;text-align:right;font-family:monospace;line-height:1.7">${contacts(data, '<br>')}</div>
        </div>
        ${secs}`;
    },
  },
  {
    id: 'two-column',
    name: 'Two Column',
    category: 'Two Column',
    ats: 91,
    desc: 'Colored header, content split into two even columns',
    render(data, ac) {
      const sorted = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      const mid = Math.ceil(sorted.length / 2);
      const left = sorted.slice(0, mid);
      const right = sorted.slice(mid);

      const col = (secs: AnyData[]) =>
        secs
          .map(
            (sec) => `
        <div data-sec-id="${sec.id}" style="position:relative;margin-bottom:14px">
          ${secCtrl(sec.id)}
          ${secHead(sec.title, ac, sec.id)}
          ${renderSection(sec, ac)}
        </div>`
          )
          .join('');

      return `
        <div style="background:${ac};padding:22px 20px;margin:-1px;margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
            <div>
              <div contenteditable="true" spellcheck="false" style="font-size:1.55rem;font-weight:800;color:white;letter-spacing:-0.03em;outline:none;cursor:text"
                oninput="typeof window.currentData!=='undefined'&&(window.currentData.name=this.textContent,scheduleAutoSave())"
              >${esc(data.name)}</div>
              <div contenteditable="true" spellcheck="false" style="font-size:0.78rem;color:rgba(255,255,255,0.85);font-weight:500;margin-top:4px;outline:none;cursor:text"
                oninput="typeof window.currentData!=='undefined'&&(window.currentData.target_role=this.textContent,scheduleAutoSave())"
              >${esc(data.target_role || '')}</div>
              <div style="font-size:0.7rem;color:rgba(255,255,255,0.65);margin-top:8px;font-family:monospace">${contacts(data)}</div>
            </div>
            ${photoEl(data)}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div>${col(left)}</div>
          <div>${col(right)}</div>
        </div>`;
    },
  },
  {
    id: 'boxed',
    name: 'Boxed Sections',
    category: 'Creative',
    ats: 90,
    desc: 'Each section in its own bordered box',
    render(data, ac) {
      const sorted = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      const secs = sorted
        .map(
          (sec: AnyData) => `
        <div data-sec-id="${sec.id}" style="position:relative;margin-bottom:10px;border:1.5px solid ${ac}22;border-radius:6px;padding:12px 14px">
          ${secCtrl(sec.id)}
          ${secHead(sec.title, ac, sec.id)}
          ${renderSection(sec, ac)}
        </div>`
        )
        .join('');

      return `
        <div style="border:2px solid ${ac};border-radius:8px;padding:20px;margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
            <div>
              <div contenteditable="true" spellcheck="false" style="font-size:1.45rem;font-weight:800;color:#0f172a;letter-spacing:-0.03em;outline:none;cursor:text"
                oninput="typeof window.currentData!=='undefined'&&(window.currentData.name=this.textContent,scheduleAutoSave())"
              >${esc(data.name)}</div>
              <div contenteditable="true" spellcheck="false" style="font-size:0.76rem;color:${ac};font-weight:700;margin-top:3px;outline:none;cursor:text"
                oninput="typeof window.currentData!=='undefined'&&(window.currentData.target_role=this.textContent,scheduleAutoSave())"
              >${esc(data.target_role || '')}</div>
              <div style="font-size:0.7rem;color:#475569;margin-top:6px;font-family:monospace">${contacts(data)}</div>
            </div>
            ${photoEl(data)}
          </div>
        </div>
        ${secs}`;
    },
  },
  {
    id: 'gradient-banner',
    name: 'Gradient Banner',
    category: 'Creative',
    ats: 89,
    desc: 'Bold diagonal gradient header',
    render(data, ac) {
      const sorted = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      const secs = sorted
        .map(
          (sec: AnyData) => `
        <div data-sec-id="${sec.id}" style="position:relative;margin-bottom:14px">
          ${secCtrl(sec.id)}
          ${secHead(sec.title, ac, sec.id)}
          ${renderSection(sec, ac)}
        </div>`
        )
        .join('');

      return `
        <div style="background:linear-gradient(135deg,${ac} 0%,#7c3aed 100%);padding:26px 24px;margin:-1px;margin-bottom:18px">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
            <div>
              <div contenteditable="true" spellcheck="false" style="font-size:1.6rem;font-weight:900;color:white;letter-spacing:-0.04em;outline:none;cursor:text"
                oninput="typeof window.currentData!=='undefined'&&(window.currentData.name=this.textContent,scheduleAutoSave())"
              >${esc(data.name)}</div>
              <div contenteditable="true" spellcheck="false" style="font-size:0.8rem;color:rgba(255,255,255,0.85);font-weight:500;margin-top:5px;outline:none;cursor:text"
                oninput="typeof window.currentData!=='undefined'&&(window.currentData.target_role=this.textContent,scheduleAutoSave())"
              >${esc(data.target_role || '')}</div>
              <div style="font-size:0.7rem;color:rgba(255,255,255,0.65);margin-top:8px;font-family:monospace">${contacts(data)}</div>
            </div>
            ${photoEl(data)}
          </div>
        </div>
        ${secs}`;
    },
  },
];

// ─────────────────────────────────────────────────────────
// SET 2 — from templatejs.js (20 templates)
// ─────────────────────────────────────────────────────────

function secInner(sec: AnyData, ac: string, compact = false): string {
  return renderSection(sec, ac, compact);
}

const SET_2: Omit<ResumeTemplate, 'premium'>[] = [
  {
    id: 'classic-centered',
    name: 'Classic Centered',
    category: 'Standard',
    ats: 99,
    desc: 'Single column, centered header — universally ATS-safe',
    render(data, ac) {
      return `
      <div style="text-align:center;margin-bottom:13px">
        <div style="display:flex;justify-content:center;margin-bottom:8px">${photoEl(data)}</div>
        <div style="font-size:1.9rem;font-weight:800;color:#0f172a;letter-spacing:-.03em;line-height:1.1">${editableName(data)}</div>
        <div style="font-size:0.8rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin:5px 0">${editableRole(data, ac)}</div>
        <div style="font-size:0.74rem;color:#475569;margin-top:6px;font-family:monospace;word-break:break-all">${contacts(data, ' · ')}</div>
      </div>
      <hr style="border:none;border-top:2px solid ${ac};margin:0 0 13px">
      ${allSections(data, ac)}`;
    },
  },
  {
    id: 'split-header',
    name: 'Split Header',
    category: 'Standard',
    ats: 97,
    desc: 'Name left, contact right — professional & balanced',
    render(data, ac) {
      return `
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:12px;gap:16px;min-width:0">
        <div style="display:flex;align-items:flex-end;gap:11px;min-width:0;flex:1">
          ${photoEl(data)}
          <div style="min-width:0">
            <div style="font-size:1.85rem;font-weight:800;color:#0f172a;letter-spacing:-.03em;line-height:1.1">${editableName(data)}</div>
            <div style="font-size:0.82rem;font-weight:600;margin-top:4px">${editableRole(data, ac)}</div>
          </div>
        </div>
        <div style="text-align:right;font-size:0.72rem;color:#475569;line-height:1.9;font-family:monospace;flex-shrink:0;word-break:break-all;max-width:185px">${contacts(data, '<br>')}</div>
      </div>
      <hr style="border:none;border-top:2.5px solid ${ac};margin:0 0 13px">
      ${allSections(data, ac)}`;
    },
  },
  {
    id: 'sidebar-left',
    name: 'Sidebar Left',
    category: 'Two Column',
    ats: 93,
    desc: 'Skills & info in left sidebar, experience right',
    render(data, ac) {
      const SIDE = ['skills', 'skills-bars', 'skills-dots', 'skills-tags', 'languages', 'certifications', 'education', 'achievements'];
      const MAIN = ['summary', 'objective', 'experience', 'projects', 'publications', 'volunteer'];
      const sorted = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      const sideSecs = sorted.filter((s: AnyData) => SIDE.includes(s.type));
      const mainSecs = sorted.filter((s: AnyData) => MAIN.includes(s.type));
      const bg = ac + '10',
        brd = ac + '20';
      return `<div style="display:flex;min-height:800px;overflow:hidden;box-sizing:border-box">
        <div style="width:168px;flex-shrink:0;background:${bg};border-right:2px solid ${brd};padding:16px 10px 16px 11px;overflow:hidden;word-break:break-word;overflow-wrap:anywhere;box-sizing:border-box">
          <div style="font-size:0.95rem;font-weight:800;color:${ac};line-height:1.25;margin-bottom:2px;word-break:break-word">${editableName(data)}</div>
          <div style="font-size:0.61rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:#475569;margin-bottom:8px;line-height:1.4;word-break:break-word">${editableRole(data, '#475569')}</div>
          <div style="font-size:0.61rem;color:#475569;line-height:1.95;border-top:1px solid ${ac}25;padding-top:8px;margin-bottom:12px;word-break:break-all;overflow-wrap:anywhere">
            ${contacts(data, '<br>')}
          </div>
          ${sideSecs
            .map(
              (sec: AnyData) => `
            <div data-sec-id="${sec.id}" style="margin-bottom:10px;overflow:hidden;position:relative">
              ${secCtrl(sec.id)}
              <div contenteditable="true" spellcheck="false"
                style="font-size:0.57rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:${ac};border-bottom:1.5px solid ${ac}25;padding-bottom:2px;margin-bottom:5px;outline:none;cursor:text"
                oninput="typeof updateSecTitle!=='undefined'&&updateSecTitle('${sec.id}',this.textContent)">${esc(sec.title)}</div>
              <div style="color:#0f172a">${sideContent(sec, ac)}</div>
            </div>`
            )
            .join('')}
        </div>
        <div style="flex:1;padding:18px 16px 18px 18px;min-width:0;overflow:hidden;box-sizing:border-box">
          ${mainSecs.map((sec: AnyData) => wrapSec(sec, ac)).join('')}
        </div>
      </div>`;
    },
  },
  {
    id: 'sidebar-right',
    name: 'Sidebar Right',
    category: 'Two Column',
    ats: 92,
    desc: 'Main content left, skills sidebar right',
    render(data, ac) {
      const SIDE = ['skills', 'skills-bars', 'skills-dots', 'skills-tags', 'languages', 'certifications', 'achievements'];
      const MAIN = ['summary', 'objective', 'experience', 'education', 'projects'];
      const sorted = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      const sideSecs = sorted.filter((s: AnyData) => SIDE.includes(s.type));
      const mainSecs = sorted.filter((s: AnyData) => MAIN.includes(s.type));
      return `<div style="display:flex;min-height:800px;overflow:hidden;box-sizing:border-box">
        <div style="flex:1;padding:18px 16px 18px 18px;border-right:1.5px solid #e2e8f0;min-width:0;overflow:hidden;box-sizing:border-box">
          <div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:11px;min-width:0">
            ${photoEl(data)}
            <div style="min-width:0;flex:1">
              <div style="font-size:1.7rem;font-weight:800;color:#0f172a;letter-spacing:-.02em;word-break:break-word">${editableName(data)}</div>
              <div style="font-size:0.8rem;font-weight:600;margin-top:3px">${editableRole(data, ac)}</div>
            </div>
          </div>
          <hr style="border:none;border-top:2px solid ${ac};margin:0 0 12px">
          ${mainSecs.map((sec: AnyData) => wrapSec(sec, ac)).join('')}
        </div>
        <div style="width:163px;flex-shrink:0;padding:16px 10px;overflow:hidden;word-break:break-word;overflow-wrap:anywhere;box-sizing:border-box">
          <div style="font-size:0.61rem;color:#475569;line-height:1.9;margin-bottom:12px;word-break:break-all;overflow-wrap:anywhere">
            ${contacts(data, '<br>')}
          </div>
          ${sideSecs
            .map(
              (sec: AnyData) => `
            <div data-sec-id="${sec.id}" style="margin-bottom:11px;overflow:hidden;position:relative">
              ${secCtrl(sec.id)}
              <div contenteditable="true" spellcheck="false"
                style="font-size:0.57rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:${ac};border-bottom:1px solid ${ac}25;padding-bottom:2px;margin-bottom:5px;outline:none;cursor:text"
                oninput="typeof updateSecTitle!=='undefined'&&updateSecTitle('${sec.id}',this.textContent)">${esc(sec.title)}</div>
              ${sideContent(sec, ac)}
            </div>`
            )
            .join('')}
        </div>
      </div>`;
    },
  },
  {
    id: 'top-band',
    name: 'Top Band',
    category: 'Header Bold',
    ats: 95,
    desc: 'Full-width colored header band',
    render(data, ac) {
      return `
      <div style="background:${ac};padding:20px 28px;margin:-44px -48px 18px">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;min-width:0">
          <div style="display:flex;align-items:flex-end;gap:11px;min-width:0;flex:1">
            ${photoEl(data, 'border:2px solid rgba(255,255,255,.4)')}
            <div style="min-width:0">
              <div style="font-size:1.9rem;font-weight:900;color:#fff;letter-spacing:-.03em;line-height:1.05">${editableName(data)}</div>
              <div style="font-size:0.78rem;font-weight:600;color:rgba(255,255,255,.87);margin-top:4px;letter-spacing:.06em;text-transform:uppercase">${editableRole(data, 'rgba(255,255,255,.87)')}</div>
            </div>
          </div>
          <div style="text-align:right;font-size:0.71rem;color:rgba(255,255,255,.82);font-family:monospace;line-height:1.9;flex-shrink:0;word-break:break-all;max-width:182px">${contacts(data, '<br>')}</div>
        </div>
      </div>
      ${allSections(data, ac)}`;
    },
  },
  {
    id: 'dark-header',
    name: 'Dark Header',
    category: 'Header Bold',
    ats: 92,
    desc: 'Charcoal header band, accent colour pops',
    render(data, ac) {
      return `
      <div style="background:#0f172a;padding:20px 28px;margin:-44px -48px 18px">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;min-width:0">
          <div style="display:flex;align-items:flex-end;gap:11px;min-width:0;flex:1">
            ${photoEl(data, `border:2px solid ${ac}`)}
            <div style="min-width:0">
              <div style="font-size:1.85rem;font-weight:800;color:#fff;letter-spacing:-.03em">${editableName(data)}</div>
              <div style="font-size:0.79rem;font-weight:600;margin-top:4px;letter-spacing:.06em;text-transform:uppercase">${editableRole(data, ac)}</div>
            </div>
          </div>
          <div style="text-align:right;font-size:0.71rem;color:#94a3b8;font-family:monospace;line-height:1.9;flex-shrink:0;word-break:break-all;max-width:182px">${contacts(data, '<br>')}</div>
        </div>
      </div>
      ${allSections(data, ac)}`;
    },
  },
  {
    id: 'accent-bar',
    name: 'Left Accent Bar',
    category: 'Creative',
    ats: 91,
    desc: 'Thick left-edge colour bar — modern creative',
    render(data, ac) {
      return `
      <div style="display:flex;min-height:800px">
        <div style="width:5px;background:${ac};flex-shrink:0;border-radius:3px;margin-right:18px"></div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;gap:12px;min-width:0">
            <div style="display:flex;gap:11px;align-items:flex-start;min-width:0;flex:1">
              ${photoEl(data)}
              <div style="min-width:0">
                <div style="font-size:1.9rem;font-weight:900;color:#0f172a;letter-spacing:-.03em;line-height:1">${editableName(data)}</div>
                <div style="font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-top:5px">${editableRole(data, ac)}</div>
              </div>
            </div>
            <div style="text-align:right;font-size:0.72rem;color:#64748b;line-height:1.9;font-family:monospace;flex-shrink:0;word-break:break-all;max-width:178px">${contacts(data, '<br>')}</div>
          </div>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 12px">
          ${allSections(data, ac)}
        </div>
      </div>`;
    },
  },
  {
    id: 'executive',
    name: 'Executive',
    category: 'Standard',
    ats: 96,
    desc: 'Centered, formal, double-line rules — senior & C-suite',
    render(data, ac) {
      return `
      <div style="text-align:center;padding-bottom:12px;border-bottom:3px double ${ac}">
        <div style="display:flex;justify-content:center;margin-bottom:8px">${photoEl(data)}</div>
        <div style="font-size:1.9rem;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:#0f172a">${editableName(data)}</div>
        <div style="font-size:0.76rem;letter-spacing:.22em;text-transform:uppercase;margin:5px 0;font-weight:700">${editableRole(data, ac)}</div>
        <div style="font-size:0.73rem;color:#475569;margin-top:7px;font-family:monospace;word-break:break-all">${contacts(data, ' ◆ ')}</div>
      </div>
      ${allSections(data, ac)}`;
    },
  },
  {
    id: 'timeline',
    name: 'Timeline',
    category: 'Creative',
    ats: 88,
    desc: 'Visual timeline markers on experience',
    render(data, ac) {
      const secs = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      return `
      <div style="text-align:center;margin-bottom:13px">
        <div style="display:flex;justify-content:center;margin-bottom:8px">${photoEl(data)}</div>
        <div style="font-size:1.85rem;font-weight:800;color:#0f172a">${editableName(data)}</div>
        <div style="font-size:0.81rem;font-weight:600;margin:4px 0">${editableRole(data, ac)}</div>
        <div style="font-size:0.73rem;color:#64748b;margin-top:6px;font-family:monospace;word-break:break-all">${contacts(data, ' · ')}</div>
      </div>
      <hr style="border:none;border-top:2px solid ${ac};margin:0 0 13px">
      ${secs
        .map((sec: AnyData) => {
          if (!sec.entries?.length) return wrapSec(sec, ac);
          const inner = `<div style="border-left:2px solid ${ac}40;padding-left:14px;margin-left:4px">
            ${(sec.entries || [])
              .map(
                (en: AnyData) => `
              <div style="position:relative;margin-bottom:11px">
                <div style="position:absolute;left:-19px;top:5px;width:8px;height:8px;border-radius:50%;background:${ac};border:2px solid white;box-shadow:0 0 0 1.5px ${ac}"></div>
                ${entryHtml(en, ac, sec.id)}
              </div>`
              )
              .join('')}
          </div>`;
          return `<div data-sec-id="${sec.id}" style="position:relative;margin-bottom:14px">${secCtrl(sec.id)}${secHead(sec.title, ac, sec.id)}${inner}</div>`;
        })
        .join('')}`;
    },
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    category: 'Standard',
    ats: 98,
    desc: 'No decoration — pure content, maximum ATS confidence',
    render(data, ac) {
      const secs = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      return `
      <div style="margin-bottom:16px;min-width:0">
        ${photoEl(data)}
        <div style="font-size:1.95rem;font-weight:900;color:#000;letter-spacing:-.04em">${editableName(data)}</div>
        <div style="font-size:0.8rem;color:#6b7280;margin:3px 0">${editableRole(data, '#6b7280')}</div>
        <div style="font-size:0.71rem;color:#6b7280;margin-top:5px;font-family:monospace;word-break:break-all">${contacts(data, ' · ')}</div>
      </div>
      ${secs
        .map((sec: AnyData) => {
          const inner = `
            <div contenteditable="true" spellcheck="false"
              style="font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.15em;color:#000;margin-bottom:4px;outline:none;cursor:text"
              oninput="typeof updateSecTitle!=='undefined'&&updateSecTitle('${sec.id}',this.textContent)">${esc(sec.title)}</div>
            <hr style="border:none;border-top:1px solid #000;margin:0 0 7px">
            ${secInner(sec, '#000')}`;
          return `<div data-sec-id="${sec.id}" style="margin-bottom:14px;position:relative">${secCtrl(sec.id)}${inner}</div>`;
        })
        .join('')}`;
    },
  },
  {
    id: 'euro-cv',
    name: 'European CV',
    category: 'International',
    ats: 90,
    desc: 'Europass-style label/content layout',
    render(data, ac) {
      const secs = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      return `
      <div style="display:flex;align-items:flex-start;gap:13px;margin-bottom:13px;padding-bottom:11px;border-bottom:2px solid ${ac};min-width:0">
        ${photoEl(data, 'flex-shrink:0;width:78px;height:78px')}
        <div style="flex:1;min-width:0">
          <div style="font-size:1.65rem;font-weight:800;color:#0f172a;margin-bottom:2px;word-break:break-word">${editableName(data)}</div>
          <div style="font-size:0.8rem;font-weight:600;margin-bottom:7px;word-break:break-word">${editableRole(data, ac)}</div>
          <table style="font-size:0.73rem;color:#374151;border-collapse:collapse">
            ${['phone', 'email', 'linkedin', 'location']
              .filter((f) => data[f])
              .map(
                (f) => `
              <tr>
                <td style="font-weight:700;padding-right:10px;padding-bottom:2px;color:${ac};white-space:nowrap">${f.charAt(0).toUpperCase() + f.slice(1)}:</td>
                <td style="word-break:break-all">${esc(data[f])}</td>
              </tr>`
              )
              .join('')}
          </table>
        </div>
      </div>
      ${secs
        .map(
          (sec: AnyData) => `
        <div data-sec-id="${sec.id}" style="display:flex;gap:14px;margin-bottom:11px;min-width:0;position:relative">
          ${secCtrl(sec.id)}
          <div style="width:110px;flex-shrink:0;font-size:0.68rem;font-weight:700;color:${ac};text-transform:uppercase;letter-spacing:.07em;padding-top:2px;word-break:break-word">${esc(sec.title)}</div>
          <div style="flex:1;border-left:1.5px solid ${ac}28;padding-left:13px;min-width:0;overflow:hidden">${secInner(sec, ac)}</div>
        </div>`
        )
        .join('')}`;
    },
  },
  {
    id: 'infographic',
    name: 'Infographic',
    category: 'Creative',
    ats: 82,
    desc: 'Dark sidebar with skill bars — design roles',
    render(data, ac) {
      const SIDE = ['skills', 'skills-bars', 'skills-dots', 'skills-tags', 'languages'];
      const MAIN = ['summary', 'objective', 'experience', 'projects', 'education', 'achievements'];
      const sorted = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      const sideSecs = sorted.filter((s: AnyData) => SIDE.includes(s.type));
      const mainSecs = sorted.filter((s: AnyData) => MAIN.includes(s.type));
      return `<div style="display:flex;min-height:800px;overflow:hidden;box-sizing:border-box">
        <div style="width:190px;flex-shrink:0;background:${ac};padding:20px 12px;overflow:hidden;word-break:break-word;overflow-wrap:anywhere;box-sizing:border-box">
          <div style="text-align:center;margin-bottom:12px">
            ${photoEl(data, 'margin:0 auto 9px;border:3px solid rgba(255,255,255,.4)')}
            <div style="font-size:0.96rem;font-weight:800;color:#fff;line-height:1.2;margin-bottom:2px;word-break:break-word">${editableName(data)}</div>
            <div style="font-size:0.62rem;color:rgba(255,255,255,.82);font-weight:600;text-transform:uppercase;word-break:break-word">${editableRole(data, 'rgba(255,255,255,.82)')}</div>
          </div>
          <div style="border-top:1px solid rgba(255,255,255,.2);padding-top:9px;margin-bottom:11px;font-size:0.64rem;color:rgba(255,255,255,.8);line-height:1.9;font-family:monospace;word-break:break-all;overflow-wrap:anywhere">${contacts(data, '<br>')}</div>
          ${sideSecs
            .map(
              (sec: AnyData) => `
            <div data-sec-id="${sec.id}" style="margin-bottom:11px;overflow:hidden;position:relative">
              ${secCtrl(sec.id)}
              <div style="font-size:0.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.72);margin-bottom:6px;word-break:break-word">${esc(sec.title)}</div>
              <div style="color:rgba(255,255,255,.88)">${sideContent(sec, ac)}</div>
            </div>`
            )
            .join('')}
        </div>
        <div style="flex:1;padding:20px 22px;min-width:0;overflow:hidden;box-sizing:border-box">
          ${mainSecs.map((sec: AnyData) => wrapSec(sec, ac)).join('')}
        </div>
      </div>`;
    },
  },
  {
    id: 'academic',
    name: 'Academic / CV',
    category: 'Academic',
    ats: 94,
    desc: 'Serif, dense, no-frills — research, PhD',
    render(data, ac) {
      const secs = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      return `
      <div style="border-bottom:2px solid #0f172a;padding-bottom:9px;margin-bottom:11px;min-width:0">
        ${photoEl(data, 'float:right;margin-left:11px')}
        <div style="font-size:1.65rem;font-weight:700;color:#0f172a;font-family:Georgia,serif;word-break:break-word">${editableName(data)}</div>
        <div style="font-size:0.8rem;color:#374151;font-style:italic;margin:3px 0;font-family:Georgia,serif">${editableRole(data, '#374151')}</div>
        <div style="font-size:0.72rem;color:#374151;margin-top:5px;font-family:monospace;line-height:1.9;word-break:break-all">${contacts(data, ' | ')}</div>
      </div>
      ${secs
        .map(
          (sec: AnyData) => `
        <div data-sec-id="${sec.id}" style="margin-bottom:11px;position:relative">
          ${secCtrl(sec.id)}
          <div contenteditable="true" spellcheck="false"
            style="font-size:0.76rem;font-weight:700;color:#0f172a;font-family:Georgia,serif;text-transform:uppercase;letter-spacing:.07em;border-bottom:1px solid #0f172a;padding-bottom:3px;margin-bottom:7px;outline:none;cursor:text"
            oninput="typeof updateSecTitle!=='undefined'&&updateSecTitle('${sec.id}',this.textContent)">${esc(sec.title)}</div>
          ${secInner(sec, ac)}
        </div>`
        )
        .join('')}`;
    },
  },
  {
    id: 'harvard',
    name: 'Harvard Classic',
    category: 'Academic',
    ats: 95,
    desc: 'Harvard format — law, finance, MBAs, consulting',
    render(data, ac) {
      const secs = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      return `
      <div style="text-align:center;margin-bottom:2px;min-width:0">
        ${photoEl(data, 'margin:0 auto 7px')}
        <div style="font-size:1.78rem;font-weight:700;color:#0f172a;font-family:Georgia,serif;word-break:break-word">${editableName(data)}</div>
        <div style="font-size:0.72rem;color:#374151;margin-top:6px;font-family:monospace;border-top:1.5px solid #0f172a;border-bottom:1.5px solid #0f172a;padding:4px 8px;display:inline-block;word-break:break-all">${contacts(data, ' | ')}</div>
      </div>
      ${secs
        .map(
          (sec: AnyData) => `
        <div data-sec-id="${sec.id}" style="margin-bottom:11px;position:relative">
          ${secCtrl(sec.id)}
          <div contenteditable="true" spellcheck="false"
            style="font-size:0.76rem;font-weight:700;color:#0f172a;font-family:Georgia,serif;text-transform:uppercase;letter-spacing:.07em;border-bottom:1.5px solid #0f172a;padding-bottom:3px;margin:12px 0 7px;outline:none;cursor:text"
            oninput="typeof updateSecTitle!=='undefined'&&updateSecTitle('${sec.id}',this.textContent)">${esc(sec.title)}</div>
          ${secInner(sec, ac)}
        </div>`
        )
        .join('')}`;
    },
  },
  {
    id: 'tech-dev',
    name: 'Tech / Dev',
    category: 'Specialist',
    ats: 95,
    desc: 'Monospace accents, GitHub-style — for developers',
    render(data, ac) {
      return `
      <div style="font-family:monospace;border-bottom:1px solid ${ac};padding-bottom:11px;margin-bottom:12px;min-width:0">
        <div style="font-size:0.68rem;color:#64748b;margin-bottom:3px">// resume.json → parsed successfully ✓</div>
        <div style="font-size:1.7rem;font-weight:700;color:#0f172a;font-family:monospace;letter-spacing:-.02em;word-break:break-word">${editableName(data)}</div>
        ${
          data.target_role
            ? `<div style="font-size:0.75rem;font-family:monospace;margin:3px 0;word-break:break-word">
          <span style="color:#94a3b8">role:</span> <span style="color:${ac}">"${esc(data.target_role)}"</span>
        </div>`
            : ''
        }
        <div style="font-size:0.69rem;color:#64748b;margin-top:5px;font-family:monospace;line-height:2;word-break:break-all">${contacts(data, ' // ')}</div>
      </div>
      ${allSections(data, ac)}`;
    },
  },
  {
    id: 'card-sections',
    name: 'Card Sections',
    category: 'Creative',
    ats: 90,
    desc: 'Each section in a soft card — structured & airy',
    render(data, ac) {
      const secs = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      return `
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:16px;min-width:0;gap:12px">
        <div style="display:flex;gap:11px;align-items:flex-end;min-width:0;flex:1">
          ${photoEl(data)}
          <div style="min-width:0">
            <div style="font-size:1.8rem;font-weight:800;color:#0f172a;word-break:break-word">${editableName(data)}</div>
            <div style="font-size:0.81rem;font-weight:600;margin-top:3px;word-break:break-word">${editableRole(data, ac)}</div>
          </div>
        </div>
        <div style="text-align:right;font-size:0.71rem;color:#64748b;line-height:2;font-family:monospace;flex-shrink:0;word-break:break-all;max-width:178px">${contacts(data, '<br>')}</div>
      </div>
      ${secs
        .map(
          (sec: AnyData) => `
        <div data-sec-id="${sec.id}" style="margin-bottom:9px;background:${ac}07;border:1px solid ${ac}1a;border-radius:8px;padding:12px 14px;position:relative">
          ${secCtrl(sec.id)}
          ${secHead(sec.title, ac, sec.id)}
          ${secInner(sec, ac)}
        </div>`
        )
        .join('')}`;
    },
  },
  {
    id: 'bold-type',
    name: 'Bold Type',
    category: 'Creative',
    ats: 91,
    desc: 'Oversized name, editorial layout',
    render(data, ac) {
      return `
      <div style="border-bottom:5px solid ${ac};padding-bottom:13px;margin-bottom:15px;min-width:0">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;min-width:0">
          <div style="min-width:0">
            ${photoEl(data)}
            <div style="font-size:2.5rem;font-weight:900;color:#0f172a;letter-spacing:-.05em;line-height:.92;margin-top:3px;word-break:break-word">${editableName(data)}</div>
            <div style="font-size:0.87rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-top:8px;word-break:break-word">${editableRole(data, ac)}</div>
          </div>
          <div style="text-align:right;font-size:0.71rem;color:#64748b;line-height:2;font-family:monospace;flex-shrink:0;margin-top:5px;word-break:break-all;max-width:178px">${contacts(data, '<br>')}</div>
        </div>
      </div>
      ${allSections(data, ac)}`;
    },
  },
  {
    id: 'grid-hybrid',
    name: 'Grid Hybrid',
    category: 'Two Column',
    ats: 93,
    desc: 'Skills & certs in 2-col grid, experience full-width',
    render(data, ac) {
      const GRID = ['skills', 'skills-bars', 'skills-dots', 'skills-tags', 'certifications', 'languages', 'achievements'];
      const FULL = ['summary', 'objective', 'experience', 'projects', 'education'];
      const sorted = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      const gridSecs = sorted.filter((s: AnyData) => GRID.includes(s.type));
      const fullSecs = sorted.filter((s: AnyData) => FULL.includes(s.type));
      return `
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:11px;min-width:0;gap:12px">
        <div style="display:flex;gap:11px;align-items:flex-end;min-width:0;flex:1">
          ${photoEl(data)}
          <div style="min-width:0">
            <div style="font-size:1.78rem;font-weight:800;color:#0f172a;word-break:break-word">${editableName(data)}</div>
            <div style="font-size:0.81rem;font-weight:600;margin-top:3px;word-break:break-word">${editableRole(data, ac)}</div>
          </div>
        </div>
        <div style="text-align:right;font-size:0.71rem;color:#64748b;line-height:2;font-family:monospace;flex-shrink:0;word-break:break-all;max-width:178px">${contacts(data, '<br>')}</div>
      </div>
      <hr style="border:none;border-top:2px solid ${ac};margin:0 0 11px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 22px;margin-bottom:9px">
        ${gridSecs
          .map(
            (sec: AnyData) => `
          <div data-sec-id="${sec.id}" style="margin-bottom:9px;position:relative;overflow:hidden">
            ${secCtrl(sec.id)}
            ${secHead(sec.title, ac, sec.id)}
            ${secInner(sec, ac)}
          </div>`
          )
          .join('')}
      </div>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 11px">
      ${fullSecs.map((sec: AnyData) => wrapSec(sec, ac)).join('')}`;
    },
  },
  {
    id: 'functional',
    name: 'Functional',
    category: 'Specialist',
    ats: 91,
    desc: 'Skills-first — career changers, gaps, pivots',
    render(data, ac) {
      const ORDER = ['summary', 'objective', 'skills', 'skills-bars', 'skills-dots', 'skills-tags', 'certifications', 'experience', 'education', 'projects'];
      const secs = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => {
        const ai = ORDER.indexOf(a.type),
          bi = ORDER.indexOf(b.type);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
      return `
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:11px;min-width:0;gap:12px;border-bottom:2px solid ${ac};padding-bottom:11px">
        <div style="display:flex;gap:11px;align-items:flex-end;min-width:0;flex:1">
          ${photoEl(data)}
          <div style="min-width:0">
            <div style="font-size:1.8rem;font-weight:800;color:#0f172a;word-break:break-word">${editableName(data)}</div>
            <div style="font-size:0.81rem;font-weight:600;margin-top:3px;word-break:break-word">${editableRole(data, ac)}</div>
          </div>
        </div>
        <div style="text-align:right;font-size:0.71rem;color:#64748b;line-height:2;font-family:monospace;flex-shrink:0;word-break:break-all;max-width:178px">${contacts(data, '<br>')}</div>
      </div>
      ${secs.map((sec: AnyData) => wrapSec(sec, ac)).join('')}`;
    },
  },
  {
    id: 'compact-dense',
    name: 'Compact Dense',
    category: 'Standard',
    ats: 94,
    desc: 'Maximum content per page — 10+ yrs, senior roles',
    render(data, ac) {
      return `
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:7px;min-width:0;gap:10px">
        <div style="display:flex;gap:9px;align-items:flex-end;min-width:0;flex:1">
          ${photoEl(data, 'width:54px;height:54px')}
          <div style="min-width:0">
            <div style="font-size:1.45rem;font-weight:800;color:#0f172a;letter-spacing:-.02em;word-break:break-word">${editableName(data)}</div>
            <div style="font-size:0.75rem;font-weight:600;margin-top:2px;word-break:break-word">${editableRole(data, ac)}</div>
          </div>
        </div>
        <div style="text-align:right;font-size:0.67rem;color:#64748b;line-height:1.8;font-family:monospace;flex-shrink:0;word-break:break-all;max-width:168px">${contacts(data, '<br>')}</div>
      </div>
      <hr style="border:none;border-top:1.5px solid ${ac};margin:0 0 8px">
      ${allSections(data, ac, null, true)}`;
    },
  },
];

// The 7 free templates — versatile, ATS-safe basics. Everything else
// requires having purchased a credit pack at least once (see
// users.premiumUnlocked, set true on first purchase in credits.ts).
const FREE_TEMPLATE_IDS = new Set([
  'classic-clean',
  'classic-centered',
  'split-header',
  'minimal-line',
  'compact-pro',
  'minimalist',
  'executive',
]);

export const TEMPLATES: ResumeTemplate[] = [...SET_1, ...SET_2].map((t) => ({
  ...t,
  premium: !FREE_TEMPLATE_IDS.has(t.id),
}));
