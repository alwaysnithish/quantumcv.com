/**
 * src/lib/resume-canvas/engine.ts
 *
 * Direct port of the original qcv static/js/builder.js interaction engine.
 * All functions here are attached to `window` (exactly like the original)
 * because the rendered HTML strings (see templates.ts / sections.ts) embed
 * onclick="functionName(...)" handlers that must resolve to real globals.
 *
 * This is deliberately NOT React state management — see the comment at the
 * top of sections.ts for why.
 *
 * API calls are rewired from the original Django endpoints to our Next.js
 * API routes:
 *   /resume/api/generate/         -> /api/ai/generate
 *   /resume/api/chat/             -> /api/ai/chat
 *   /resume/api/enhance-bullet/   -> /api/ai/enhance-bullet
 *   /resume/api/create/           -> POST /api/resumes
 *   /resume/api/save/{id}/        -> PATCH /api/resumes/{id}
 *   /resume/api/versions/{id}/    -> GET /api/resumes/{id}/versions
 *   /resume/api/restore/{id}/{v}/ -> POST /api/resumes/{id}/versions/{v}/restore
 *   /resume/api/export/{id}/      -> GET /api/resumes/{id}/export (server PDF, optional secondary path)
 */
import { AnyData } from './sections';
import { TEMPLATES, ResumeTemplate } from './templates';
import { getSkeletonData, SECTION_DEFS } from './skeleton';

// ── Types for callbacks the React shell provides ─────────
export interface EngineCallbacks {
  onResumeIdChange: (id: string) => void;
  onScoresChange: (ats: number, ai: number) => void;
  onSaveStatusChange: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
  onUndoRedoChange: (canUndo: boolean, canRedo: boolean) => void;
  onChatMessage: (msg: { id: string; role: 'user' | 'ai'; text: string; typing?: boolean }) => void;
  onChatMessageRemove: (id: string) => void;
  onToast: (msg: string, type: 'info' | 'success' | 'error') => void;
  onHeaderSync: () => void;
  onTemplateChange: (tpl: ResumeTemplate) => void;
  onColorChange: (hex: string) => void;
  onActionBtnsShow: () => void;
  onPreviewShow: () => void;
}

let cb: EngineCallbacks | null = null;
let resumeId: string | null = null;
let contentEl: HTMLElement | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let currentFont = 'dm-sans';
let fontScale = 1;
let dragSrcId: string | null = null;

const undoStack: string[] = [];
const redoStack: string[] = [];

function uid(): string {
  return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}
function euid(): string {
  return 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}
function maxOrder(): number {
  return Math.max(0, ...((window as any).currentData?.sections || []).map((s: AnyData) => s.order || 0));
}

// ─────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────

export function initEngine(
  callbacks: EngineCallbacks,
  container: HTMLElement,
  initialResumeId: string | null,
  initialData: AnyData | null
) {
  cb = callbacks;
  contentEl = container;
  resumeId = initialResumeId;
  (window as any).ACCENT = (window as any).ACCENT || '#2058e8';
  (window as any).ACTIVE_TPL = (window as any).ACTIVE_TPL || TEMPLATES[0];
  (window as any).photoDataUrl = (window as any).photoDataUrl || null;
  (window as any).currentData = initialData;

  attachGlobals();

  if (initialData) {
    if (initialData.layout_config?.accent_color) (window as any).ACCENT = initialData.layout_config.accent_color;
    rerenderResume();
    cb.onPreviewShow();
    cb.onActionBtnsShow();
    cb.onHeaderSync();
  }
}

export function destroyEngine() {
  cb = null;
  contentEl = null;
}

// ─────────────────────────────────────────────────────────
// UNDO / REDO
// ─────────────────────────────────────────────────────────

function pushUndo() {
  if (!(window as any).currentData) return;
  undoStack.push(JSON.stringify((window as any).currentData));
  if (undoStack.length > 50) undoStack.shift();
  redoStack.length = 0;
  cb?.onUndoRedoChange(undoStack.length > 0, redoStack.length > 0);
}

export function undo() {
  if (!undoStack.length) return;
  redoStack.push(JSON.stringify((window as any).currentData));
  (window as any).currentData = JSON.parse(undoStack.pop()!);
  cb?.onUndoRedoChange(undoStack.length > 0, redoStack.length > 0);
  rerenderResume();
  cb?.onHeaderSync();
  cb?.onToast('Undone', 'info');
}

export function redo() {
  if (!redoStack.length) return;
  undoStack.push(JSON.stringify((window as any).currentData));
  (window as any).currentData = JSON.parse(redoStack.pop()!);
  cb?.onUndoRedoChange(undoStack.length > 0, redoStack.length > 0);
  rerenderResume();
  cb?.onHeaderSync();
  cb?.onToast('Redone', 'info');
}

