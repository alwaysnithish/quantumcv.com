/**
 * src/lib/resume-canvas/templates.ts
 *
 * All 44 resume templates (SET_1..SET_4) — unchanged except the three
 * entry renderers inside SET_3/SET_4 that had their own bullet rows.
 * Those now use the same print-safe block-flow bullet markup as entryHtml().
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
// SET_1 and SET_2 — unchanged (10 + 20 templates)
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
        <div style="margin-bottom:11px;padding-bottom:10px;border-bottom:2px solid ${ac}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
            <div style="flex:1;min-width:0">
              <div contenteditable="true" spellcheck="false" style="font-size:1.26rem;font-weight:800;color:#0f172a;letter-spacing:-0.03em;outline:none;cursor:text;line-height:1.1"
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
        <div style="background:${ac};padding:15px 18px;margin:-1px -1px 0;display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:11px">
          <div>
            <div contenteditable="true" spellcheck="false" style="font-size:1.26rem;font-weight:800;color:white;letter-spacing:-0.03em;outline:none;cursor:text;line-height:1.1"
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
        <div style="margin-bottom:12px">
          <div contenteditable="true" spellcheck="false" style="font-size:1.26rem;font-weight:800;color:#0f172a;letter-spacing:-0.04em;outline:none;cursor:text"
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
        <div style="background:linear-gradient(135deg,${ac} 0%,${ac}cc 100%);padding:16px 20px;margin:-1px;margin-bottom:11px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div contenteditable="true" spellcheck="false" style="font-size:1.26rem;font-weight:900;color:white;letter-spacing:-0.04em;outline:none;cursor:text;line-height:1.05"
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
        <div style="text-align:center;margin-bottom:12px;padding-bottom:11px;border-bottom:2px solid ${ac}33">
          ${photoEl(data, 'margin:0 auto 10px')}
          <div contenteditable="true" spellcheck="false"
            style="font-family:Georgia,serif;font-size:1.3rem;font-weight:700;color:#0f172a;letter-spacing:-0.01em;outline:none;cursor:text"
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
        <div style="background:#0f172a;padding:16px 20px;margin:-1px;margin-bottom:11px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div contenteditable="true" spellcheck="false" style="font-size:1.26rem;font-weight:900;color:white;letter-spacing:-0.04em;outline:none;cursor:text"
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
        <div style="background:${ac};padding:15px 18px;margin:-1px;margin-bottom:11px">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
            <div>
              <div contenteditable="true" spellcheck="false" style="font-size:1.26rem;font-weight:800;color:white;letter-spacing:-0.03em;outline:none;cursor:text"
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
        <div style="border:2px solid ${ac};border-radius:8px;padding:14px 16px;margin-bottom:11px">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
            <div>
              <div contenteditable="true" spellcheck="false" style="font-size:1.24rem;font-weight:800;color:#0f172a;letter-spacing:-0.03em;outline:none;cursor:text"
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
        <div style="background:linear-gradient(135deg,${ac} 0%,#7c3aed 100%);padding:16px 20px;margin:-1px;margin-bottom:11px">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
            <div>
              <div contenteditable="true" spellcheck="false" style="font-size:1.26rem;font-weight:900;color:white;letter-spacing:-0.04em;outline:none;cursor:text"
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
// SET_2 — unchanged (20 templates)
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
        <div style="font-size:1.34rem;font-weight:800;color:#0f172a;letter-spacing:-.03em;line-height:1.1">${editableName(data)}</div>
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
            <div style="font-size:1.3rem;font-weight:800;color:#0f172a;letter-spacing:-.03em;line-height:1.1">${editableName(data)}</div>
            <div style="font-size:0.82rem;font-weight:600;margin-top:4px">${editableRole(data, ac)}</div>
          </div>
        </div>
        <div style="text-align:right;font-size:0.72rem;color:#475569;line-height:1.5;font-family:monospace;flex-shrink:0;word-break:break-all;max-width:185px">${contacts(data, '<br>')}</div>
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
      return `<div style="display:flex;min-height:0;box-sizing:border-box">
        <div style="width:168px;flex-shrink:0;background:${bg};border-right:2px solid ${brd};padding:16px 10px 16px 11px;overflow:visible;word-break:break-word;overflow-wrap:anywhere;box-sizing:border-box">
          <div style="font-size:0.95rem;font-weight:800;color:${ac};line-height:1.25;margin-bottom:2px;word-break:break-word">${editableName(data)}</div>
          <div style="font-size:0.61rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:#475569;margin-bottom:8px;line-height:1.4;word-break:break-word">${editableRole(data, '#475569')}</div>
          <div style="font-size:0.61rem;color:#475569;line-height:1.5;border-top:1px solid ${ac}25;padding-top:8px;margin-bottom:12px;word-break:break-all;overflow-wrap:anywhere">
            ${contacts(data, '<br>')}
          </div>
          ${sideSecs
            .map(
              (sec: AnyData) => `
            <div data-sec-id="${sec.id}" style="margin-bottom:10px;overflow:visible;position:relative">
              ${secCtrl(sec.id)}
              <div contenteditable="true" spellcheck="false"
                style="font-size:0.57rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:${ac};border-bottom:1.5px solid ${ac}25;padding-bottom:2px;margin-bottom:5px;outline:none;cursor:text"
                oninput="typeof updateSecTitle!=='undefined'&&updateSecTitle('${sec.id}',this.textContent)">${esc(sec.title)}</div>
              <div style="color:#0f172a">${sideContent(sec, ac)}</div>
            </div>`
            )
            .join('')}
        </div>
        <div style="flex:1;padding:18px 16px 18px 18px;min-width:0;overflow:visible;box-sizing:border-box">
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
      return `<div style="display:flex;min-height:0;box-sizing:border-box">
        <div style="flex:1;padding:18px 16px 18px 18px;border-right:1.5px solid #e2e8f0;min-width:0;overflow:visible;box-sizing:border-box">
          <div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:11px;min-width:0">
            ${photoEl(data)}
            <div style="min-width:0;flex:1">
              <div style="font-size:1.3rem;font-weight:800;color:#0f172a;letter-spacing:-.02em;word-break:break-word">${editableName(data)}</div>
              <div style="font-size:0.8rem;font-weight:600;margin-top:3px">${editableRole(data, ac)}</div>
            </div>
          </div>
          <hr style="border:none;border-top:2px solid ${ac};margin:0 0 12px">
          ${mainSecs.map((sec: AnyData) => wrapSec(sec, ac)).join('')}
        </div>
        <div style="width:163px;flex-shrink:0;padding:16px 10px;overflow:visible;word-break:break-word;overflow-wrap:anywhere;box-sizing:border-box">
          <div style="font-size:0.61rem;color:#475569;line-height:1.5;margin-bottom:12px;word-break:break-all;overflow-wrap:anywhere">
            ${contacts(data, '<br>')}
          </div>
          ${sideSecs
            .map(
              (sec: AnyData) => `
            <div data-sec-id="${sec.id}" style="margin-bottom:11px;overflow:visible;position:relative">
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
      <div style="background:${ac};padding:14px 24px;margin:-44px -48px 11px">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;min-width:0">
          <div style="display:flex;align-items:flex-end;gap:11px;min-width:0;flex:1">
            ${photoEl(data, 'border:2px solid rgba(255,255,255,.4)')}
            <div style="min-width:0">
              <div style="font-size:1.34rem;font-weight:900;color:#fff;letter-spacing:-.03em;line-height:1.05">${editableName(data)}</div>
              <div style="font-size:0.78rem;font-weight:600;color:rgba(255,255,255,.87);margin-top:4px;letter-spacing:.06em;text-transform:uppercase">${editableRole(data, 'rgba(255,255,255,.87)')}</div>
            </div>
          </div>
          <div style="text-align:right;font-size:0.71rem;color:rgba(255,255,255,.82);font-family:monospace;line-height:1.5;flex-shrink:0;word-break:break-all;max-width:182px">${contacts(data, '<br>')}</div>
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
      <div style="background:#0f172a;padding:14px 24px;margin:-44px -48px 11px">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;min-width:0">
          <div style="display:flex;align-items:flex-end;gap:11px;min-width:0;flex:1">
            ${photoEl(data, `border:2px solid ${ac}`)}
            <div style="min-width:0">
              <div style="font-size:1.3rem;font-weight:800;color:#fff;letter-spacing:-.03em">${editableName(data)}</div>
              <div style="font-size:0.79rem;font-weight:600;margin-top:4px;letter-spacing:.06em;text-transform:uppercase">${editableRole(data, ac)}</div>
            </div>
          </div>
          <div style="text-align:right;font-size:0.71rem;color:#94a3b8;font-family:monospace;line-height:1.5;flex-shrink:0;word-break:break-all;max-width:182px">${contacts(data, '<br>')}</div>
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
      <div style="display:flex">
        <div style="width:5px;background:${ac};flex-shrink:0;border-radius:3px;margin-right:18px"></div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;gap:12px;min-width:0">
            <div style="display:flex;gap:11px;align-items:flex-start;min-width:0;flex:1">
              ${photoEl(data)}
              <div style="min-width:0">
                <div style="font-size:1.34rem;font-weight:900;color:#0f172a;letter-spacing:-.03em;line-height:1">${editableName(data)}</div>
                <div style="font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-top:5px">${editableRole(data, ac)}</div>
              </div>
            </div>
            <div style="text-align:right;font-size:0.72rem;color:#64748b;line-height:1.5;font-family:monospace;flex-shrink:0;word-break:break-all;max-width:178px">${contacts(data, '<br>')}</div>
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
        <div style="font-size:1.34rem;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:#0f172a">${editableName(data)}</div>
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
        <div style="font-size:1.3rem;font-weight:800;color:#0f172a">${editableName(data)}</div>
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
      <div style="margin-bottom:11px;min-width:0">
        ${photoEl(data)}
        <div style="font-size:1.34rem;font-weight:900;color:#000;letter-spacing:-.04em">${editableName(data)}</div>
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
          <div style="font-size:1.26rem;font-weight:800;color:#0f172a;margin-bottom:2px;word-break:break-word">${editableName(data)}</div>
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
          <div style="flex:1;border-left:1.5px solid ${ac}28;padding-left:13px;min-width:0;overflow:visible">${secInner(sec, ac)}</div>
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
      return `<div style="display:flex;min-height:0;box-sizing:border-box">
        <div style="width:190px;flex-shrink:0;background:${ac};padding:20px 12px;overflow:visible;word-break:break-word;overflow-wrap:anywhere;box-sizing:border-box">
          <div style="text-align:center;margin-bottom:12px">
            ${photoEl(data, 'margin:0 auto 9px;border:3px solid rgba(255,255,255,.4)')}
            <div style="font-size:0.96rem;font-weight:800;color:#fff;line-height:1.2;margin-bottom:2px;word-break:break-word">${editableName(data)}</div>
            <div style="font-size:0.62rem;color:rgba(255,255,255,.82);font-weight:600;text-transform:uppercase;word-break:break-word">${editableRole(data, 'rgba(255,255,255,.82)')}</div>
          </div>
          <div style="border-top:1px solid rgba(255,255,255,.2);padding-top:9px;margin-bottom:11px;font-size:0.64rem;color:rgba(255,255,255,.8);line-height:1.5;font-family:monospace;word-break:break-all;overflow-wrap:anywhere">${contacts(data, '<br>')}</div>
          ${sideSecs
            .map(
              (sec: AnyData) => `
            <div data-sec-id="${sec.id}" style="margin-bottom:11px;overflow:visible;position:relative">
              ${secCtrl(sec.id)}
              <div style="font-size:0.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.72);margin-bottom:6px;word-break:break-word">${esc(sec.title)}</div>
              <div style="color:rgba(255,255,255,.88)">${sideContent(sec, ac)}</div>
            </div>`
            )
            .join('')}
        </div>
        <div style="flex:1;padding:20px 22px;min-width:0;overflow:visible;box-sizing:border-box">
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
        <div style="font-size:1.26rem;font-weight:700;color:#0f172a;font-family:Georgia,serif;word-break:break-word">${editableName(data)}</div>
        <div style="font-size:0.8rem;color:#374151;font-style:italic;margin:3px 0;font-family:Georgia,serif">${editableRole(data, '#374151')}</div>
        <div style="font-size:0.72rem;color:#374151;margin-top:5px;font-family:monospace;line-height:1.5;word-break:break-all">${contacts(data, ' | ')}</div>
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
        <div style="font-size:1.3rem;font-weight:700;color:#0f172a;font-family:Georgia,serif;word-break:break-word">${editableName(data)}</div>
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
        <div style="font-size:0.68rem;color:#64748b;margin-bottom:3px"></div>
        <div style="font-size:1.7rem;font-weight:700;color:#0f172a;font-family:monospace;letter-spacing:-.02em;word-break:break-word">${editableName(data)}</div>
        ${
          data.target_role
            ? `<div style="font-size:0.75rem;font-family:monospace;margin:3px 0;word-break:break-word">
          <span style="color:#94a3b8">role:</span> <span style="color:${ac}">"${esc(data.target_role)}"</span>
        </div>`
            : ''
        }
        <div style="font-size:0.69rem;color:#64748b;margin-top:5px;font-family:monospace;line-height:1.5;word-break:break-all">${contacts(data, ' // ')}</div>
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
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:10px;min-width:0;gap:12px">
        <div style="display:flex;gap:11px;align-items:flex-end;min-width:0;flex:1">
          ${photoEl(data)}
          <div style="min-width:0">
            <div style="font-size:1.24rem;font-weight:800;color:#0f172a;word-break:break-word">${editableName(data)}</div>
            <div style="font-size:0.81rem;font-weight:600;margin-top:3px;word-break:break-word">${editableRole(data, ac)}</div>
          </div>
        </div>
        <div style="text-align:right;font-size:0.71rem;color:#64748b;line-height:1.5;font-family:monospace;flex-shrink:0;word-break:break-all;max-width:178px">${contacts(data, '<br>')}</div>
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
            <div style="font-size:1.34rem;font-weight:900;color:#0f172a;letter-spacing:-.05em;line-height:.92;margin-top:3px;word-break:break-word">${editableName(data)}</div>
            <div style="font-size:0.87rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-top:8px;word-break:break-word">${editableRole(data, ac)}</div>
          </div>
          <div style="text-align:right;font-size:0.71rem;color:#64748b;line-height:1.5;font-family:monospace;flex-shrink:0;margin-top:5px;word-break:break-all;max-width:178px">${contacts(data, '<br>')}</div>
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
            <div style="font-size:1.3rem;font-weight:800;color:#0f172a;word-break:break-word">${editableName(data)}</div>
            <div style="font-size:0.81rem;font-weight:600;margin-top:3px;word-break:break-word">${editableRole(data, ac)}</div>
          </div>
        </div>
        <div style="text-align:right;font-size:0.71rem;color:#64748b;line-height:1.5;font-family:monospace;flex-shrink:0;word-break:break-all;max-width:178px">${contacts(data, '<br>')}</div>
      </div>
      <hr style="border:none;border-top:2px solid ${ac};margin:0 0 11px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 22px;margin-bottom:9px">
        ${gridSecs
          .map(
            (sec: AnyData) => `
          <div data-sec-id="${sec.id}" style="margin-bottom:9px;position:relative;overflow:visible">
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
            <div style="font-size:1.3rem;font-weight:800;color:#0f172a;word-break:break-word">${editableName(data)}</div>
            <div style="font-size:0.81rem;font-weight:600;margin-top:3px;word-break:break-word">${editableRole(data, ac)}</div>
          </div>
        </div>
        <div style="text-align:right;font-size:0.71rem;color:#64748b;line-height:1.5;font-family:monospace;flex-shrink:0;word-break:break-all;max-width:178px">${contacts(data, '<br>')}</div>
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
            <div style="font-size:1.24rem;font-weight:800;color:#0f172a;letter-spacing:-.02em;word-break:break-word">${editableName(data)}</div>
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

// ─────────────────────────────────────────────────────────
// SET_3 — 9 templates (only gridEntryHtml, metricEntryHtml, ledgerEntryHtml changed)
// ─────────────────────────────────────────────────────────

/** Entry with dates/location in a dedicated left column, title/bullets in a wide right column. */
function gridEntryHtml(en: AnyData, ac: string, secId: string): string {
  const dateStr = [en.date_start, en.date_end].filter(Boolean).join(' – ');
  return `<div contenteditable="true" spellcheck="false"
    oninput="typeof handleEntryEdit!=='undefined'&&handleEntryEdit('${secId}','${en.id}',this)"
    style="display:grid;grid-template-columns:106px 1fr;column-gap:16px;margin-bottom:14px;outline:none">
    <div style="font-size:0.65rem;color:#64748b;font-family:monospace;line-height:1.6;padding-top:2px">
      <div data-edit-field="date" style="border-radius:2px;cursor:text"
      >${esc(dateStr)}</div>
      ${en.location ? `<div style="margin-top:2px">${esc(en.location)}</div>` : ''}
    </div>
    <div style="min-width:0">
      <div data-edit-field="title"
        style="font-size:0.82rem;font-weight:700;color:#0f172a;border-radius:2px;cursor:text;word-break:break-word"
      >${esc(en.title)}</div>
      ${
        en.subtitle
          ? `<div data-edit-field="subtitle"
        style="font-size:0.75rem;font-style:italic;color:#475569;margin:1px 0 3px;border-radius:2px;cursor:text"
      >${esc(en.subtitle)}</div>`
          : ''
      }
      ${(en.bullets || [])
        .map(
          (b: string, bi: number) => `
      <div style="position:relative;margin-bottom:2px;line-height:1.32;padding-left:13px;text-indent:-13px"
        onmouseenter="this.querySelector('.bullet-actions').style.display='flex'"
        onmouseleave="this.querySelector('.bullet-actions').style.display='none'">
        <span contenteditable="false" style="color:${ac};font-size:0.68rem">▸</span><span data-edit-field="bullet" data-bullet-index="${bi}"
          style="display:inline;font-size:0.78rem;color:#334155;border-radius:2px;word-break:break-word;cursor:text;line-height:1.32"
        >${esc(b)}</span>
        <div class="bullet-actions" style="display:none;gap:3px;align-items:center;position:absolute;right:0;top:0">
          <button class="bullet-enhance-btn"
            onclick="typeof enhanceBullet!=='undefined'&&enhanceBullet('${secId}','${en.id}',${bi},this)">✦ AI</button>
        </div>
      </div>`
        )
        .join('')}
      <div style="margin-top:3px">
        <button onclick="typeof addBullet!=='undefined'&&addBullet('${secId}','${en.id}')"
          class="add-item-btn" style="font-size:0.68rem;padding:2px 6px;width:auto;display:inline-block">+ bullet</button>
      </div>
    </div>
  </div>`;
}

