/**
 * src/lib/resume-canvas/sections.ts
 *
 * Direct port of the shared rendering helpers from the original qcv
 * static/js/templates.js and static/js/templatejs.js. These build raw HTML
 * strings with contenteditable elements and onclick/oninput handlers that
 * call window-scoped functions defined in engine.ts.
 *
 * This intentionally is NOT idiomatic React — the resume canvas is rendered
 * via innerHTML and mutated imperatively, exactly like the original app.
 * That's a deliberate choice: contentEditable fights React's virtual DOM
 * (cursor jumps, reconciliation stealing focus), and the original app proves
 * the imperative approach works well for this exact use case.
 */

export type AnyData = Record<string, any>;

/** HTML-escape a value — pure string ops, works in browser AND server (Node has no `document`) */
export function esc(s: unknown): string {
  if (s == null) return '';
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Contact chips joined by separator — each rendered as a clickable link */
export function contacts(data: AnyData, sep = ' · '): string {
  const linkify = (field: string, value: string): string => {
    const v = esc(value);
    if (field === 'email') return `<a href="mailto:${v}" style="color:inherit;text-decoration:none">${v}</a>`;
    if (field === 'phone') return `<a href="tel:${esc(value.replace(/[^+\d]/g, ''))}" style="color:inherit;text-decoration:none">${v}</a>`;
    if (field === 'linkedin' || field === 'github') {
      const href = value.startsWith('http') ? value : `https://${value}`;
      return `<a href="${esc(href)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${v}</a>`;
    }
    return v;
  };
  return ['email', 'phone', 'linkedin', 'github', 'location']
    .filter((f) => data[f])
    .map((f) => linkify(f, data[f]))
    .join(sep);
}

/** Photo placeholder or uploaded image */
export function photoEl(data: AnyData, style = ''): string {
  const showPhoto = !!data?.layout_config?.show_photo;
  if (!showPhoto) return '';
  const src = data?.layout_config?.photo_data_url;
  return `<div onclick="typeof triggerPhotoUpload!=='undefined'&&triggerPhotoUpload()" title="Click to change photo"
    style="width:68px;height:68px;border-radius:50%;overflow:hidden;cursor:pointer;
      flex-shrink:0;display:flex;align-items:center;justify-content:center;
      background:${src ? 'transparent' : '#f1f5f9'};border:2px solid #e2e8f0;${style}">
    ${
      src
        ? `<img src="${src}" style="width:100%;height:100%;object-fit:cover">`
        : `<span style="font-size:1.4rem">📷</span>`
    }
  </div>`;
}

/** Styled, editable section heading */
export function secHead(title: string, ac: string, secId?: string): string {
  const handler = secId
    ? `oninput="typeof updateSecTitle!=='undefined'&&updateSecTitle('${secId}',this.textContent)"`
    : '';
  return `<div contenteditable="true" spellcheck="false" ${handler}
    style="font-size:0.67rem;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;
      color:${ac};border-bottom:1.5px solid ${ac}33;padding-bottom:3px;margin-bottom:8px;
      outline:none;border-radius:2px;cursor:text">${esc(title)}</div>`;
}

/** Drag handle + move/delete controls */
export function secCtrl(secId: string): string {
  return `
  <div class="sec-drag-handle" title="Drag to reorder">
    <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
      <circle cx="3" cy="2"  r="1.2" fill="currentColor"/>
      <circle cx="7" cy="2"  r="1.2" fill="currentColor"/>
      <circle cx="3" cy="7"  r="1.2" fill="currentColor"/>
      <circle cx="7" cy="7"  r="1.2" fill="currentColor"/>
      <circle cx="3" cy="12" r="1.2" fill="currentColor"/>
      <circle cx="7" cy="12" r="1.2" fill="currentColor"/>
    </svg>
  </div>
  <div class="sec-controls">
    <button class="sec-ctrl-btn" onclick="typeof moveSection!=='undefined'&&moveSection('${secId}',-1)" title="Move up">▲</button>
    <button class="sec-ctrl-btn" onclick="typeof moveSection!=='undefined'&&moveSection('${secId}', 1)" title="Move down">▼</button>
    <button class="sec-ctrl-btn del" onclick="typeof deleteSection!=='undefined'&&deleteSection('${secId}')" title="Delete">✕</button>
  </div>`;
}

/** Single entry (experience / education / project / etc.) */
export function entryHtml(en: AnyData, ac: string, secId: string, compact = false): string {
  const dateStr = [en.date_start, en.date_end].filter(Boolean).join(' – ');
  const fs = compact ? '0.76' : '0.82';
  const bfs = compact ? '0.73' : '0.78';
  const mb = compact ? '6px' : '10px';

  return `<div style="margin-bottom:${mb}">
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;min-width:0">
      <div contenteditable="true" spellcheck="false"
        style="font-size:${fs}rem;font-weight:700;color:#0f172a;flex:1;min-width:0;
          outline:none;border-radius:2px;word-break:break-word;cursor:text"
        oninput="typeof handleEdit!=='undefined'&&handleEdit('title','${secId}','${en.id}',-1,this.textContent)"
      >${esc(en.title)}</div>
      <div contenteditable="true" spellcheck="false"
        style="font-size:0.69rem;color:#64748b;white-space:nowrap;flex-shrink:0;
          font-family:monospace;outline:none;border-radius:2px;cursor:text"
        oninput="typeof handleEdit!=='undefined'&&handleEdit('date','${secId}','${en.id}',-1,this.textContent)"
      >${esc(dateStr)}</div>
    </div>
    ${
      en.subtitle
        ? `<div contenteditable="true" spellcheck="false"
      style="font-size:0.75rem;color:${ac};font-weight:600;margin:1px 0 3px;
        outline:none;border-radius:2px;word-break:break-word;cursor:text"
      oninput="typeof handleEdit!=='undefined'&&handleEdit('subtitle','${secId}','${en.id}',-1,this.textContent)"
    >${esc(en.subtitle)}</div>`
        : ''
    }
    ${en.location ? `<div style="font-size:0.67rem;color:#94a3b8;margin-bottom:2px">📍 ${esc(en.location)}</div>` : ''}
    ${(en.bullets || [])
      .map(
        (b: string, bi: number) => `
      <div style="display:flex;gap:5px;margin-bottom:2px;line-height:1.5;align-items:flex-start;position:relative"
        onmouseenter="this.querySelector('.bullet-actions').style.display='flex'"
        onmouseleave="this.querySelector('.bullet-actions').style.display='none'">
        <span style="color:${ac};flex-shrink:0;margin-top:3px;font-size:0.68rem">▸</span>
        <span contenteditable="true" spellcheck="false"
          style="flex:1;font-size:${bfs}rem;color:#334155;outline:none;border-radius:2px;
            word-break:break-word;cursor:text;line-height:1.55"
          oninput="typeof handleEdit!=='undefined'&&handleEdit('bullet','${secId}','${en.id}',${bi},this.textContent)"
        >${esc(b)}</span>
        <div class="bullet-actions" style="display:none;gap:3px;flex-shrink:0;align-items:center">
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

/** Skill groups (Category: skill1, skill2…) */
export function skillGroupsHtml(sec: AnyData, ac: string): string {
  return (sec.skill_groups || [])
    .map(
      (g: AnyData) => `
    <div style="display:flex;gap:8px;margin-bottom:5px;align-items:flex-start;min-width:0">
      <div contenteditable="true" spellcheck="false"
        style="font-size:0.71rem;font-weight:700;color:#0f172a;min-width:70px;max-width:90px;
          flex-shrink:0;padding-top:1px;outline:none;border-radius:2px;cursor:text"
        oninput="typeof updateSkillGroup!=='undefined'&&updateSkillGroup('${sec.id}','${esc(g.category)}',this.textContent,'cat')"
      >${esc(g.category)}</div>
      <div contenteditable="true" spellcheck="false"
        style="font-size:0.73rem;color:#334155;line-height:1.6;flex:1;min-width:0;
          outline:none;border-radius:2px;cursor:text"
        oninput="typeof updateSkillGroup!=='undefined'&&updateSkillGroup('${sec.id}','${esc(g.category)}',this.textContent,'skills')"
      >${esc((g.skills || []).join(', '))}</div>
    </div>`
    )
    .join('');
}

/** Summary / objective paragraph */
export function summaryHtml(sec: AnyData): string {
  return `<p contenteditable="true" spellcheck="false"
    style="font-size:0.8rem;color:#334155;line-height:1.75;margin:0;
      outline:none;border-radius:2px;word-break:break-word;cursor:text;min-height:1.2em"
    oninput="typeof handleEdit!=='undefined'&&handleEdit('summary','${sec.id}',null,-1,this.textContent)"
  >${esc(sec.summary_text || '')}</p>`;
}

/** Language entries */
export function langHtml(sec: AnyData): string {
  return (sec.entries || [])
    .map(
      (en: AnyData) => `
    <div style="display:flex;justify-content:space-between;font-size:0.77rem;margin-bottom:3px;gap:8px">
      <span style="font-weight:600">${esc(en.title)}</span>
      <span style="color:#64748b;flex-shrink:0">${esc(en.subtitle || '')}</span>
    </div>`
    )
    .join('');
}

/** Skill bars (horizontal progress bars, click-to-set percentage, +/- steppers, reorderable) */
export function skillBarsHtml(sec: AnyData, ac: string): string {
  const n = (sec.skills || []).length;
  return `<div style="display:flex;flex-direction:column;gap:7px">
    ${(sec.skills || [])
      .map(
        (s: AnyData, i: number) => `
      <div class="rp-sbar-item">
        <div class="rp-sbar-row">
          <span class="rp-sbar-name" contenteditable="true" spellcheck="false"
            oninput="typeof editSkillBarName!=='undefined'&&editSkillBarName('${sec.id}',${i},this.textContent)"
          >${esc(s.name)}</span>
          <div class="rp-sbar-right">
            <button class="skill-step-btn" onclick="typeof stepSkillBarLevel!=='undefined'&&stepSkillBarLevel('${sec.id}',${i},-5)" title="Decrease 5%">−</button>
            <span class="rp-sbar-pct">${s.level}%</span>
            <button class="skill-step-btn" onclick="typeof stepSkillBarLevel!=='undefined'&&stepSkillBarLevel('${sec.id}',${i},5)" title="Increase 5%">+</button>
            <button class="skill-enhance-btn"
              onclick="typeof enhanceSkillItem!=='undefined'&&enhanceSkillItem('${sec.id}',${i},'bar',this)">✦</button>
            ${i > 0 ? `<button class="skill-move-btn" onclick="typeof moveSkillItem!=='undefined'&&moveSkillItem('${sec.id}',${i},-1)" title="Move up">▲</button>` : ''}
            ${i < n - 1 ? `<button class="skill-move-btn" onclick="typeof moveSkillItem!=='undefined'&&moveSkillItem('${sec.id}',${i},1)" title="Move down">▼</button>` : ''}
            <button onclick="typeof delSkillBar!=='undefined'&&delSkillBar('${sec.id}',${i})"
              style="font-size:.55rem;padding:1px 4px;border:1px solid #e2e8f0;
                border-radius:3px;background:none;cursor:pointer;color:#ef4444">✕</button>
          </div>
        </div>
        <div class="rp-sbar-track"
          onclick="typeof setSkillBarLevel!=='undefined'&&setSkillBarLevel('${sec.id}',${i},event)">
          <div class="rp-sbar-fill" style="width:${s.level}%;background:${ac}"></div>
        </div>
      </div>`
      )
      .join('')}
    <button onclick="typeof addSkillBar!=='undefined'&&addSkillBar('${sec.id}')"
      class="add-item-btn">+ Add Skill</button>
  </div>`;
}

/** Skill dots (5-dot rating, click a dot to set the level, reorderable) */
export function skillDotsHtml(sec: AnyData, ac: string): string {
  const n = (sec.skills || []).length;
  return `<div style="display:flex;flex-direction:column;gap:6px">
    ${(sec.skills || [])
      .map(
        (s: AnyData, i: number) => `
      <div class="rp-sdot-item">
        <span class="rp-sdot-name" contenteditable="true" spellcheck="false"
          oninput="typeof editSkillDotName!=='undefined'&&editSkillDotName('${sec.id}',${i},this.textContent)"
        >${esc(s.name)}</span>
        <div style="display:flex;align-items:center;gap:5px;flex-shrink:0">
          ${[1, 2, 3, 4, 5]
            .map(
              (d) => `<div class="rp-dot ${s.level >= d ? 'filled' : ''}" style="color:${ac}"
            onclick="typeof setSkillDotLevel!=='undefined'&&setSkillDotLevel('${sec.id}',${i},${d})" title="${d}/5"></div>`
            )
            .join('')}
          <button class="skill-enhance-btn"
            onclick="typeof enhanceSkillItem!=='undefined'&&enhanceSkillItem('${sec.id}',${i},'dot',this)">✦</button>
          ${i > 0 ? `<button class="skill-move-btn" onclick="typeof moveSkillItem!=='undefined'&&moveSkillItem('${sec.id}',${i},-1)" title="Move up">▲</button>` : ''}
          ${i < n - 1 ? `<button class="skill-move-btn" onclick="typeof moveSkillItem!=='undefined'&&moveSkillItem('${sec.id}',${i},1)" title="Move down">▼</button>` : ''}
          <button onclick="typeof delSkillDot!=='undefined'&&delSkillDot('${sec.id}',${i})"
            style="font-size:.55rem;padding:1px 4px;border:1px solid #e2e8f0;
              border-radius:3px;background:none;cursor:pointer;color:#ef4444">✕</button>
        </div>
      </div>`
      )
      .join('')}
    <button onclick="typeof addSkillDot!=='undefined'&&addSkillDot('${sec.id}')"
      class="add-item-btn">+ Add Skill</button>
  </div>`;
}

/** Skill tags (pill chips, editable inline, add/remove) */
export function skillTagsHtml(sec: AnyData, ac: string): string {
  return `<div style="display:flex;flex-wrap:wrap;gap:6px">
    ${(sec.tags || [])
      .map(
        (tag: string, i: number) => `
      <div style="display:flex;align-items:center;gap:3px;background:${ac}15;
        border:1px solid ${ac}33;border-radius:20px;padding:3px 10px">
        <span contenteditable="true" spellcheck="false"
          style="font-size:0.72rem;font-weight:600;color:${ac};outline:none;cursor:text;min-width:20px"
          oninput="typeof editTag!=='undefined'&&editTag('${sec.id}',${i},this.textContent)"
        >${esc(tag)}</span>
        <button onclick="typeof delTag!=='undefined'&&delTag('${sec.id}',${i})"
          style="font-size:.6rem;border:none;background:none;color:${ac};cursor:pointer;padding:0 2px;line-height:1">✕</button>
      </div>`
      )
      .join('')}
    <button onclick="typeof addTag!=='undefined'&&addTag('${sec.id}')" class="add-item-btn"
      style="font-size:0.72rem;padding:3px 10px;border:1.5px dashed ${ac}55;border-radius:20px;
        background:none;color:${ac};cursor:pointer;font-weight:600;width:auto;margin-top:0">+ Tag</button>
  </div>`;
}

/** Table section — editable cells, column resize, add/remove row/col, header toggle */
export function tableHtml(sec: AnyData, ac: string): string {
  const td = sec.tableData || { hasHeader: true, colWidths: [50, 50], rows: [['A', 'B'], ['', '']] };
  const cols = td.colWidths.map((w: number) => `<col style="width:${w}%">`).join('');
  const rows = td.rows
    .map((row: string[], ri: number) => {
      const isHeader = td.hasHeader && ri === 0;
      const cells = row
        .map(
          (cell, ci) => `
        <td style="padding:5px 8px;border:1px solid #e2e8f0;font-size:0.76rem;
          ${isHeader ? `background:${ac}18;font-weight:700;` : ''}
          position:relative;vertical-align:top">
          <span contenteditable="true" spellcheck="false" style="outline:none;display:block;cursor:text"
            oninput="typeof tableCellEdit!=='undefined'&&tableCellEdit('${sec.id}',${ri},${ci},this.textContent)"
          >${esc(cell)}</span>
          ${
            ri === 0 && ci < row.length - 1
              ? `<div class="tbl-resize" onmousedown="typeof tableStartResize!=='undefined'&&tableStartResize(event,'${sec.id}',${ci})"
                style="position:absolute;right:-2px;top:0;bottom:0;width:4px;cursor:col-resize;z-index:2"></div>`
              : ''
          }
        </td>`
        )
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `<div>
    <table data-tbl-id="${sec.id}" style="width:100%;border-collapse:collapse">
      <colgroup>${cols}</colgroup>
      <tbody>${rows}</tbody>
    </table>
    <div style="display:flex;gap:5px;margin-top:6px;flex-wrap:wrap">
      <button onclick="typeof tableAddRow!=='undefined'&&tableAddRow('${sec.id}')" class="add-item-btn" style="flex:1">+ Row</button>
      <button onclick="typeof tableDelRow!=='undefined'&&tableDelRow('${sec.id}')" class="add-item-btn" style="flex:1">− Row</button>
      <button onclick="typeof tableAddCol!=='undefined'&&tableAddCol('${sec.id}')" class="add-item-btn" style="flex:1">+ Col</button>
      <button onclick="typeof tableDelCol!=='undefined'&&tableDelCol('${sec.id}')" class="add-item-btn" style="flex:1">− Col</button>
      <button onclick="typeof tableToggleHeader!=='undefined'&&tableToggleHeader('${sec.id}')" class="add-item-btn" style="flex:1">Header</button>
    </div>
  </div>`;
}

/** Standalone flat bullet-point list section (not nested in an entry) */
export function bulletListHtml(sec: AnyData, ac: string): string {
  const n = (sec.bullets || []).length;
  return `<ul style="padding-left:11px;margin:0">
    ${(sec.bullets || [])
      .map(
        (b: string, i: number) => `
      <li style="display:flex;gap:5px;margin-bottom:3px;line-height:1.5;align-items:flex-start;list-style:none;position:relative"
        onmouseenter="this.querySelector('.bullet-actions').style.display='flex'"
        onmouseleave="this.querySelector('.bullet-actions').style.display='none'">
        <span style="color:${ac};flex-shrink:0;margin-top:2px;font-size:0.68rem">▸</span>
        <span contenteditable="true" spellcheck="false"
          style="flex:1;font-size:0.8rem;color:#334155;outline:none;border-radius:2px;cursor:text"
          oninput="typeof editBulletListItem!=='undefined'&&editBulletListItem('${sec.id}',${i},this.textContent)"
        >${esc(b)}</span>
        <div class="bullet-actions" style="display:none;gap:3px;flex-shrink:0;align-items:center">
          <button class="bullet-enhance-btn" onclick="typeof enhanceBulletListItem!=='undefined'&&enhanceBulletListItem('${sec.id}',${i},this)">✦ AI</button>
          ${i > 0 ? `<button class="skill-move-btn" onclick="typeof moveBulletListItem!=='undefined'&&moveBulletListItem('${sec.id}',${i},-1)" title="Move up">▲</button>` : ''}
          ${i < n - 1 ? `<button class="skill-move-btn" onclick="typeof moveBulletListItem!=='undefined'&&moveBulletListItem('${sec.id}',${i},1)" title="Move down">▼</button>` : ''}
          <button onclick="typeof deleteBulletListItem!=='undefined'&&deleteBulletListItem('${sec.id}',${i})"
            style="font-size:.6rem;padding:1px 4px;border:1px solid #e2e8f0;border-radius:3px;background:none;cursor:pointer;color:#ef4444">✕</button>
        </div>
      </li>`
      )
      .join('')}
  </ul>
  <button onclick="typeof addBulletListItem!=='undefined'&&addBulletListItem('${sec.id}')" class="add-item-btn">+ Add bullet point</button>`;
}

export function dividerHtml(style: string, ac: string): string {
  const styles: Record<string, string> = {
    solid: `border-top:1.5px solid ${ac};margin:4px 0`,
    dashed: `border-top:1.5px dashed ${ac}66;margin:4px 0`,
    double: `border-top:3px double ${ac};margin:4px 0`,
    dotted: `border-top:2.5px dotted ${ac};margin:4px 0`,
    thick: `border-top:5px solid ${ac};border-radius:2px;margin:4px 0`,
    none: `margin:10px 0`,
  };
  return `<div style="${styles[style] || styles.solid}"></div>`;
}

/** Dispatch section body rendering by type */
export function renderSection(sec: AnyData, ac: string, compact = false): string {
  switch (sec.type) {
    case 'summary':
    case 'objective':
    case 'profile':
    case 'personal_statement':
    case 'custom-text':
      return summaryHtml(sec);
    case 'skills':
      return skillGroupsHtml(sec, ac);
    case 'skills-bars':
      return skillBarsHtml(sec, ac);
    case 'skills-dots':
      return skillDotsHtml(sec, ac);
    case 'skills-tags':
      return skillTagsHtml(sec, ac);
    case 'languages':
      return langHtml(sec);
    case 'bullet-list':
      return bulletListHtml(sec, ac);
    case 'table':
      return tableHtml(sec, ac);
    case 'divider':
      return dividerHtml(sec.style, ac);
    default:
      return `<div>${(sec.entries || []).map((en: AnyData) => entryHtml(en, ac, sec.id, compact)).join('')}</div>
        <button onclick="typeof addEntry!=='undefined'&&addEntry('${sec.id}')"
          class="add-item-btn" style="margin-top:4px">+ Add Entry</button>`;
  }
}

/** Wrap a section body with drag handle + heading + controls */
export function wrapSec(sec: AnyData, ac: string, compact = false): string {
  if (sec.type === 'divider') {
    return `<div data-sec-id="${sec.id}" style="position:relative;margin:6px 0">
      ${secCtrl(sec.id)}${renderSection(sec, ac)}
    </div>`;
  }
  return `<div data-sec-id="${sec.id}" style="position:relative;margin-bottom:14px">
    ${secCtrl(sec.id)}
    ${secHead(sec.title || '', ac, sec.id)}
    ${renderSection(sec, ac, compact)}
  </div>`;
}

/** Render all sections, sorted by order, optionally filtered by type */
export function allSections(data: AnyData, ac: string, filter: string[] | null = null, compact = false): string {
  let secs = [...(data.sections || [])].sort((a: AnyData, b: AnyData) => (a.order || 0) - (b.order || 0));
  if (filter) secs = secs.filter((s: AnyData) => filter.includes(s.type));
  return secs.map((sec: AnyData) => (sec && sec.id ? wrapSec(sec, ac, compact) : '')).join('');
}

/** Compact sidebar rendering for two-column templates */
export function sideContent(sec: AnyData, ac: string): string {
  const t = sec.type;
  if (t === 'skills' && sec.skill_groups) {
    return sec.skill_groups
      .map(
        (g: AnyData) => `
      <div style="margin-bottom:7px;overflow:hidden">
        <div style="font-size:0.62rem;font-weight:700;margin-bottom:2px;word-break:break-word">${esc(g.category)}</div>
        <div style="font-size:0.62rem;opacity:.85;line-height:1.6;word-break:break-word;overflow-wrap:anywhere">${esc((g.skills || []).join(', '))}</div>
      </div>`
      )
      .join('');
  }
  if (t === 'skills-bars' && sec.skills) {
    return sec.skills
      .map(
        (s: AnyData) => `
      <div style="margin-bottom:6px">
        <div style="font-size:0.62rem;font-weight:600;margin-bottom:2px;word-break:break-word">${esc(s.name)}</div>
        <div style="height:4px;background:rgba(255,255,255,.2);border-radius:2px">
          <div style="height:100%;width:${s.level}%;background:${ac};border-radius:2px;opacity:.9"></div>
        </div>
      </div>`
      )
      .join('');
  }
  if (t === 'skills-dots' && sec.skills) {
    return sec.skills
      .map(
        (s: AnyData) => `
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;gap:4px">
        <span style="font-size:0.62rem;font-weight:500;flex:1;word-break:break-word">${esc(s.name)}</span>
        <div style="display:flex;gap:3px;flex-shrink:0">
          ${[1, 2, 3, 4, 5].map((i) => `<div style="width:7px;height:7px;border-radius:50%;background:${i <= s.level ? ac : 'rgba(255,255,255,.25)'}"></div>`).join('')}
        </div>
      </div>`
      )
      .join('');
  }
  if (t === 'skills-tags' && sec.tags) {
    return `<div style="display:flex;flex-wrap:wrap;gap:3px">
      ${sec.tags.map((tag: string) => `<span style="font-size:0.58rem;padding:2px 6px;background:rgba(255,255,255,.15);border-radius:100px">${esc(tag)}</span>`).join('')}
    </div>`;
  }
  if (t === 'languages') return langHtml(sec);
  return (sec.entries || [])
    .map(
      (en: AnyData) => `
    <div style="margin-bottom:6px;overflow:hidden">
      <div style="font-size:0.62rem;font-weight:700;word-break:break-word;line-height:1.3">${esc(en.title)}</div>
      ${en.subtitle ? `<div style="font-size:0.6rem;opacity:.8;word-break:break-word">${esc(en.subtitle)}</div>` : ''}
      ${(en.date_start || en.date_end) ? `<div style="font-size:0.59rem;opacity:.65">${esc([en.date_start, en.date_end].filter(Boolean).join('–'))}</div>` : ''}
    </div>`
    )
    .join('');
}

/** Editable name / role header helpers used by templatejs-style templates */
export function editableName(data: AnyData): string {
  return `<div contenteditable="true" spellcheck="false"
    style="outline:none;border-radius:2px;cursor:text;word-break:break-word"
    oninput="if(window.currentData)window.currentData.name=this.textContent;typeof scheduleAutoSave!=='undefined'&&scheduleAutoSave()"
  >${esc(data.name)}</div>`;
}
export function editableRole(data: AnyData, ac: string, styleExtra = ''): string {
  if (!data.target_role) return '';
  return `<div contenteditable="true" spellcheck="false"
    style="outline:none;border-radius:2px;cursor:text;word-break:break-word;color:${ac};${styleExtra}"
    oninput="if(window.currentData)window.currentData.target_role=this.textContent;typeof scheduleAutoSave!=='undefined'&&scheduleAutoSave()"
  >${esc(data.target_role)}</div>`;
}