// ─────────────────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────────────────

export function rerenderResume() {
  const data = (window as any).currentData;
  const tpl: ResumeTemplate = (window as any).ACTIVE_TPL || TEMPLATES[0];
  if (!data || !contentEl) return;
  contentEl.innerHTML = tpl.render(data, (window as any).ACCENT);
  initDragSections();
}

export function streamRevealResume(data: AnyData) {
  (window as any).currentData = data;
  if (data?.layout_config?.accent_color) (window as any).ACCENT = data.layout_config.accent_color;
  cb?.onPreviewShow();
  cb?.onColorChange((window as any).ACCENT);

  const tpl: ResumeTemplate = (window as any).ACTIVE_TPL || TEMPLATES[0];
  if (!contentEl) return;
  contentEl.innerHTML = tpl.render(data, (window as any).ACCENT);
  initDragSections();

  const secs = contentEl.querySelectorAll('[data-sec-id]');
  secs.forEach((sec, i) => {
    const el = sec as HTMLElement;
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    el.style.transition = `opacity 0.3s ease ${i * 80}ms, transform 0.3s ease ${i * 80}ms`;
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 50 + i * 80);
  });
}

export function startFromTemplate() {
  const data = getSkeletonData();
  (window as any).currentData = data;
  (window as any).ACCENT = '#2058e8';
  rerenderResume();
  cb?.onPreviewShow();
  cb?.onActionBtnsShow();
  cb?.onHeaderSync();
  cb?.onColorChange('#2058e8');
  undoStack.length = 0;
  redoStack.length = 0;
  cb?.onUndoRedoChange(false, false);
  cb?.onToast('Ready! Click any text to edit.', 'info');
}

// ─────────────────────────────────────────────────────────
// HEADER FIELD SYNC
// ─────────────────────────────────────────────────────────

export function updateHeaderField(field: string, value: string) {
  if (!(window as any).currentData) return;
  (window as any).currentData[field] = value;
  scheduleAutoSave();
}

// ─────────────────────────────────────────────────────────
// INLINE EDIT HANDLERS (attached to window; called from HTML)
// ─────────────────────────────────────────────────────────