/** Section body dispatcher for the grid layout — entry-type sections use gridEntryHtml, everything else falls back to the shared renderSection(). */
function gridSectionBody(sec: AnyData, ac: string): string {
  const nonEntryTypes = [
    'summary', 'objective', 'profile', 'personal_statement', 'custom-text',
    'skills', 'skills-bars', 'skills-dots', 'skills-tags', 'languages',
    'bullet-list', 'table', 'divider',
  ];
  if (nonEntryTypes.includes(sec.type)) return renderSection(sec, ac);
  return `<div>${(sec.entries || []).map((en: AnyData) => gridEntryHtml(en, ac, sec.id)).join('')}</div>
    <button onclick="typeof addEntry!=='undefined'&&addEntry('${sec.id}')"
      class="add-item-btn" style="margin-top:4px">+ Add Entry</button>`;
}

function gridWrapSec(sec: AnyData, ac: string): string {
  if (sec.type === 'divider') {
    return `<div data-sec-id="${sec.id}" style="position:relative;margin:6px 0">${secCtrl(sec.id)}${renderSection(sec, ac)}</div>`;
  }
  return `<div data-sec-id="${sec.id}" style="position:relative;margin-bottom:16px">
    ${secCtrl(sec.id)}
    ${secHead(sec.title || '', ac, sec.id)}
    ${gridSectionBody(sec, ac)}
  </div>`;
}

