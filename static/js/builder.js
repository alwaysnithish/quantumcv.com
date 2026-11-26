/* QuantumCV — Builder JS
   Handles: generation, resume rendering, inline editing,
   drag-drop reordering, autosave, version history, PDF export
*/

// ── GLOBALS ──────────────────────────────────────────────
const CSRF = () => document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '';
let currentResumeId = window.RESUME_ID || null;
let currentData = null;
let saveTimeout = null;
let isDirty = false;

// ── TOAST ─────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<div class="toast-icon"></div><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 4200);
}

// ── CHAR COUNT ────────────────────────────────────────────
function updateCharCount(el, countId) {
  document.getElementById(countId).textContent = el.value.length.toLocaleString();
}

// ── BUTTON STATE ─────────────────────────────────────────
function setBtnLoading(id, loading, text = '') {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.classList.toggle('loading', loading);
  btn.disabled = loading;
  if (text) btn.querySelector('.btn-text').innerHTML = text;
}

// ── GENERATION ────────────────────────────────────────────
async function generateResume() {
  const rawData = document.getElementById('raw-data').value.trim();
  const jd = document.getElementById('job-desc').value.trim();
  const country = document.getElementById('sel-country').value;
  const role = document.getElementById('sel-role').value;

  if (!rawData) {
    showToast('Please paste your career data first.', 'error');
    document.getElementById('raw-data').focus();
    return;
  }

  // Show loading UI
  setBtnLoading('generate-btn', true);
  document.getElementById('gen-progress').classList.add('active');
  document.getElementById('preview-empty').style.display = 'none';

  // Animate progress steps
  const steps = document.querySelectorAll('.progress-step');
  let stepIdx = 0;
  const stepInterval = setInterval(() => {
    steps.forEach((s, i) => {
      s.classList.remove('active', 'done');
      if (i < stepIdx) s.classList.add('done');
      if (i === stepIdx) s.classList.add('active');
    });
    if (stepIdx < steps.length - 1) stepIdx++;
  }, 900);

  try {
    const res = await fetch('/resume/api/generate/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': CSRF() },
      body: JSON.stringify({
        raw_data: rawData,
        job_description: jd,
        country,
        role,
        resume_id: currentResumeId || null
      })
    });

    const data = await res.json();
    clearInterval(stepInterval);

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Generation failed. Please try again.');
    }

    // Mark all steps done
    steps.forEach(s => { s.classList.remove('active'); s.classList.add('done'); });

    // Update state
    currentResumeId = data.resume_id;
    currentData = data.data;

    // Update export link
    const exportBtn = document.getElementById('export-btn');
    exportBtn.href = `/resume/api/export/${currentResumeId}/`;
    exportBtn.style.display = 'flex';
    document.getElementById('save-btn').style.display = 'flex';
    document.getElementById('version-btn').style.display = 'flex';

    // Render resume
    setTimeout(() => {
      document.getElementById('gen-progress').classList.remove('active');
      renderResume(currentData);
      updateScores(currentData.ats_score || 0, currentData.ai_confidence || 0);
      showToast('Resume generated successfully!', 'success');
    }, 500);

  } catch (err) {
    clearInterval(stepInterval);
    document.getElementById('gen-progress').classList.remove('active');
    document.getElementById('preview-empty').style.display = 'flex';
    showToast(err.message, 'error');
  } finally {
    setBtnLoading('generate-btn', false);
    document.querySelector('#generate-btn .btn-text').innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0">
        <path d="M8 1l1.8 5H15l-4.2 3 1.6 5L8 11l-4.4 3 1.6-5L1 6h5.2z" fill="white"/>
      </svg>
      Regenerate
    `;
  }
}

// ── SCORES ────────────────────────────────────────────────
function updateScores(ats, ai) {
  document.getElementById('score-chips').style.display = 'flex';
  document.getElementById('ats-score-val').textContent = ats;
  document.getElementById('ai-score-val').textContent = ai;
  setTimeout(() => {
    document.getElementById('ats-bar').style.width = ats + '%';
    document.getElementById('ai-bar').style.width = ai + '%';
  }, 100);
}

// ── RENDER RESUME ─────────────────────────────────────────
function renderResume(data) {
  const wrap = document.getElementById('resume-paper-wrap');
  wrap.style.display = 'block';
  wrap.innerHTML = '';

  const paper = document.createElement('div');
  paper.className = 'resume-paper';
  paper.id = 'resume-paper';

  // Header
  paper.innerHTML = `
    <div class="rp-header">
      <div class="rp-name" contenteditable="true" data-field="name">${esc(data.name || '')}</div>
      <div class="rp-contacts">
        ${contactItem(data.email, 'email')}
        ${contactItem(data.phone, 'phone')}
        ${contactItem(data.linkedin, 'linkedin')}
        ${contactItem(data.github, 'github')}
        ${contactItem(data.location, 'location')}
      </div>
    </div>
    <div class="rp-divider"></div>
    <div id="rp-sections"></div>
    <div class="rp-watermark">QUANTUMCV · AI-POWERED RESUME · ${new Date().getFullYear()}</div>
  `;

  wrap.appendChild(paper);

  // Render sections
  const sectionsEl = paper.querySelector('#rp-sections');
  (data.sections || []).forEach(sec => {
    sectionsEl.appendChild(renderSection(sec));
  });

  // Setup drag-drop
  initDragDrop(sectionsEl);

  // Auto-save on any edit
  paper.addEventListener('input', scheduleAutoSave);
  paper.addEventListener('blur', () => isDirty && saveResume(true), true);
}

function contactItem(val, field) {
  if (!val) return '';
  return `<span class="rp-contact" contenteditable="true" data-field="${field}" data-placeholder="${field}">${esc(val)}</span>`;
}

function renderSection(sec) {
  const el = document.createElement('div');
  el.className = 'rp-section';
  el.dataset.secId = sec.id;

  let innerHtml = `
    <div class="rp-section-header">
      <div class="rp-section-drag" title="Drag to reorder" draggable="false">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="5" cy="4" r="1.2" fill="currentColor"/>
          <circle cx="9" cy="4" r="1.2" fill="currentColor"/>
          <circle cx="5" cy="7" r="1.2" fill="currentColor"/>
          <circle cx="9" cy="7" r="1.2" fill="currentColor"/>
          <circle cx="5" cy="10" r="1.2" fill="currentColor"/>
          <circle cx="9" cy="10" r="1.2" fill="currentColor"/>
        </svg>
      </div>
      <div class="rp-section-title" contenteditable="true">${esc(sec.title || '')}</div>
    </div>
  `;

  if (sec.type === 'summary' && sec.summary_text) {
    innerHtml += `<div class="rp-summary-text" contenteditable="true">${esc(sec.summary_text)}</div>`;
  } else if (sec.type === 'skills' && sec.skill_groups) {
    innerHtml += renderSkillGroups(sec.skill_groups);
  } else if (sec.entries) {
    innerHtml += sec.entries.map(e => renderEntry(e, sec.type)).join('');
  }

  el.innerHTML = innerHtml;
  return el;
}

function renderEntry(entry, type) {
  const bullets = (entry.bullets || []).map(b => `
    <div class="rp-bullet">
      <span class="rp-bullet-dot">▸</span>
      <span class="rp-bullet-text" contenteditable="true" data-bullet-id="${entry.id}">${esc(b)}</span>
      <div class="rp-bullet-actions">
        <button class="bullet-enhance-btn" onclick="enhanceBullet(this)" title="AI enhance">✦ Enhance</button>
      </div>
    </div>
  `).join('');

  return `
    <div class="rp-entry" data-entry-id="${entry.id}">
      <div class="rp-entry-top">
        <div class="rp-entry-title" contenteditable="true">${esc(entry.title || '')}</div>
        <div class="rp-entry-date" contenteditable="true">${esc(formatDate(entry.date_start, entry.date_end))}</div>
      </div>
      ${entry.subtitle ? `<div class="rp-entry-subtitle" contenteditable="true">${esc(entry.subtitle)}</div>` : ''}
      <div class="rp-bullets">${bullets}</div>
    </div>
  `;
}

function renderSkillGroups(groups) {
  return `<div class="rp-skill-groups">${
    groups.map(g => `
      <div class="rp-skill-group">
        <div class="rp-skill-category" contenteditable="true">${esc(g.category || '')}:</div>
        <div class="rp-skill-list">${
          (g.skills || []).map(s =>
            `<span class="rp-skill-tag" contenteditable="true">${esc(s)}</span>`
          ).join('')
        }</div>
      </div>
    `).join('')
  }</div>`;
}

function formatDate(start, end) {
  if (!start && !end) return '';
  if (start && end) return `${start} – ${end}`;
  return start || end || '';
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ── DRAG & DROP SECTIONS ─────────────────────────────────
function initDragDrop(container) {
  let dragSrc = null;

  function getSections() {
    return Array.from(container.querySelectorAll('.rp-section'));
  }

  getSections().forEach(sec => {
    const handle = sec.querySelector('.rp-section-drag');
    if (!handle) return;

    handle.addEventListener('mousedown', () => { sec.draggable = true; });
    handle.addEventListener('mouseup', () => { sec.draggable = false; });

    sec.addEventListener('dragstart', e => {
      dragSrc = sec;
      sec.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    sec.addEventListener('dragend', () => {
      sec.draggable = false;
      sec.classList.remove('dragging');
      getSections().forEach(s => s.classList.remove('drag-over'));
      dragSrc = null;
      scheduleAutoSave();
    });

    sec.addEventListener('dragover', e => {
      e.preventDefault();
      if (!dragSrc || dragSrc === sec) return;
      getSections().forEach(s => s.classList.remove('drag-over'));
      sec.classList.add('drag-over');
    });

    sec.addEventListener('drop', e => {
      e.preventDefault();
      if (!dragSrc || dragSrc === sec) return;
      const rect = sec.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (e.clientY < mid) container.insertBefore(dragSrc, sec);
      else container.insertBefore(dragSrc, sec.nextSibling);
      getSections().forEach(s => s.classList.remove('drag-over'));
      showToast('Section reordered', 'info');
    });
  });
}

// ── AI ENHANCE BULLET ────────────────────────────────────
async function enhanceBullet(btn) {
  const bulletEl = btn.closest('.rp-bullet').querySelector('.rp-bullet-text');
  const original = bulletEl.textContent.trim();
  if (!original) return;

  const origText = btn.textContent;
  btn.textContent = '...';
  btn.disabled = true;

  const entryEl = btn.closest('.rp-entry');
  const context = entryEl?.querySelector('.rp-entry-title')?.textContent || '';

  try {
    const res = await fetch('/resume/api/enhance-bullet/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': CSRF() },
      body: JSON.stringify({ bullet: original, context })
    });
    const data = await res.json();
    if (data.success) {
      bulletEl.textContent = data.improved;
      bulletEl.style.background = 'rgba(37,99,235,0.06)';
      setTimeout(() => bulletEl.style.background = '', 1500);
      scheduleAutoSave();
      showToast('Bullet enhanced!', 'success');
    } else {
      showToast(data.message, 'error');
    }
  } catch {
    showToast('Enhancement failed. Try again.', 'error');
  } finally {
    btn.textContent = origText;
    btn.disabled = false;
  }
}

// ── COLLECT EDITED DATA ───────────────────────────────────
function collectResumeData() {
  const paper = document.getElementById('resume-paper');
  if (!paper) return null;

  const data = { ...currentData };

  // Header fields
  data.name     = paper.querySelector('[data-field="name"]')?.textContent.trim() || '';
  data.email    = paper.querySelector('[data-field="email"]')?.textContent.trim() || '';
  data.phone    = paper.querySelector('[data-field="phone"]')?.textContent.trim() || '';
  data.linkedin = paper.querySelector('[data-field="linkedin"]')?.textContent.trim() || '';
  data.github   = paper.querySelector('[data-field="github"]')?.textContent.trim() || '';
  data.location = paper.querySelector('[data-field="location"]')?.textContent.trim() || '';

  // Sections (preserve order from DOM)
  data.sections = Array.from(paper.querySelectorAll('.rp-section')).map((secEl, order) => {
    const secId = secEl.dataset.secId;
    const orig = (currentData.sections || []).find(s => s.id === secId) || {};

    const updated = {
      ...orig,
      id: secId,
      order,
      title: secEl.querySelector('.rp-section-title')?.textContent.trim() || orig.title,
    };

    if (orig.type === 'summary') {
      updated.summary_text = secEl.querySelector('.rp-summary-text')?.textContent.trim() || '';
    } else if (orig.type === 'skills') {
      // Collect skill groups
      updated.skill_groups = Array.from(secEl.querySelectorAll('.rp-skill-group')).map(g => ({
        category: g.querySelector('.rp-skill-category')?.textContent.replace(':', '').trim() || '',
        skills: Array.from(g.querySelectorAll('.rp-skill-tag')).map(t => t.textContent.trim()).filter(Boolean)
      }));
    } else {
      // Collect entries
      updated.entries = Array.from(secEl.querySelectorAll('.rp-entry')).map(entEl => {
        const entId = entEl.dataset.entryId;
        const origEntry = (orig.entries || []).find(e => e.id === entId) || {};
        const topParts = entEl.querySelector('.rp-entry-top');
        const dateStr = entEl.querySelector('.rp-entry-date')?.textContent.trim() || '';
        const [dateStart, dateEnd] = dateStr.split('–').map(s => s.trim());

        return {
          ...origEntry,
          id: entId,
          title: entEl.querySelector('.rp-entry-title')?.textContent.trim() || '',
          subtitle: entEl.querySelector('.rp-entry-subtitle')?.textContent.trim() || '',
          date_start: dateStart || '',
          date_end: dateEnd || '',
          bullets: Array.from(entEl.querySelectorAll('.rp-bullet-text')).map(b => b.textContent.trim()).filter(Boolean)
        };
      });
    }

    return updated;
  });

  return data;
}

// ── SAVE ─────────────────────────────────────────────────
function scheduleAutoSave() {
  isDirty = true;
  setSaveStatus('saving');
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveResume(true), 2500);
}

function setSaveStatus(state) {
  const el = document.getElementById('save-status');
  const txt = document.getElementById('save-status-text');
  el.classList.toggle('saving', state === 'saving');
  if (state === 'saving') txt.textContent = 'Saving...';
  else if (state === 'saved') txt.textContent = 'All changes saved';
  else if (state === 'error') txt.textContent = 'Save failed';
}

async function saveResume(silent = false) {
  if (!currentResumeId) return;
  const data = collectResumeData();
  if (!data) return;

  try {
    const res = await fetch(`/resume/api/save/${currentResumeId}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': CSRF() },
      body: JSON.stringify({
        generated_data: data,
        raw_data: document.getElementById('raw-data').value,
        job_description: document.getElementById('job-desc').value,
      })
    });
    const result = await res.json();
    if (result.success) {
      isDirty = false;
      setSaveStatus('saved');
      if (!silent) showToast('Saved successfully.', 'success');
    } else {
      setSaveStatus('error');
    }
  } catch {
    setSaveStatus('error');
    if (!silent) showToast('Save failed. Check your connection.', 'error');
  }
}