function attachGlobals() {
  const w = window as any;

  w.handleEdit = function (field: string, secId: string, entryId: string | null, bulIdx: number, value: string) {
    const data = w.currentData;
    if (!data?.sections) return;
    const sec = data.sections.find((s: AnyData) => s.id === secId);
    if (!sec) return;

    if (field === 'summary') {
      sec.summary_text = value;
    } else {
      const en = sec.entries?.find((e: AnyData) => e.id === entryId);
      if (!en) return;
      if (field === 'title') en.title = value;
      else if (field === 'subtitle') en.subtitle = value;
      else if (field === 'date') {
        const parts = value.split(/\s*[–-]\s*/);
        en.date_start = parts[0]?.trim() || '';
        en.date_end = parts[1]?.trim() || '';
      } else if (field === 'bullet' && bulIdx >= 0 && en.bullets) {
        en.bullets[bulIdx] = value;
      }
    }
    scheduleAutoSave();
  };

  w.updateSecTitle = function (secId: string, val: string) {
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    if (sec) {
      sec.title = val;
      scheduleAutoSave();
    }
  };

  w.updateSkillGroup = function (secId: string, catKey: string, newVal: string, which: 'cat' | 'skills') {
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    const grp = sec?.skill_groups?.find((g: AnyData) => g.category === catKey);
    if (!grp) return;
    if (which === 'skills') grp.skills = newVal.split(',').map((s: string) => s.trim()).filter(Boolean);
    else if (which === 'cat') grp.category = newVal;
    scheduleAutoSave();
  };

  // ── Skill bars ──
  w.setSkillBarLevel = function (secId: string, idx: number, e: MouseEvent) {
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    if (!sec?.skills) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pct = Math.max(5, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    sec.skills[idx].level = pct;
    rerenderResume();
    scheduleAutoSave();
  };
  w.editSkillBarName = function (secId: string, idx: number, val: string) {
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    if (sec?.skills?.[idx]) {
      sec.skills[idx].name = val;
      scheduleAutoSave();
    }
  };
  w.stepSkillBarLevel = function (secId: string, idx: number, delta: number) {
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    if (!sec?.skills?.[idx]) return;
    sec.skills[idx].level = Math.max(0, Math.min(100, (sec.skills[idx].level || 0) + delta));
    rerenderResume();
    scheduleAutoSave();
  };
  w.moveSkillItem = function (secId: string, idx: number, dir: number) {
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    if (!sec?.skills) return;
    const ni = idx + dir;
    if (ni < 0 || ni >= sec.skills.length) return;
    pushUndo();
    [sec.skills[idx], sec.skills[ni]] = [sec.skills[ni], sec.skills[idx]];
    rerenderResume();
    scheduleAutoSave();
  };
  w.addSkillBar = function (secId: string) {
    pushUndo();
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    if (!sec) return;
    (sec.skills = sec.skills || []).push({ name: 'New Skill', level: 75 });
    rerenderResume();
    scheduleAutoSave();
  };
  w.delSkillBar = function (secId: string, idx: number) {
    pushUndo();
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    sec?.skills?.splice(idx, 1);
    rerenderResume();
    scheduleAutoSave();
  };

  // ── Skill dots ──
  w.setSkillDotLevel = function (secId: string, idx: number, level: number) {
    pushUndo();
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    if (sec?.skills?.[idx]) {
      sec.skills[idx].level = level;
      rerenderResume();
      scheduleAutoSave();
    }
  };
  w.editSkillDotName = function (secId: string, idx: number, val: string) {
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    if (sec?.skills?.[idx]) {
      sec.skills[idx].name = val;
      scheduleAutoSave();
    }
  };
  w.addSkillDot = function (secId: string) {
    pushUndo();
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    if (!sec) return;
    (sec.skills = sec.skills || []).push({ name: 'New Skill', level: 3 });
    rerenderResume();
    scheduleAutoSave();
  };
  w.delSkillDot = function (secId: string, idx: number) {
    pushUndo();
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    sec?.skills?.splice(idx, 1);
    rerenderResume();
    scheduleAutoSave();
  };

  // ── Skill tags ──
  w.editTag = function (secId: string, idx: number, val: string) {
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    if (sec?.tags?.[idx] !== undefined) {
      sec.tags[idx] = val;
      scheduleAutoSave();
    }
  };
  w.addTag = function (secId: string) {
    pushUndo();
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    if (!sec) return;
    (sec.tags = sec.tags || []).push('New Tag');
    rerenderResume();
    scheduleAutoSave();
  };
  w.delTag = function (secId: string, idx: number) {
    pushUndo();
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    sec?.tags?.splice(idx, 1);
    rerenderResume();
    scheduleAutoSave();
  };

  // ── AI enhance skill/tag ──
  w.enhanceSkillItem = async function (secId: string, idx: number, type: 'bar' | 'dot' | 'tag', btn: HTMLElement) {
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    const name = type === 'bar' || type === 'dot' ? sec?.skills?.[idx]?.name : sec?.tags?.[idx];
    if (!name) return;
    const orig = btn.innerHTML;
    btn.innerHTML = '⟳';
    (btn as HTMLButtonElement).disabled = true;
    try {
      const res = await fetch('/api/ai/enhance-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bullet: `Skill: ${name}`, context: `Skill for ${w.currentData?.target_role || 'professional'}` }),
      });
      const data = await res.json();
      if (data.success && data.improved) {
        const cleaned = data.improved.replace(/^skill:\s*/i, '').replace(/^[•▸-]\s*/, '').trim();
        pushUndo();
        if ((type === 'bar' || type === 'dot') && sec?.skills?.[idx]) sec.skills[idx].name = cleaned;
        else if (type === 'tag' && sec?.tags?.[idx] !== undefined) sec.tags[idx] = cleaned;
        rerenderResume();
        scheduleAutoSave();
        cb?.onToast('Skill updated!', 'success');
        window.dispatchEvent(new CustomEvent('qcv:credits-changed'));
      }
    } catch {
      /* silent */
    } finally {
      btn.innerHTML = orig;
      (btn as HTMLButtonElement).disabled = false;
    }
  };

  // ── Table operations ──
  const _tbl = (secId: string) => w.currentData?.sections?.find((s: AnyData) => s.id === secId)?.tableData;

  w.tableCellEdit = function (secId: string, ri: number, ci: number, val: string) {
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    if (sec?.tableData?.rows?.[ri]) {
      sec.tableData.rows[ri][ci] = val;
      scheduleAutoSave();
    }
  };
  w.tableAddRow = function (secId: string) {
    pushUndo();
    const s = _tbl(secId);
    if (!s) return;
    s.rows.push(Array(s.colWidths.length).fill(''));
    rerenderResume();
    scheduleAutoSave();
  };
  w.tableDelRow = function (secId: string) {
    pushUndo();
    const s = _tbl(secId);
    if (!s || s.rows.length <= 1) return;
    s.rows.pop();
    rerenderResume();
    scheduleAutoSave();
  };
  w.tableAddCol = function (secId: string) {
    pushUndo();
    const s = _tbl(secId);
    if (!s) return;
    const n = s.colWidths.length;
    s.colWidths = Array(n + 1).fill(Math.floor(100 / (n + 1)));
    s.rows = s.rows.map((r: string[]) => [...r, '']);
    rerenderResume();
    scheduleAutoSave();
  };
  w.tableDelCol = function (secId: string) {
    pushUndo();
    const s = _tbl(secId);
    if (!s || s.colWidths.length <= 1) return;
    s.colWidths.pop();
    s.rows = s.rows.map((r: string[]) => {
      r.pop();
      return r;
    });
    rerenderResume();
    scheduleAutoSave();
  };
  w.tableToggleHeader = function (secId: string) {
    pushUndo();
    const s = _tbl(secId);
    if (s) {
      s.hasHeader = !s.hasHeader;
      rerenderResume();
      scheduleAutoSave();
    }
  };

  let resizing: { secId: string; ci: number; startX: number; startWidths: number[] } | null = null;
  w.tableStartResize = function (e: MouseEvent, secId: string, ci: number) {
    e.preventDefault();
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    if (!sec?.tableData) return;
    resizing = { secId, ci, startX: e.clientX, startWidths: [...sec.tableData.colWidths] };

    const onMove = (ev: MouseEvent) => {
      if (!resizing) return;
      const dx = ev.clientX - resizing.startX;
      const tbl = document.querySelector(`[data-tbl-id="${resizing.secId}"]`) as HTMLElement | null;
      if (!tbl) return;
      const dPct = (dx / tbl.offsetWidth) * 100;
      const s2 = w.currentData?.sections?.find((s: AnyData) => s.id === resizing!.secId);
      if (!s2?.tableData) return;
      const nw = [...resizing.startWidths];
      const ni = resizing.ci + 1;
      if (ni >= nw.length) return;
      nw[resizing.ci] = Math.max(8, resizing.startWidths[resizing.ci] + dPct);
      nw[ni] = Math.max(8, resizing.startWidths[ni] - dPct);
      s2.tableData.colWidths = nw;
      tbl.querySelectorAll('col').forEach((c, i) => {
        (c as HTMLElement).style.width = nw[i] + '%';
      });
    };
    const onUp = () => {
      resizing = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      scheduleAutoSave();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // ── Entries / bullets ──
  w.addBullet = function (secId: string, entryId: string) {
    pushUndo();
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    const en = sec?.entries?.find((e: AnyData) => e.id === entryId);
    if (!en) return;
    (en.bullets = en.bullets || []).push('New bullet point — click to edit');
    rerenderResume();
    scheduleAutoSave();
  };
  w.deleteBullet = function (secId: string, entryId: string, bulIdx: number) {
    pushUndo();
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    const en = sec?.entries?.find((e: AnyData) => e.id === entryId);
    if (!en?.bullets) return;
    en.bullets.splice(bulIdx, 1);
    rerenderResume();
    scheduleAutoSave();
  };
  w.addEntry = function (secId: string) {
    pushUndo();
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    if (!sec) return;
    (sec.entries = sec.entries || []).push({ id: euid(), title: 'New Entry', subtitle: '', bullets: ['Add details here'] });
    rerenderResume();
    scheduleAutoSave();
  };
  w.deleteEntry = function (secId: string, entryId: string) {
    pushUndo();
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    if (!sec?.entries) return;
    sec.entries = sec.entries.filter((e: AnyData) => e.id !== entryId);
    rerenderResume();
    scheduleAutoSave();
  };

  // ── AI enhance bullet ──
  w.enhanceBullet = async function (secId: string, entryId: string, bulIdx: number, btn: HTMLElement) {
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    const en = sec?.entries?.find((e: AnyData) => e.id === entryId);
    const bullet = en?.bullets?.[bulIdx];
    if (!bullet) return;
    const orig = btn.innerHTML;
    btn.innerHTML = '⟳';
    (btn as HTMLButtonElement).disabled = true;
    try {
      const res = await fetch('/api/ai/enhance-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bullet, context: `${en.title || ''} at ${en.subtitle || ''}` }),
      });
      const data = await res.json();
      if (data.success && data.improved) {
        pushUndo();
        en.bullets[bulIdx] = data.improved;
        rerenderResume();
        scheduleAutoSave();
        cb?.onToast('Bullet enhanced!', 'success');
        window.dispatchEvent(new CustomEvent('qcv:credits-changed'));
      }
    } catch {
      /* silent */
    } finally {
      btn.innerHTML = orig;
      (btn as HTMLButtonElement).disabled = false;
    }
  };

  // ── Section controls ──
  w.deleteSection = function (secId: string) {
    pushUndo();
    w.currentData.sections = w.currentData.sections.filter((s: AnyData) => s.id !== secId);
    rerenderResume();
    scheduleAutoSave();
  };
  w.moveSection = function (secId: string, dir: number) {
    const secs = [...w.currentData.sections].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
    const idx = secs.findIndex((s: AnyData) => s.id === secId);
    const si = idx + dir;
    if (si < 0 || si >= secs.length) return;
    pushUndo();
    const tmp = secs[idx].order;
    secs[idx].order = secs[si].order;
    secs[si].order = tmp;
    w.currentData.sections = secs;
    rerenderResume();
    scheduleAutoSave();
  };

  // ── Standalone bullet-list section ──
  w.editBulletListItem = function (secId: string, idx: number, val: string) {
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    if (sec?.bullets) {
      sec.bullets[idx] = val;
      scheduleAutoSave();
    }
  };
  w.addBulletListItem = function (secId: string) {
    pushUndo();
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    if (!sec) return;
    (sec.bullets = sec.bullets || []).push('New bullet point — click to edit');
    rerenderResume();
    scheduleAutoSave();
  };
  w.deleteBulletListItem = function (secId: string, idx: number) {
    pushUndo();
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    sec?.bullets?.splice(idx, 1);
    rerenderResume();
    scheduleAutoSave();
  };
  w.moveBulletListItem = function (secId: string, idx: number, dir: number) {
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    if (!sec?.bullets) return;
    const ni = idx + dir;
    if (ni < 0 || ni >= sec.bullets.length) return;
    pushUndo();
    [sec.bullets[idx], sec.bullets[ni]] = [sec.bullets[ni], sec.bullets[idx]];
    rerenderResume();
    scheduleAutoSave();
  };
  w.enhanceBulletListItem = async function (secId: string, idx: number, btn: HTMLElement) {
    const sec = w.currentData?.sections?.find((s: AnyData) => s.id === secId);
    const bullet = sec?.bullets?.[idx];
    if (!bullet) return;
    const orig = btn.innerHTML;
    btn.innerHTML = '⟳';
    (btn as HTMLButtonElement).disabled = true;
    try {
      const res = await fetch('/api/ai/enhance-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bullet, context: sec.title || '' }),
      });
      const data = await res.json();
      if (data.success && data.improved) {
        pushUndo();
        sec.bullets[idx] = data.improved;
        rerenderResume();
        scheduleAutoSave();
        cb?.onToast('Bullet enhanced!', 'success');
        window.dispatchEvent(new CustomEvent('qcv:credits-changed'));
      }
    } catch {
      /* silent */
    } finally {
      btn.innerHTML = orig;
      (btn as HTMLButtonElement).disabled = false;
    }
  };

  // ── Photo ──
  w.triggerPhotoUpload = function () {
    (document.getElementById('photo-file-input') as HTMLInputElement | null)?.click();
  };
  w.handlePhotoUpload = function (input: HTMLInputElement) {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (!w.currentData.layout_config) w.currentData.layout_config = {};
      w.currentData.layout_config.photo_data_url = ev.target?.result;
      w.currentData.layout_config.show_photo = true;
      rerenderResume();
      scheduleAutoSave();
    };
    reader.readAsDataURL(file);
  };
  w.setShowPhoto = function (show: boolean) {
    if (!w.currentData) return;
    if (!w.currentData.layout_config) w.currentData.layout_config = {};
    w.currentData.layout_config.show_photo = show;
    rerenderResume();
    scheduleAutoSave();
  };

  w.scheduleAutoSave = scheduleAutoSave;
}