/** Flat, borderless 4-column skills matrix — same editTag/addTag wiring as skillTagsHtml, restyled without the pill chrome. */
function skillsMatrixHtml(sec: AnyData, ac: string): string {
  const n = (sec.tags || []).length;
  return `<div style="display:grid;grid-template-columns:repeat(4,1fr);row-gap:6px;column-gap:10px">
    ${(sec.tags || [])
      .map(
        (tag: string, i: number) => `
      <div style="display:flex;align-items:center;gap:3px;min-width:0">
        <span contenteditable="true" spellcheck="false"
          style="font-size:0.72rem;color:#334155;outline:none;border-radius:2px;cursor:text;word-break:break-word"
          oninput="typeof editTag!=='undefined'&&editTag('${sec.id}',${i},this.textContent)"
        >${esc(tag)}</span>
        <button onclick="typeof delTag!=='undefined'&&delTag('${sec.id}',${i})"
          style="font-size:.55rem;border:none;background:none;color:#94a3b8;cursor:pointer;padding:0;flex-shrink:0">✕</button>
      </div>`
      )
      .join('')}
  </div>
  <button onclick="typeof addTag!=='undefined'&&addTag('${sec.id}')" class="add-item-btn" style="margin-top:8px">+ Skill</button>
  ${n === 0 ? '' : ''}`;
}