// ── VERSION HISTORY ───────────────────────────────────────
async function toggleVersionDrawer() {
  const drawer = document.getElementById('version-drawer');
  const isOpen = drawer.classList.contains('open');

  if (!isOpen && currentResumeId) {
    await loadVersions();
  }
  drawer.classList.toggle('open');
}

async function loadVersions() {
  const list = document.getElementById('version-list');
  list.innerHTML = '<p style="padding:12px;color:var(--text4);font-size:0.85rem;">Loading...</p>';

  try {
    const res = await fetch(`/resume/api/versions/${currentResumeId}/`);
    const data = await res.json();

    if (!data.versions.length) {
      list.innerHTML = '<p style="padding:12px;color:var(--text4);font-size:0.85rem;">No saved versions yet. Versions are created automatically each time you save.</p>';
      return;
    }

    list.innerHTML = data.versions.map(v => `
      <div class="version-item" onclick="restoreVersion(${v.id})">
        <div class="version-item-num">v${v.version_number}</div>
        <div class="version-item-label">${v.label}</div>
        <div class="version-item-date">${v.created_at}</div>
      </div>
    `).join('');
  } catch {
    list.innerHTML = '<p style="padding:12px;color:var(--danger);font-size:0.85rem;">Failed to load versions.</p>';
  }
}