// ─────────────────────────────────────────────────────────
// DRAG & DROP SECTION REORDER
// ─────────────────────────────────────────────────────────

export function initDragSections() {
  if (!contentEl) return;
  contentEl.querySelectorAll('[data-sec-id]').forEach((el) => {
    const element = el as HTMLElement;
    const handle = element.querySelector('.sec-drag-handle') as HTMLElement | null;
    if (!handle) return;

    handle.setAttribute('draggable', 'true');

    handle.addEventListener('dragstart', (ev) => {
      dragSrcId = element.getAttribute('data-sec-id');
      (ev as DragEvent).dataTransfer!.effectAllowed = 'move';
      (ev as DragEvent).dataTransfer!.setData('text/plain', dragSrcId || '');
      setTimeout(() => element.classList.add('dragging'), 0);
    });

    handle.addEventListener('dragend', () => {
      element.classList.remove('dragging');
      contentEl?.querySelectorAll('[data-sec-id]').forEach((x) => x.classList.remove('drag-over'));
      dragSrcId = null;
    });

    element.addEventListener('dragover', (ev) => {
      ev.preventDefault();
      (ev as DragEvent).dataTransfer!.dropEffect = 'move';
      contentEl?.querySelectorAll('[data-sec-id]').forEach((x) => x.classList.remove('drag-over'));
      if (element.getAttribute('data-sec-id') !== dragSrcId) element.classList.add('drag-over');
    });

    element.addEventListener('dragleave', (ev) => {
      if (!element.contains((ev as DragEvent).relatedTarget as Node)) element.classList.remove('drag-over');
    });

    element.addEventListener('drop', (ev) => {
      ev.preventDefault();
      element.classList.remove('drag-over');
      const targetId = element.getAttribute('data-sec-id');
      if (!dragSrcId || !targetId || dragSrcId === targetId) return;
      pushUndo();
      const data = (window as any).currentData;
      const s1 = data.sections.find((s: AnyData) => s.id === dragSrcId);
      const s2 = data.sections.find((s: AnyData) => s.id === targetId);
      if (s1 && s2) {
        const tmp = s1.order;
        s1.order = s2.order;
        s2.order = tmp;
        rerenderResume();
        scheduleAutoSave();
      }
    });
  });
}