function corpSectionBody(sec: AnyData, ac: string): string {
  if (sec.type === 'skills-tags') return skillsMatrixHtml(sec, ac);
  return renderSection(sec, ac);
}

function corpWrapSec(sec: AnyData, ac: string): string {
  if (sec.type === 'divider') {
    return `<div data-sec-id="${sec.id}" style="position:relative;margin:6px 0">${secCtrl(sec.id)}${renderSection(sec, ac)}</div>`;
  }
  return `<div data-sec-id="${sec.id}" style="position:relative;margin-bottom:14px">
    ${secCtrl(sec.id)}
    ${secHead(sec.title || '', ac, sec.id)}
    ${corpSectionBody(sec, ac)}
  </div>`;
}

/** First + last initials from data.name, for the Monogram badge. Purely decorative/derived — recomputes on every render, nothing new to store. */
function initials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return (parts[0][0] || '').toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Wraps digit-bearing tokens ($, %, x, K/M/B suffixes) in a bold accent span, for Metric's "highlight the numbers" bullets. Operates on already-escaped text, so it's safe against the HTML entities esc() produces. */
function highlightMetrics(escaped: string, ac: string): string {
  return escaped.replace(/(\$?\d[\d,]*(?:\.\d+)?\s?(?:%|[xX]|[KkMmBb](?![a-zA-Z]))?\+?)/g, (m) =>
    /\d/.test(m) ? `<b style="color:${ac};font-weight:800">${m}</b>` : m
  );
}

/** Same field bindings as entryHtml(), but bullets run through highlightMetrics() for display. Editing still saves plain text — highlighting is recomputed at render time, not stored. */
function metricEntryHtml(en: AnyData, ac: string, secId: string): string {
  const dateStr = [en.date_start, en.date_end].filter(Boolean).join(' – ');
  return `<div style="margin-bottom:12px">
    <div style="font-size:0.82rem;font-weight:700;color:#0f172a;word-break:break-word"
    ><span contenteditable="true" spellcheck="false"
      style="outline:none;border-radius:2px;cursor:text"
      oninput="typeof handleEdit!=='undefined'&&handleEdit('title','${secId}','${en.id}',-1,this.textContent)"
    >${esc(en.title)}</span><span contenteditable="true" spellcheck="false"
      style="font-weight:400;font-size:0.69rem;color:#64748b;font-family:monospace;outline:none;border-radius:2px;cursor:text"
      oninput="typeof handleEdit!=='undefined'&&handleEdit('date','${secId}','${en.id}',-1,this.textContent)"
    >&nbsp;·&nbsp;${esc(dateStr)}</span></div>
    ${
      en.subtitle
        ? `<div contenteditable="true" spellcheck="false"
      style="font-size:0.75rem;color:${ac};font-weight:600;margin:1px 0 3px;outline:none;border-radius:2px;word-break:break-word;cursor:text"
      oninput="typeof handleEdit!=='undefined'&&handleEdit('subtitle','${secId}','${en.id}',-1,this.textContent)"
    >${esc(en.subtitle)}</div>`
        : ''
    }
    ${en.location ? `<div style="font-size:0.67rem;color:#94a3b8;margin-bottom:2px">${esc(en.location)}</div>` : ''}
    ${(en.bullets || [])
      .map(
        (b: string, bi: number) => `
    <div style="position:relative;margin-bottom:2px;line-height:1.32;padding-left:13px;text-indent:-13px"
      onmouseenter="this.querySelector('.bullet-actions').style.display='flex'"
      onmouseleave="this.querySelector('.bullet-actions').style.display='none'">
      <span style="color:${ac};font-size:0.68rem">▸</span><span contenteditable="true" spellcheck="false"
        style="display:inline;font-size:0.78rem;color:#334155;outline:none;border-radius:2px;word-break:break-word;cursor:text;line-height:1.32"
        oninput="typeof handleEdit!=='undefined'&&handleEdit('bullet','${secId}','${en.id}',${bi},this.textContent)"
      >${highlightMetrics(esc(b), ac)}</span>
      <div class="bullet-actions" style="display:none;gap:3px;align-items:center;position:absolute;right:0;top:0">
        <button class="bullet-enhance-btn"
          onclick="typeof enhanceBullet!=='undefined'&&enhanceBullet('${secId}','${en.id}',${bi},this)">✦ AI</button>
      </div>
    </div>`
      )
      .join('')}
    <div style="margin-top:3px">
      <button onclick="typeof addBullet!=='undefined'&&addBullet('${secId}','${en.id}')"
        class="add-item-btn" style="font-size:0.68rem;padding:2px 6px;width:auto;display:inline-block">+ bullet</button>
    </div>
  </div>`;
}

function metricSectionBody(sec: AnyData, ac: string): string {
  const nonEntryTypes = [
    'summary', 'objective', 'profile', 'personal_statement', 'custom-text',
    'skills', 'skills-bars', 'skills-dots', 'skills-tags', 'languages',
    'bullet-list', 'table', 'divider',
  ];
  if (nonEntryTypes.includes(sec.type)) return renderSection(sec, ac);
  return `<div>${(sec.entries || []).map((en: AnyData) => metricEntryHtml(en, ac, sec.id)).join('')}</div>
    <button onclick="typeof addEntry!=='undefined'&&addEntry('${sec.id}')"
      class="add-item-btn" style="margin-top:4px">+ Add Entry</button>`;
}

function metricWrapSec(sec: AnyData, ac: string): string {
  if (sec.type === 'divider') {
    return `<div data-sec-id="${sec.id}" style="position:relative;margin:6px 0">${secCtrl(sec.id)}${renderSection(sec, ac)}</div>`;
  }
  return `<div data-sec-id="${sec.id}" style="position:relative;margin-bottom:14px">
    ${secCtrl(sec.id)}
    ${secHead(sec.title || '', ac, sec.id)}
    ${metricSectionBody(sec, ac)}
  </div>`;
}

/** Finds the first quantifiable token (%, $, x, K/M/B, or a plain number) across an entry's bullets — powers Pulse's auto-generated highlight strip. */
function extractMetric(bullets: string[] | undefined): string | null {
  for (const b of bullets || []) {
    const m = /(\$?\d[\d,]*(?:\.\d+)?\s?(?:%|[xX]|[KkMmBb](?![a-zA-Z]))?\+?)/.exec(b);
    if (m && /\d/.test(m[0])) return m[0].trim();
  }
  return null;
}