async function restoreVersion(versionId) {
  if (!confirm('Restore this version? Your current edits will be replaced.')) return;

  try {
    const res = await fetch(`/resume/api/restore/${currentResumeId}/${versionId}/`);
    const data = await res.json();
    if (data.success) {
      currentData = data.data;
      renderResume(currentData);
      document.getElementById('version-drawer').classList.remove('open');
      showToast('Version restored.', 'success');
    }
  } catch {
    showToast('Restore failed.', 'error');
  }
}

// ── INIT ON LOAD ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Populate char counts
  const rawEl = document.getElementById('raw-data');
  const jdEl = document.getElementById('job-desc');
  if (rawEl) updateCharCount(rawEl, 'raw-count');
  if (jdEl) updateCharCount(jdEl, 'jd-count');

  // If existing resume data provided, render it
  if (window.INITIAL_DATA && typeof window.INITIAL_DATA === 'object') {
    currentData = window.INITIAL_DATA;
    renderResume(currentData);
    updateScores(currentData.ats_score || 0, currentData.ai_confidence || 0);
    document.getElementById('export-btn').href = `/resume/api/export/${currentResumeId}/`;
    document.getElementById('export-btn').style.display = 'flex';
    document.getElementById('save-btn').style.display = 'flex';
    document.getElementById('version-btn').style.display = 'flex';
  }

  // Ctrl/Cmd+S to save
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveResume();
    }
  });

  // Warn before closing with unsaved changes
  window.addEventListener('beforeunload', e => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
});