// ─────────────────────────────────────────────────────────
// ADD SECTIONS
// ─────────────────────────────────────────────────────────

export function addSection(type: keyof typeof SECTION_DEFS) {
  const w = window as any;
  if (!w.currentData) w.currentData = { sections: [], layout_config: {} };
  pushUndo();
  const defFn = SECTION_DEFS[type];
  if (!defFn) return;
  const sec = defFn();
  sec.order = maxOrder() + 1;
  w.currentData.sections = [...(w.currentData.sections || []), sec];
  cb?.onPreviewShow();
  rerenderResume();
  scheduleAutoSave();
  cb?.onToast(`${sec.title} section added — click to edit`, 'success');
}

export function addDivider(style: string) {
  const w = window as any;
  if (!w.currentData) w.currentData = { sections: [], layout_config: {} };
  pushUndo();
  w.currentData.sections.push({ id: uid(), type: 'divider', style, order: maxOrder() + 1 });
  cb?.onPreviewShow();
  rerenderResume();
  scheduleAutoSave();
}

// ─────────────────────────────────────────────────────────
// COLOR / FONT
// ─────────────────────────────────────────────────────────

export const COLOR_PRESETS = ['#2058e8', '#1e293b', '#059669', '#991b1b', '#4338ca', '#0d9488', '#b45309', '#7c3aed', '#be123c', '#475569', '#0284c7', '#0f1f3d', '#c2410c', '#166534', '#374151'];