/** Section wrapper for Panorama — same secCtrl/secHead/renderSection plumbing as wrapSec(), wrapped in an alternating tinted, rounded panel instead of a plain block. */
function panoramaWrapSec(sec: AnyData, ac: string, idx: number): string {
  if (sec.type === 'divider') {
    return `<div data-sec-id="${sec.id}" style="position:relative;margin:6px 0">${secCtrl(sec.id)}${renderSection(sec, ac)}</div>`;
  }
  const tint = idx % 2 === 1;
  return `<div data-sec-id="${sec.id}" style="position:relative;margin-bottom:10px;padding:14px 16px;
    border-radius:10px;background:${tint ? `${ac}0d` : 'transparent'}">
    ${secCtrl(sec.id)}
    ${secHead(sec.title || '', ac, sec.id)}
    ${renderSection(sec, ac)}
  </div>`;
}

/** Section wrapper for Compass — numbered badge + connecting rail per SECTION (not per entry, unlike timelineEntryHtml), same dot-and-rail flex trick. secCtrl stays a direct child of the position:relative data-sec-id div, same anchoring convention as every other wrap*Sec() here. */
function compassWrapSec(sec: AnyData, ac: string, idx: number, isLast: boolean): string {
  if (sec.type === 'divider') {
    return `<div data-sec-id="${sec.id}" style="position:relative;margin:6px 0">${secCtrl(sec.id)}${renderSection(sec, ac)}</div>`;
  }
  const num = String(idx + 1).padStart(2, '0');
  return `<div data-sec-id="${sec.id}" style="position:relative">
    ${secCtrl(sec.id)}
    <div style="display:flex;gap:14px">
      <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:24px">
        <div style="width:24px;height:24px;border-radius:50%;background:${ac};color:#fff;font-size:0.6rem;font-weight:800;
          font-family:monospace;display:flex;align-items:center;justify-content:center;flex-shrink:0">${num}</div>
        ${isLast ? '' : `<div style="flex:1;width:2px;background:${ac}33;margin:4px 0"></div>`}
      </div>
      <div style="flex:1;min-width:0;padding-bottom:18px">
        ${secHead(sec.title || '', ac, sec.id)}
        ${renderSection(sec, ac)}
      </div>
    </div>
  </div>`;
}