export const FONTS = [
  { id: 'dm-sans', name: 'DM Sans', css: "'DM Sans',system-ui,sans-serif", gUrl: 'DM+Sans:wght@400;500;600;700' },
  { id: 'syne', name: 'Syne', css: "'Syne',system-ui,sans-serif", gUrl: 'Syne:wght@400;600;700;800' },
  { id: 'merriweather', name: 'Merriweather', css: "'Merriweather',Georgia,serif", gUrl: 'Merriweather:wght@300;400;700' },
  { id: 'playfair', name: 'Playfair Display', css: "'Playfair Display',Georgia,serif", gUrl: 'Playfair+Display:wght@400;600;700' },
  { id: 'georgia', name: 'Georgia', css: "Georgia,'Times New Roman',serif", gUrl: null as string | null },
  { id: 'jetbrains', name: 'JetBrains Mono', css: "'JetBrains Mono',monospace", gUrl: 'JetBrains+Mono:wght@400;500' },
];

export function applyColor(hex: string) {
  (window as any).ACCENT = hex;
  if ((window as any).currentData?.layout_config) (window as any).currentData.layout_config.accent_color = hex;
  cb?.onColorChange(hex);
  rerenderResume();
  scheduleAutoSave();
}

export function setFont(id: string) {
  currentFont = id;
  const f = FONTS.find((x) => x.id === id);
  if (!f || !contentEl) return;
  contentEl.style.fontFamily = f.css;
  if ((window as any).currentData?.layout_config) (window as any).currentData.layout_config.font_id = id;
  if (f.gUrl) {
    let link = document.getElementById('dyn-font-link') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = 'dyn-font-link';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${f.gUrl}&display=swap`;
  }
  scheduleAutoSave();
}

export function setFontScale(scale: number) {
  fontScale = scale;
  if (contentEl) contentEl.style.fontSize = scale + 'em';
  if ((window as any).currentData?.layout_config) (window as any).currentData.layout_config.font_scale = scale;
  scheduleAutoSave();
}

export function selectTemplate(tplId: string) {
  const tpl = TEMPLATES.find((t) => t.id === tplId);
  if (!tpl) return;
  (window as any).ACTIVE_TPL = tpl;
  if ((window as any).currentData?.layout_config) (window as any).currentData.layout_config.template_id = tplId;
  cb?.onTemplateChange(tpl);
  if ((window as any).currentData) rerenderResume();
  cb?.onToast(`Template: ${tpl.name}`, 'info');
  scheduleAutoSave();
}

// ─────────────────────────────────────────────────────────
// AI GENERATE
// ─────────────────────────────────────────────────────────

export async function generateResume(params: { rawData: string; jobDescription: string; country: string; role: string }) {
  if (!params.rawData.trim()) {
    cb?.onToast('Paste your career data first.', 'error');
    return;
  }

  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        raw_data: params.rawData,
        job_description: params.jobDescription,
        country: params.country,
        role: params.role,
        resume_id: resumeId,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Generation failed.');

    resumeId = data.resume_id;
    cb?.onResumeIdChange(resumeId!);

    if (data.data?.layout_config?.accent_color) {
      (window as any).ACCENT = data.data.layout_config.accent_color;
      cb?.onColorChange((window as any).ACCENT);
    }

    cb?.onActionBtnsShow();
    streamRevealResume(data.data);
    cb?.onScoresChange(data.data.ats_score || 0, data.data.ai_confidence || 0);
    cb?.onHeaderSync();
    undoStack.length = 0;
    redoStack.length = 0;
    cb?.onUndoRedoChange(false, false);
    cb?.onToast('Resume generated! Click any text to edit.', 'success');
        window.dispatchEvent(new CustomEvent('qcv:credits-changed'));
    return true;
  } catch (err: any) {
    cb?.onToast(err.message ?? 'Generation failed.', 'error');
    return false;
  }
}

// ─────────────────────────────────────────────────────────
// AI CHAT
// ─────────────────────────────────────────────────────────

let chatInFlight = false;

export async function sendChat(message: string) {
  if (!message.trim()) return;
  if (!(window as any).currentData) {
    cb?.onToast('Generate a resume first.', 'error');
    return;
  }
  if (chatInFlight) {
    cb?.onToast('Please wait for the current edit to finish first.', 'info');
    return;
  }
  chatInFlight = true;

  const userMsgId = 'u-' + Date.now();
  cb?.onChatMessage({ id: userMsgId, role: 'user', text: message });

  const typId = 'typ-' + Date.now();
  cb?.onChatMessage({ id: typId, role: 'ai', text: '', typing: true });

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, current_data: (window as any).currentData, resume_id: resumeId }),
    });
    const data = await res.json();
    cb?.onChatMessageRemove(typId);

    if (data.success) {
      cb?.onChatMessage({ id: 'ai-' + Date.now(), role: 'ai', text: data.reply || 'Done! Resume updated.' });
        window.dispatchEvent(new CustomEvent('qcv:credits-changed'));
      pushUndo();
      (window as any).currentData = data.data;
      cb?.onHeaderSync();
      rerenderResume();
      if (data.data.ats_score) cb?.onScoresChange(data.data.ats_score, data.data.ai_confidence || 0);
      scheduleAutoSave();
    } else {
      cb?.onChatMessage({ id: 'ai-' + Date.now(), role: 'ai', text: 'Sorry — ' + (data.message || 'something went wrong.') });
    }
  } catch {
    cb?.onChatMessageRemove(typId);
    cb?.onChatMessage({ id: 'ai-' + Date.now(), role: 'ai', text: 'Network error. Please try again.' });
  } finally {
    chatInFlight = false;
  }
}

// ─────────────────────────────────────────────────────────
// AUTO-SAVE & MANUAL SAVE
// ─────────────────────────────────────────────────────────

export function scheduleAutoSave() {
  cb?.onSaveStatusChange('saving');
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveResume(true), 2400);
}

export async function saveResume(silent = false): Promise<boolean> {
  const data = (window as any).currentData;
  if (!data) return false;

  if (!resumeId) {
    try {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: data.name ? `${data.name} — Resume` : 'My Resume', target_role: data.target_role || '', country: data.country || 'India' }),
      });
      const r = await res.json();
      if (r.success) {
        resumeId = r.resume_id;
        cb?.onResumeIdChange(resumeId!);
        cb?.onActionBtnsShow();
      }
    } catch {
      /* ignore */
    }
  }

  if (!resumeId) return false;

  try {
    const res = await fetch(`/api/resumes/${resumeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generated_data: data, title: data.name ? `${data.name} — Resume` : undefined }),
    });
    const r = await res.json();
    if (r.success) {
      cb?.onSaveStatusChange('saved');
      if (!silent) cb?.onToast('Saved.', 'success');
      return true;
    }
    cb?.onSaveStatusChange('error');
    return false;
  } catch {
    cb?.onSaveStatusChange('error');
    if (!silent) cb?.onToast('Save failed.', 'error');
    return false;
  }
}