/** Editorial drop-cap summary paragraph — same handleEdit('summary', secId, null, -1, textContent) binding as summaryHtml(), just with the first character wrapped in a floated display span. Editing still saves plain text since it's read via textContent, so the nested span never leaks into stored data. */
function dropCapSummaryHtml(sec: AnyData, ac: string): string {
  const text = sec.summary_text || '';
  const first = text.slice(0, 1);
  const rest = text.slice(1);
  return `<p contenteditable="true" spellcheck="false"
    style="font-size:0.8rem;color:#334155;line-height:1.75;margin:0;outline:none;border-radius:2px;word-break:break-word;cursor:text;min-height:1.2em"
    oninput="typeof handleEdit!=='undefined'&&handleEdit('summary','${sec.id}',null,-1,this.textContent)"
  >${
    first
      ? `<span style="float:left;font-family:Georgia,'Times New Roman',serif;font-size:2.5rem;line-height:0.78;
        font-weight:700;color:${ac};padding-right:6px;padding-top:3px">${esc(first)}</span>${esc(rest)}`
      : ''
  }</p>`;
}

function apertureSectionBody(sec: AnyData, ac: string): string {
  const summaryTypes = ['summary', 'objective', 'profile', 'personal_statement'];
  if (summaryTypes.includes(sec.type)) return dropCapSummaryHtml(sec, ac);
  return renderSection(sec, ac);
}

function apertureWrapSec(sec: AnyData, ac: string): string {
  if (sec.type === 'divider') {
    return `<div data-sec-id="${sec.id}" style="position:relative;margin:6px 0">${secCtrl(sec.id)}${renderSection(sec, ac)}</div>`;
  }
  return `<div data-sec-id="${sec.id}" style="position:relative;margin-bottom:16px">
    ${secCtrl(sec.id)}
    ${secHead(sec.title || '', ac, sec.id)}
    ${apertureSectionBody(sec, ac)}
  </div>`;
}

const SET_3: Omit<ResumeTemplate, 'premium'>[] = [
  {
    id: 'classic-grid',
    name: 'Classic Grid',
    category: 'Standard',
    ats: 95,
    desc: 'Centered header with an optional personal-info row, dedicated date/location column per entry',
    render(data, ac) {
      const secs = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      const pi = data.personal_info || {};
      const piRows: { label: string; value: string }[] = [
        { label: 'Date of birth', value: pi.dob },
        { label: 'Marital status', value: pi.marital_status },
        { label: 'Nationality', value: pi.nationality },
        { label: 'Sex', value: pi.sex },
      ].filter((r) => !!r.value);

      return `
        <div style="text-align:center;margin-bottom:16px">
          <div style="font-size:1.24rem;font-weight:700;color:#0f172a">${editableName(data)}</div>
          <div style="font-size:0.74rem;color:${ac};font-weight:600;margin-top:3px">${editableRole(data, ac)}</div>
          <div style="font-size:0.7rem;color:#475569;margin-top:6px;font-family:monospace">${contacts(data)}</div>
          ${
            piRows.length
              ? `<div style="display:flex;justify-content:center;flex-wrap:wrap;gap:4px 24px;font-size:0.66rem;color:#64748b;margin-top:6px">
            ${piRows.map((r) => `<span><b style="color:#94a3b8;font-weight:600">${esc(r.label)}:</b> ${esc(r.value)}</span>`).join('')}
          </div>`
              : ''
          }
          <div style="height:2px;background:#0f172a;margin-top:14px"></div>
        </div>
        ${secs.map((sec: AnyData) => gridWrapSec(sec, ac)).join('')}`;
    },
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    category: 'Standard',
    ats: 92,
    desc: 'Accent-colored rules, optional top-right photo, four-column skills matrix',
    render(data, ac) {
      const secs = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      return `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px">
          <div style="min-width:0">
            <div style="font-size:1.24rem;font-weight:800;color:${ac};letter-spacing:0.01em">${editableName(data)}</div>
            <div style="font-size:0.74rem;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;margin-top:4px">${editableRole(data, ac)}</div>
            <div style="font-size:0.68rem;color:#64748b;margin-top:6px">${contacts(data, ' | ')}</div>
          </div>
          ${photoEl(data, 'border-radius:6px;width:72px;height:72px')}
        </div>
        ${secs.map((sec: AnyData) => corpWrapSec(sec, ac)).join('')}`;
    },
  },
  {
    id: 'monogram',
    name: 'Monogram',
    category: 'Standard',
    ats: 97,
    desc: 'Minimal executive header with an initials badge — about as clean a single-column layout as ATS parsing gets',
    render(data, ac) {
      const ini = initials(data.name);
      return `
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px">
          <div style="width:52px;height:52px;border-radius:50%;background:${ac};color:#fff;display:flex;
            align-items:center;justify-content:center;font-size:1rem;font-weight:800;letter-spacing:0.02em;flex-shrink:0">${esc(ini)}</div>
          <div style="min-width:0">
            <div style="font-size:1.3rem;font-weight:700;color:#0f172a;letter-spacing:-0.01em">${editableName(data)}</div>
            <div style="font-size:0.72rem;color:#64748b;font-weight:700;margin-top:2px;text-transform:uppercase;letter-spacing:0.06em">${editableRole(data, ac)}</div>
          </div>
        </div>
        <div style="font-size:0.68rem;color:#94a3b8;margin-bottom:11px;padding-bottom:10px;border-bottom:1px solid #e2e8f0">${contacts(data)}</div>
        ${allSections(data, ac)}`;
    },
  },
  {
    id: 'metric',
    name: 'Metric',
    category: 'Standard',
    ats: 95,
    desc: 'Automatically bolds numbers, percentages, and dollar figures in your bullets so quantified impact jumps out at a skim',
    render(data, ac) {
      return `
        <div style="margin-bottom:11px;padding-bottom:10px;border-bottom:2px solid ${ac}">
          <div style="font-size:1.24rem;font-weight:800;color:#0f172a;letter-spacing:-0.02em">${editableName(data)}</div>
          <div style="font-size:0.75rem;color:${ac};font-weight:700;margin-top:3px">${editableRole(data, ac)}</div>
          <div style="font-size:0.68rem;color:#64748b;margin-top:6px">${contacts(data)}</div>
        </div>
        ${[...(data.sections || [])]
          .sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0))
          .map((sec: AnyData) => metricWrapSec(sec, ac))
          .join('')}`;
    },
  },
  {
    id: 'masthead',
    name: 'Masthead',
    category: 'Standard',
    ats: 96,
    desc: 'Newspaper-style nameplate — small-caps kicker above a bold serif name framed by twin rules, single-column underneath',
    render(data, ac) {
      return `
        <div style="text-align:center;padding-bottom:10px;margin-bottom:11px">
          <div style="font-size:0.65rem;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:${ac};margin-bottom:6px">${editableRole(data, ac)}</div>
          <div style="border-top:3px solid #0f172a;border-bottom:1px solid #0f172a;padding:10px 0">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:1.5rem;font-weight:700;letter-spacing:0.01em;color:#0f172a">${editableName(data)}</div>
          </div>
          <div style="font-size:0.68rem;color:#64748b;margin-top:8px">${contacts(data)}</div>
        </div>
        ${allSections(data, ac)}`;
    },
  },
  {
    id: 'pulse',
    name: 'Pulse',
    category: 'Standard',
    ats: 94,
    desc: 'Auto-generates a "career highlights" stat strip from your own bullet data — pulls the strongest number out of each recent role and puts it up front, no manual work needed. Bullets throughout stay number-highlighted, same engine as Metric.',
    render(data, ac) {
      const secs = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      const expSec = secs.find((s: AnyData) => s.type === 'experience');
      const cards = ((expSec?.entries || []) as AnyData[])
        .slice(0, 3)
        .map((en) => ({ metric: extractMetric(en.bullets), label: en.subtitle || en.title }))
        .filter((c) => !!c.metric);

      return `
        <div style="margin-bottom:10px;padding-bottom:10px;border-bottom:2px solid #0f172a">
          <div style="font-size:1.24rem;font-weight:800;color:#0f172a;letter-spacing:-0.02em">${editableName(data)}</div>
          <div style="font-size:0.75rem;color:${ac};font-weight:700;margin-top:3px">${editableRole(data, ac)}</div>
          <div style="font-size:0.68rem;color:#64748b;margin-top:6px">${contacts(data)}</div>
        </div>
        ${
          cards.length
            ? `<div style="display:grid;grid-template-columns:repeat(${cards.length},1fr);gap:8px;margin-bottom:11px">
          ${cards
            .map(
              (c) => `
            <div style="background:${ac}0d;border:1px solid ${ac}33;border-radius:8px;padding:10px 12px;text-align:center">
              <div style="font-size:1.1rem;font-weight:800;color:${ac}">${esc(c.metric || '')}</div>
              <div style="font-size:0.6rem;color:#64748b;margin-top:2px;word-break:break-word">${esc(c.label || '')}</div>
            </div>`
            )
            .join('')}
        </div>`
            : ''
        }
        ${secs.map((sec: AnyData) => metricWrapSec(sec, ac)).join('')}`;
    },
  },
  {
    id: 'panorama',
    name: 'Panorama',
    category: 'Standard',
    ats: 93,
    desc: 'Alternating tinted, rounded panels give each section its own rhythm and make the page easy to scan — plain single-column text inside every panel',
    render(data, ac) {
      const secs = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      return `
        <div style="margin-bottom:16px">
          <div style="font-size:1.24rem;font-weight:800;color:#0f172a;letter-spacing:-0.02em">${editableName(data)}</div>
          <div style="font-size:0.75rem;color:${ac};font-weight:700;margin-top:3px">${editableRole(data, ac)}</div>
          <div style="font-size:0.68rem;color:#64748b;margin-top:6px">${contacts(data)}</div>
        </div>
        ${secs.map((sec: AnyData, i: number) => panoramaWrapSec(sec, ac, i)).join('')}`;
    },
  },
  {
    id: 'compass',
    name: 'Compass',
    category: 'Standard',
    ats: 95,
    desc: 'Numbered badge and connecting rail down the left of every section, like a wayfinding index — same proven dot-and-rail mechanic as Timeline, one level up',
    render(data, ac) {
      const secs = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      return `
        <div style="margin-bottom:12px;padding-left:32px">
          <div style="font-size:1.24rem;font-weight:800;color:#0f172a;letter-spacing:-0.02em">${editableName(data)}</div>
          <div style="font-size:0.75rem;color:${ac};font-weight:700;margin-top:3px">${editableRole(data, ac)}</div>
          <div style="font-size:0.68rem;color:#64748b;margin-top:6px">${contacts(data)}</div>
        </div>
        ${secs.map((sec: AnyData, i: number) => compassWrapSec(sec, ac, i, i === secs.length - 1)).join('')}`;
    },
  },
  {
    id: 'aperture',
    name: 'Aperture',
    category: 'Standard',
    ats: 97,
    desc: 'Light-weight refined typography with an editorial drop-cap on your summary paragraph — a quieter, more designed feel for executive and creative roles',
    render(data, ac) {
      return `
        <div style="margin-bottom:12px">
          <div style="font-size:1.26rem;font-weight:300;color:#0f172a;letter-spacing:0.02em">${editableName(data)}</div>
          <div style="font-size:0.7rem;color:${ac};font-weight:600;letter-spacing:0.12em;text-transform:uppercase;margin-top:4px">${editableRole(data, ac)}</div>
          <div style="height:1px;background:#e2e8f0;margin:12px 0"></div>
          <div style="font-size:0.68rem;color:#94a3b8">${contacts(data)}</div>
        </div>
        ${[...(data.sections || [])]
          .sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0))
          .map((sec: AnyData) => apertureWrapSec(sec, ac))
          .join('')}`;
    },
  },
];

// ─────────────────────────────────────────────────────────
// SET_4 — 5 templates (only ledgerEntryHtml changed)
// ─────────────────────────────────────────────────────────

/** Entry with a dotted leader rule between the title and the date, like a table of contents / invoice line. */
function ledgerEntryHtml(en: AnyData, ac: string, secId: string): string {
  const dateStr = [en.date_start, en.date_end].filter(Boolean).join(' – ');
  return `<div style="margin-bottom:10px">
    <div style="display:flex;align-items:baseline;gap:6px;min-width:0">
      <div contenteditable="true" spellcheck="false"
        style="font-size:0.82rem;font-weight:700;color:#0f172a;flex-shrink:0;outline:none;border-radius:2px;word-break:break-word;cursor:text"
        oninput="typeof handleEdit!=='undefined'&&handleEdit('title','${secId}','${en.id}',-1,this.textContent)"
      >${esc(en.title)}</div>
      <div style="flex:1;border-bottom:1px dotted #94a3b8;transform:translateY(-3px);min-width:12px"></div>
      <div contenteditable="true" spellcheck="false"
        style="font-size:0.68rem;color:#64748b;white-space:nowrap;flex-shrink:0;font-family:monospace;outline:none;border-radius:2px;cursor:text"
        oninput="typeof handleEdit!=='undefined'&&handleEdit('date','${secId}','${en.id}',-1,this.textContent)"
      >${esc(dateStr)}</div>
    </div>
    ${
      en.subtitle
        ? `<div contenteditable="true" spellcheck="false"
      style="font-size:0.75rem;color:${ac};font-weight:600;margin:1px 0 3px;outline:none;border-radius:2px;word-break:break-word;cursor:text"
      oninput="typeof handleEdit!=='undefined'&&handleEdit('subtitle','${secId}','${en.id}',-1,this.textContent)"
    >${esc(en.subtitle)}</div>`
        : ''
    }
    ${(en.bullets || [])
      .map(
        (b: string, bi: number) => `
    <div style="position:relative;margin-bottom:2px;line-height:1.32;padding-left:13px;text-indent:-13px"
      onmouseenter="this.querySelector('.bullet-actions').style.display='flex'"
      onmouseleave="this.querySelector('.bullet-actions').style.display='none'">
      <span style="color:#94a3b8;font-size:0.72rem">–</span><span contenteditable="true" spellcheck="false"
        style="display:inline;font-size:0.78rem;color:#334155;outline:none;border-radius:2px;word-break:break-word;cursor:text;line-height:1.32"
        oninput="typeof handleEdit!=='undefined'&&handleEdit('bullet','${secId}','${en.id}',${bi},this.textContent)"
      >${esc(b)}</span>
      <div class="bullet-actions" style="display:none;gap:3px;align-items:center;position:absolute;right:0;top:0">
        <button class="bullet-enhance-btn"
          onclick="typeof enhanceBullet!=='undefined'&&enhanceBullet('${secId}','${en.id}',${bi},this)">✦ AI</button>
      </div>
    </div>`
      )
      .join('')}
    <div style="margin-top:3px">
      <button onclick="typeof addBullet!=='undefined'&&addBullet('${secId}','${en.id}')"
        class="add-item-btn" style="font-size:0.68rem;padding:2px 6px;width:auto;display:inline-block">+ bullet</button>
    </div>
  </div>`;
}

function ledgerSectionBody(sec: AnyData, ac: string): string {
  const nonEntryTypes = [
    'summary', 'objective', 'profile', 'personal_statement', 'custom-text',
    'skills', 'skills-bars', 'skills-dots', 'skills-tags', 'languages',
    'bullet-list', 'table', 'divider',
  ];
  if (nonEntryTypes.includes(sec.type)) return renderSection(sec, ac);
  return `<div>${(sec.entries || []).map((en: AnyData) => ledgerEntryHtml(en, ac, sec.id)).join('')}</div>
    <button onclick="typeof addEntry!=='undefined'&&addEntry('${sec.id}')"
      class="add-item-btn" style="margin-top:4px">+ Add Entry</button>`;
}

function ledgerWrapSec(sec: AnyData, ac: string): string {
  if (sec.type === 'divider') {
    return `<div data-sec-id="${sec.id}" style="position:relative;margin:6px 0">${secCtrl(sec.id)}${renderSection(sec, ac)}</div>`;
  }
  return `<div data-sec-id="${sec.id}" style="position:relative;margin-bottom:11px">
    ${secCtrl(sec.id)}
    <div contenteditable="true" spellcheck="false"
      style="font-size:0.66rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#0f172a;margin-bottom:6px;outline:none;cursor:text"
      oninput="typeof updateSecTitle!=='undefined'&&updateSecTitle('${sec.id}',this.textContent)"
    >${esc(sec.title)}<span style="color:#cbd5e1;font-weight:400">.</span></div>
    ${ledgerSectionBody(sec, ac)}
  </div>`;
}

/** Roman numeral, for Brief's auto-numbered section labels. */
function toRoman(n: number): string {
  const map: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let out = '', num = n;
  for (const [val, sym] of map) {
    while (num >= val) { out += sym; num -= val; }
  }
  return out || String(n);
}

function briefWrapSec(sec: AnyData, ac: string, idx: number): string {
  if (sec.type === 'divider') {
    return `<div data-sec-id="${sec.id}" style="position:relative;margin:6px 0">${secCtrl(sec.id)}${renderSection(sec, ac)}</div>`;
  }
  return `<div data-sec-id="${sec.id}" style="position:relative;margin-bottom:12px">
    ${secCtrl(sec.id)}
    <div style="display:flex;align-items:baseline;gap:8px;border-bottom:1px solid #0f172a;padding-bottom:3px;margin-bottom:7px">
      <span style="font-family:Georgia,serif;font-size:0.72rem;font-weight:700;color:${ac};flex-shrink:0">${toRoman(idx + 1)}.</span>
      <div contenteditable="true" spellcheck="false"
        style="font-family:Georgia,serif;font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#0f172a;outline:none;cursor:text"
        oninput="typeof updateSecTitle!=='undefined'&&updateSecTitle('${sec.id}',this.textContent)"
      >${esc(sec.title)}</div>
    </div>
    ${renderSection(sec, ac)}
  </div>`;
}

/** Folder-tab section label sitting on a hairline rule, for Ribbon. */
function ribbonSecHead(title: string, ac: string, secId: string): string {
  return `<div style="margin-bottom:8px">
    <span contenteditable="true" spellcheck="false"
      style="display:inline-block;font-size:0.64rem;font-weight:800;text-transform:uppercase;letter-spacing:0.09em;
        color:${ac};background:${ac}0f;border:1px solid ${ac}30;border-bottom:none;border-radius:5px 5px 0 0;
        padding:2px 10px 4px;outline:none;cursor:text;position:relative;top:1px"
      oninput="typeof updateSecTitle!=='undefined'&&updateSecTitle('${secId}',this.textContent)"
    >${esc(title)}</span>
    <div style="border-top:1.5px solid ${ac}30"></div>
  </div>`;
}

function ribbonWrapSec(sec: AnyData, ac: string): string {
  if (sec.type === 'divider') {
    return `<div data-sec-id="${sec.id}" style="position:relative;margin:6px 0">${secCtrl(sec.id)}${renderSection(sec, ac)}</div>`;
  }
  return `<div data-sec-id="${sec.id}" style="position:relative;margin-bottom:11px">
    ${secCtrl(sec.id)}
    ${ribbonSecHead(sec.title || '', ac, sec.id)}
    ${renderSection(sec, ac)}
  </div>`;
}

const SET_4: Omit<ResumeTemplate, 'premium'>[] = [
  {
    id: 'ledger',
    name: 'Ledger',
    category: 'Standard',
    ats: 96,
    desc: 'Formal and understated — dotted leader rules align every date like a table of contents. Suits finance, law, and consulting.',
    render(data, ac) {
      const secs = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      return `
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:14px;padding-bottom:8px;border-bottom:2px solid #0f172a;border-top:2px solid #0f172a;padding-top:6px;margin-bottom:11px">
          <div style="font-size:1.22rem;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#0f172a">${editableName(data)}</div>
          <div style="font-size:0.72rem;color:${ac};font-weight:700;text-align:right">${editableRole(data, ac)}</div>
        </div>
        <div style="font-size:0.68rem;color:#64748b;font-family:monospace;margin-bottom:14px;text-align:center">${contacts(data, '   ·   ')}</div>
        ${secs.map((sec: AnyData) => ledgerWrapSec(sec, ac)).join('')}`;
    },
  },
  {
    id: 'monotype',
    name: 'Monotype',
    category: 'Specialist',
    ats: 93,
    desc: 'Full monospace body typeface end to end — plain, technical, and legible. A natural fit for engineering and developer roles.',
    render(data, ac) {
      const secs = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      return `
      <div style="font-family:'Courier New',Courier,monospace">
        <div style="margin-bottom:2px">
          <div style="font-size:1.28rem;font-weight:700;color:#0f172a;letter-spacing:-0.01em">${editableName(data)}</div>
          <div style="font-size:0.74rem;color:${ac};font-weight:700;margin-top:2px">${editableRole(data, ac)}</div>
        </div>
        <div style="font-size:0.67rem;color:#64748b;letter-spacing:-0.02em;margin:6px 0;overflow:hidden;white-space:nowrap">------------------------------------------------------------</div>
        <div style="font-size:0.68rem;color:#475569;margin-bottom:12px">${contacts(data, '  |  ')}</div>
        ${secs
          .map((sec: AnyData) => {
            if (sec.type === 'divider') return `<div data-sec-id="${sec.id}" style="position:relative;margin:6px 0">${secCtrl(sec.id)}${renderSection(sec, ac)}</div>`;
            return `<div data-sec-id="${sec.id}" style="position:relative;margin-bottom:12px">
              ${secCtrl(sec.id)}
              <div contenteditable="true" spellcheck="false"
                style="font-size:0.72rem;font-weight:700;color:#0f172a;margin-bottom:1px;outline:none;cursor:text"
                oninput="typeof updateSecTitle!=='undefined'&&updateSecTitle('${sec.id}',this.textContent)"
              >## ${esc(sec.title)}</div>
              <div style="font-size:0.65rem;color:#cbd5e1;margin-bottom:6px;overflow:hidden;white-space:nowrap">----------------------------------------</div>
              ${renderSection(sec, ac)}
            </div>`;
          })
          .join('')}
      </div>`;
    },
  },
  {
    id: 'brief',
    name: 'Brief',
    category: 'Academic',
    ats: 94,
    desc: 'Legal-brief styling — serif type, auto-numbered roman-numeral sections (I, II, III…). Suits law, academia, and policy roles.',
    render(data, ac) {
      const secs = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      return `
        <div style="text-align:center;margin-bottom:13px">
          <div style="font-family:Georgia,serif;font-size:1.32rem;font-weight:700;color:#0f172a">${editableName(data)}</div>
          <div style="font-family:Georgia,serif;font-style:italic;font-size:0.78rem;color:#475569;margin-top:3px">${editableRole(data, '#475569')}</div>
          <div style="font-size:0.7rem;color:#64748b;font-family:monospace;margin-top:6px">${contacts(data, ' · ')}</div>
        </div>
        ${secs.map((sec: AnyData, i: number) => briefWrapSec(sec, ac, i)).join('')}`;
    },
  },
  {
    id: 'signature',
    name: 'Signature',
    category: 'Standard',
    ats: 95,
    desc: 'A quiet executive header — italic serif name with a rule beneath just the name itself, role and contacts set apart to the right.',
    render(data, ac) {
      return `
      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #e2e8f0">
        <div style="min-width:0">
          <div style="font-family:Georgia,serif;font-style:italic;font-size:1.32rem;font-weight:700;color:#0f172a;
            display:inline-block;border-bottom:2px solid ${ac};padding-bottom:2px">${editableName(data)}</div>
          <div style="font-size:0.72rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${ac};margin-top:6px">${editableRole(data, ac)}</div>
        </div>
        <div style="text-align:right;font-size:0.7rem;color:#64748b;font-family:monospace;line-height:1.5;flex-shrink:0;max-width:180px;word-break:break-all">${contacts(data, '<br>')}</div>
      </div>
      ${allSections(data, ac)}`;
    },
  },
  {
    id: 'ribbon',
    name: 'Ribbon',
    category: 'Standard',
    ats: 94,
    desc: 'Plain single-column layout where each section title sits in a small folder-tab above a hairline rule — a light structural cue without color blocks or borders around content.',
    render(data, ac) {
      const secs = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
      return `
      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:14px;margin-bottom:13px">
        <div style="min-width:0">
          <div style="font-size:1.28rem;font-weight:800;color:#0f172a;letter-spacing:-0.02em">${editableName(data)}</div>
          <div style="font-size:0.76rem;font-weight:600;margin-top:3px">${editableRole(data, ac)}</div>
        </div>
        <div style="text-align:right;font-size:0.7rem;color:#64748b;font-family:monospace;flex-shrink:0;max-width:180px;word-break:break-all">${contacts(data, ' · ')}</div>
      </div>
      ${secs.map((sec: AnyData) => ribbonWrapSec(sec, ac)).join('')}`;
    },
  },
];

// The original 7 free templates, unchanged. The 9 SET_3 and 5 SET_4
// templates are premium by default (see FREE_TEMPLATE_IDS) — add any of
// their ids here if you want to give them away free too.
const FREE_TEMPLATE_IDS = new Set([
  'classic-clean',
  'classic-centered',
  'split-header',
  'minimal-line',
  'compact-pro',
  'minimalist',
  'executive',
]);

export const TEMPLATES: ResumeTemplate[] = [...SET_1, ...SET_2, ...SET_3, ...SET_4].map((t) => ({
  ...t,
  premium: !FREE_TEMPLATE_IDS.has(t.id),
}));