// ─────────────────────────────────────────────────────────
// EXPORT — backend-rendered PDF (primary path)
// ─────────────────────────────────────────────────────────

/**
 * Downloads a PDF rendered server-side by Puppeteer, using the exact same
 * template/accent/font the user has selected. This is now the primary
 * export path: it guarantees skill bars/dots/tags/tables render correctly
 * (the old client print() relied on the browser's print CSS handling,
 * which could silently drop them), and produces real selectable/copyable
 * text so ATS systems can actually parse it — not a rasterized screenshot.
 */
export async function downloadPdf(): Promise<boolean> {
  const data = (window as any).currentData;
  if (!data) {
    cb?.onToast('Generate a resume first.', 'error');
    return false;
  }

  // Make sure the resume is saved first so the backend has an id to work with.
  if (!resumeId) {
    const saved = await saveResume(true);
    if (!saved || !resumeId) {
      cb?.onToast('Could not save resume before export.', 'error');
      return false;
    }
  }

  cb?.onToast('Preparing your PDF…', 'info');

  try {
    const res = await fetch(`/api/resumes/${resumeId}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generated_data: data }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Export failed.');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(data.name || 'resume').replaceAll(' ', '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    cb?.onToast('PDF downloaded!', 'success');
    return true;
  } catch (err: any) {
    cb?.onToast(err.message || 'Export failed.', 'error');
    return false;
  }
}

// ─────────────────────────────────────────────────────────
// EXPORT — client-side print (kept as a fallback/alternate option)
// ─────────────────────────────────────────────────────────

export function handleExport(): boolean {
  const data = (window as any).currentData;
  if (!contentEl || !data) {
    cb?.onToast('Generate a resume first.', 'error');
    return false;
  }

  const name = data.name || 'Resume';
  const fontObj = FONTS.find((f) => f.id === currentFont) || FONTS[0];
  const gLink = fontObj.gUrl ? `<link href="https://fonts.googleapis.com/css2?family=${fontObj.gUrl}&display=swap" rel="stylesheet">` : '';

  const win = window.open('', '_blank');
  if (!win) {
    cb?.onToast('Allow popups to export PDF.', 'error');
    return false;
  }

  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${name} — Resume</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  ${gLink}
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{background:white}
    body{
      font-family:${fontObj.css};
      font-size:${fontScale}em;
      color:#0f172a;
      -webkit-print-color-adjust:exact;
      print-color-adjust:exact;
    }
    .resume-wrap{width:210mm;min-height:297mm;padding:14mm 13mm;margin:0 auto;background:white}
    .sec-drag-handle,.sec-controls,.bullet-actions,.add-item-btn,.sec-ctrl-btn,
    .tbl-resize,.skill-step-btn,.skill-move-btn,.skill-enhance-btn,.bullet-enhance-btn,
    button[onclick*="delSkillBar"],button[onclick*="delSkillDot"],button[onclick*="delTag"],
    button[onclick*="addTag"],button[onclick*="triggerPhotoUpload"],button[onclick*="deleteBulletListItem"]{display:none!important}
    [contenteditable]{outline:none!important;cursor:default!important}
    @media print{
      body{margin:0}
      .resume-wrap{width:100%;padding:10mm 12mm;min-height:unset}
    }
  </style>
</head>
<body>
  <div class="resume-wrap">
    ${contentEl.innerHTML}
  </div>
  <script>
    window.onload=()=>{
      window.print();
      setTimeout(()=>window.close(),800);
    };
  <\/script>
</body>
</html>`);
  win.document.close();
  return false;
}

// ─────────────────────────────────────────────────────────
// VERSION HISTORY
// ─────────────────────────────────────────────────────────

export async function fetchVersionHistory(): Promise<{ id: number; version_number: number; label: string; created_at: string }[]> {
  if (!resumeId) return [];
  try {
    const res = await fetch(`/api/resumes/${resumeId}/versions`);
    const data = await res.json();
    return data.versions || [];
  } catch {
    return [];
  }
}

export async function restoreVersion(versionId: number): Promise<boolean> {
  if (!resumeId) return false;
  try {
    const res = await fetch(`/api/resumes/${resumeId}/versions/${versionId}/restore`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      pushUndo();
      (window as any).currentData = data.data;
      rerenderResume();
      cb?.onHeaderSync();
      cb?.onToast('Version restored.', 'success');
      return true;
    }
    return false;
  } catch {
    cb?.onToast('Restore failed.', 'error');
    return false;
  }
}

export function getCurrentResumeId() {
  return resumeId;
}

export function getCurrentData() {
  return (window as any).currentData;
}
