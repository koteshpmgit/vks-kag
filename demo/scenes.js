// Key Artifact Generator — Interactive Demo content.
// Shared in-memory "demo data store" + reusable UI builders, then the 13
// scenes (render + optional autoplay script) consumed by app.js.
(function () {
  'use strict';

  // ---------------- Shared demo data ----------------
  const STORE = {
    project: { project_key: '', project_type: '', fp_count: '', start_date: '', technology: '', brief_desc: '', scope: '' },
    application: { app_name: 'PayrollCore', domain: 'HR / Finance', technology: 'Node.js, React, PostgreSQL', description: '' },
    rows: {},
    effort: {
      phases: [
        ['Analysis', 8], ['Design', 11], ['Design Review', 3], ['Coding', 20], ['Code Review', 4],
        ['Unit Testing', 6], ['System Testing', 24], ['PM', 10], ['PAT/UAT Support', 10], ['Other Efforts', 4]
      ].map(([phase, pct]) => ({ phase, pct })),
      startDate: '2026-09-14',
      baseTotalMD: 290
    },
    wbsRows: [],
    protectMode: false
  };
  STORE.rows.hardware = [
    { description: 'Application Server', spec: '8-core / 32GB RAM', qty: '2' },
    { description: 'Load Balancer', spec: 'HA pair', qty: '1' }
  ];
  STORE.rows.hrplan = [
    { role: 'PM', name: 'Alicia Wren', pct: '100' },
    { role: 'Developer', name: 'Ravi Menon', pct: '100' },
    { role: 'Tester', name: 'Khost Fallow', pct: '80' }
  ];
  STORE.rows.risks = [
    { description: 'Vendor API rate limits could delay integration testing' }
  ];
  STORE.rows.resources = [
    { ipn: 'IPN10234', role: 'PM', name: 'Alicia Wren' },
    { ipn: 'IPN10891', role: 'Developer', name: 'Ravi Menon' }
  ];
  STORE.rows.stdMatrix = [
    { activity: 'Requirement Sign-off', team: 'A', remarks: 'VH approval required' },
    { activity: 'Code Review', team: 'R', remarks: 'Peer review, 2 reviewers' }
  ];
  STORE.rows.agenda = [
    { topic: 'Welcome & Introductions' }, { topic: 'Project Scope & Objectives' }
  ];

  const SECTION_DEFS = [
    { id: 'appDetails', title: 'Application Details', group: 'Application-Data', kind: 'form' },
    { id: 'hardware', title: 'Hardware', group: 'Application-Data', cols: [['description', 'Description'], ['spec', 'Confg./Specification'], ['qty', 'Quantity']] },
    { id: 'software', title: 'Software', group: 'Application-Data', cols: [['description', 'Description'], ['version', 'Version'], ['installations', 'No. of Installations']] },
    { id: 'environments', title: 'Development Environments', group: 'Application-Data', cols: [['env', 'Environment'], ['server', 'Server'], ['access', 'Access']] },
    { id: 'dar', title: 'Decision Analysis and Resolution', group: 'Application-Data', cols: [['task', 'Task/Phase'], ['participants', 'Participants']] },
    { id: 'projSummary', title: 'Projects Summary', group: 'Project-Data', kind: 'summary' },
    { id: 'effort', title: 'Estimated Effort', group: 'Project-Data', kind: 'preview-effort' },
    { id: 'milestones', title: 'Milestone Dates', group: 'Project-Data', kind: 'preview-milestones' },
    { id: 'docs', title: 'Items handed over', group: 'Project-Data', cols: [['name', 'Document/Item Name'], ['version', 'Version No.']] },
    { id: 'constraints', title: 'Constraints', group: 'Project-Data', cols: [['description', 'Description']] },
    { id: 'dependencies', title: 'Dependencies', group: 'Project-Data', cols: [['description', 'Description']] },
    { id: 'assumptions', title: 'Assumptions', group: 'Project-Data', cols: [['description', 'Description']] },
    { id: 'risks', title: 'Risks', group: 'Project-Data', cols: [['description', 'Description']] },
    { id: 'training', title: 'Training Plan', group: 'Project-Data', cols: [['name', 'Name of Training'], ['type', 'Type']] },
    { id: 'hrplan', title: 'Human Resource plan — Detail Role-Wise', group: 'Project-Data', cols: [['role', 'Role'], ['name', 'Resource Name'], ['pct', '% Contribution']] },
    { id: 'modules', title: 'Module Details', group: 'Project-Data', cols: [['name', 'Name'], ['description', 'Description']] },
    { id: 'process', title: 'Process Planning', group: 'Project-Data', cols: [['process', 'Process Name'], ['applicable', 'Applicable']] },
    { id: 'goals', title: 'Project Goals (Metrics)', group: 'Project-Data', cols: [['metric', 'Metric Name'], ['target', 'Target']] },
    { id: 'agenda', title: 'Kick-Off Agenda', group: 'Project-Data', cols: [['topic', 'Topic']] },
    { id: 'resources', title: 'Resource-Data', group: 'Resource-Data', cols: [['ipn', 'IPN'], ['role', 'Role'], ['name', 'Full Name']] },
    { id: 'stdRoles', title: 'Roles & Responsibilities', group: 'Standards-Data', cols: [['role', 'Role'], ['responsibility', 'Responsibility']] },
    { id: 'stdTools', title: 'Tools, Methodologies and Techniques', group: 'Standards-Data', cols: [['activity', 'Activity'], ['tools', 'Tools/Templates']] },
    { id: 'stdMatrix', title: 'Stakeholder Matrix', group: 'Standards-Data', cols: [['activity', 'Activity'], ['team', 'Team'], ['remarks', 'Remarks']] },
    { id: 'stdFolders', title: 'Folder Structure', group: 'Standards-Data', cols: [['phase', 'Phase'], ['folder', 'Artifact Folder']] },
    { id: 'stdTasks', title: 'Task Templates (WBS)', group: 'Standards-Data', kind: 'preview-tasks' }
  ];
  const SECTION_BY_ID = Object.fromEntries(SECTION_DEFS.map((s) => [s.id, s]));

  // ---------------- Small HTML helpers ----------------
  function escapeAttr(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function sectionTitle(t) { return `<h2 style="margin:16px 0 8px;font-size:13px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.04em">${t}</h2>`; }
  function smallTbl(cols, rows) {
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>` +
      (rows.length ? rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${cols.length}" class="note">No data yet</td></tr>`) +
      `</tbody></table></div>`;
  }
  function statTile(label, val, id) { return `<div class="stat-tile"><b id="${id}">${val}</b><span>${label}</span></div>`; }

  // ---------------- Generic editable rows table (shared by Wizard + Data Sheet) ----------------
  function rowsTableHTML(sectionId, cols) {
    const rows = STORE.rows[sectionId] || (STORE.rows[sectionId] = []);
    const thead = `<tr>${cols.map(([, label]) => `<th>${label}</th>`).join('')}<th></th></tr>`;
    const tbody = rows.map((r, i) => `<tr data-i="${i}">${cols.map(([key]) =>
      `<td><input data-key="${key}" value="${escapeAttr(r[key])}"></td>`).join('')}<td><button type="button" class="row-del" data-del="${i}">🗑</button></td></tr>`).join('');
    return `<div class="tbl-wrap"><table class="tbl"><thead>${thead}</thead><tbody class="rows-body">${tbody}</tbody></table></div>` +
      `<button type="button" class="add-row-btn" data-add>+ Add row</button>` +
      `<p class="note">${rows.length} row(s)${rows.length < 2 ? ' — add at least 2 to continue (matches the real wizard’s minimum)' : ''}</p>`;
  }
  function wireRowsTable(container, sectionId) {
    const body = container.querySelector('.rows-body');
    body.addEventListener('input', (e) => {
      const tr = e.target.closest('tr'); if (!tr) return;
      STORE.rows[sectionId][+tr.dataset.i][e.target.dataset.key] = e.target.value;
    });
    body.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-del]'); if (!btn) return;
      STORE.rows[sectionId].splice(+btn.dataset.del, 1);
      refreshRowsTable(container, sectionId, SECTION_BY_ID[sectionId].cols);
    });
    container.querySelector('[data-add]').addEventListener('click', () => {
      STORE.rows[sectionId].push({});
      refreshRowsTable(container, sectionId, SECTION_BY_ID[sectionId].cols);
    });
  }
  function refreshRowsTable(container, sectionId, cols) {
    container.querySelector('.rows-holder').innerHTML = rowsTableHTML(sectionId, cols);
    wireRowsTable(container, sectionId);
  }

  function formHTML(storeKey, fields) {
    return `<div class="form-grid">${fields.map(([key, label, type]) => {
      const val = STORE[storeKey][key] || '';
      if (type === 'multi') return `<label class="field full"><span>${label}</span><textarea data-key="${key}" rows="3">${val}</textarea></label>`;
      return `<label class="field"><span>${label}</span><input data-key="${key}" type="text" value="${escapeAttr(val)}"></label>`;
    }).join('')}</div>`;
  }
  function wireForm(container, storeKey) {
    container.querySelectorAll('[data-key]').forEach((inp) => {
      inp.addEventListener('input', () => { STORE[storeKey][inp.dataset.key] = inp.value; });
    });
  }

  function renderSectionContent(container, sectionId) {
    const def = SECTION_BY_ID[sectionId];
    if (!def) { container.innerHTML = '<p class="note">Unknown section.</p>'; return; }
    if (def.kind === 'form') {
      container.innerHTML = formHTML('application', [['app_name', 'Application Name'], ['domain', 'Domain'], ['technology', 'Technology'], ['description', 'Application Description', 'multi']]);
      wireForm(container, 'application');
      return;
    }
    if (def.kind === 'summary') {
      container.innerHTML = `<div class="wiz-hint">ℹ️ <div><b>Already collected</b><p style="margin:4px 0 0">Core project fields were captured in Create Project. Computed effort &amp; schedule live in the Estimated Effort chapter.</p></div></div>`;
      return;
    }
    if (def.kind === 'preview-effort') {
      container.innerHTML = `<div class="wiz-hint">ℹ️ <div><b>Set automatically</b><p style="margin:4px 0 0">Standard phases are seeded when the project is created — edit them anytime from the Data Sheet.</p></div></div>` +
        `<div class="tbl-wrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>Phase</th><th>%</th></tr></thead><tbody>${STORE.effort.phases.map((p) => `<tr><td>${p.phase}</td><td class="num">${p.pct}%</td></tr>`).join('')}</tbody></table></div>`;
      return;
    }
    if (def.kind === 'preview-milestones') {
      const ms = ['Requirement Analysis', 'Design', 'Coding & UTC execution', 'System test cycle 1', 'System test cycle 2', 'PAT Delivery', 'PAT Support', 'UAT Support', 'Go - Live'];
      container.innerHTML = `<div class="wiz-hint">ℹ️ <div><b>Set automatically</b><p style="margin:4px 0 0">Standard milestones are seeded when the project is created.</p></div></div>` +
        `<div class="tbl-wrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>Milestone</th></tr></thead><tbody>${ms.map((m) => `<tr><td>${m}</td></tr>`).join('')}</tbody></table></div>`;
      return;
    }
    if (def.kind === 'preview-tasks') {
      const t = [
        ['PM', 'Kick-off meeting', 'PM', 'Fixed'], ['Developer', 'Build module skeleton', 'Coding', 'Scales w/ %'],
        ['Developer', 'Unit test module', 'Unit Testing', 'Scales w/ %'], ['Tester', 'Execute test cases', 'System Testing', 'Scales w/ %'],
        ['Team Lead', 'Code review', 'Code Review', 'Scales w/ %']
      ];
      container.innerHTML = `<p class="note">Copied per role when “Generate WBS” runs — estimates scale with each resource’s % contribution (meetings excluded).</p>` +
        `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Role</th><th>Task</th><th>Phase</th><th>Estimate rule</th></tr></thead><tbody>${t.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      return;
    }
    container.innerHTML = `<div class="rows-holder">${rowsTableHTML(sectionId, def.cols)}</div>`;
    wireRowsTable(container, sectionId);
  }

  // ---------------- Effort / schedule calc engine ----------------
  function computeEffort() {
    const total = STORE.effort.baseTotalMD;
    const rows = STORE.effort.phases.map((p) => {
      const md = +(total * p.pct / 100).toFixed(1);
      return { phase: p.phase, pct: p.pct, md, hr: +(md * 8).toFixed(1) };
    });
    const totalPct = rows.reduce((s, r) => s + Number(r.pct || 0), 0);
    const totalMd = +rows.reduce((s, r) => s + r.md, 0).toFixed(1);
    const totalHr = +(totalMd * 8).toFixed(1);
    const start = new Date(STORE.effort.startDate);
    const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + Math.round(n)); return x; };
    const end = addDays(start, totalMd);
    const patDate = addDays(start, totalMd * 0.8);
    const avgResPerDay = +(totalMd / Math.max(1, (end - start) / 86400000)).toFixed(1);
    const totalFte = +(totalMd / 220).toFixed(2);
    const fmt = (d) => d.toISOString().slice(0, 10);
    return { rows, totalPct, totalMd, totalHr, endDate: fmt(end), kickOffDate: fmt(start), patDate: fmt(patDate), avgResPerDay, totalFte };
  }

  window.__KAG_DEMO_INTERNALS__ = {
    STORE, SECTION_DEFS, SECTION_BY_ID, escapeAttr, sectionTitle, smallTbl, statTile,
    rowsTableHTML, wireRowsTable, refreshRowsTable, formHTML, wireForm, renderSectionContent, computeEffort
  };
})();

// ---------------- Scene-specific builders (Wizard, Data Sheet, Effort, WBS, SRS, Artifacts, Layouts) ----------------
(function () {
  'use strict';
  const K = window.__KAG_DEMO_INTERNALS__;
  const { STORE, SECTION_DEFS, SECTION_BY_ID, sectionTitle, smallTbl, statTile,
    wireRowsTable, refreshRowsTable, formHTML, wireForm, renderSectionContent, computeEffort } = K;

  function realDownload(artifactName, fmt) {
    const labels = { xls: 'Excel', csv: 'CSV', html: 'HTML', doc: 'Word', pdf: 'PDF' };
    if (fmt === 'pdf') { Engine.toast('PDF export is rendered server-side in the real app — simulated here.'); return; }
    const rows = [['S.No', 'Topic'], ['1', 'Welcome & Introductions'], ['2', 'Project Scope & Objectives'], ['3', 'Milestones & Timeline'], ['4', 'Roles & Responsibilities'], ['5', 'Q & A']];
    let mime, ext, content;
    if (fmt === 'csv') { mime = 'text/csv'; ext = 'csv'; content = rows.map((r) => r.join(',')).join('\r\n'); }
    else if (fmt === 'html') { mime = 'text/html'; ext = 'html'; content = '<table border="1">' + rows.map((r) => '<tr>' + r.map((c) => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</table>'; }
    else if (fmt === 'xls') { mime = 'application/vnd.ms-excel'; ext = 'xls'; content = '<html><body><table border="1">' + rows.map((r) => '<tr>' + r.map((c) => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</table></body></html>'; }
    else { mime = 'application/msword'; ext = 'doc'; content = '<html><body><h2>' + artifactName + '</h2><table border="1">' + rows.map((r) => '<tr>' + r.map((c) => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</table></body></html>'; }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = artifactName.replace(/\s+/g, '_') + '.' + ext;
    document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    Engine.toast('Downloaded ' + a.download + ' (' + labels[fmt] + ')');
  }

  // ---------- Wizard ----------
  let wizStepIdx = 0;
  const WIZ_STEPS = [{ id: '__create__', title: 'Create Project', group: null }, ...SECTION_DEFS.map((d) => ({ id: d.id, title: d.title, group: d.group }))];

  function wizardRailHTML() {
    let lastGroup = null, html = '';
    WIZ_STEPS.forEach((s, i) => {
      if (s.group && s.group !== lastGroup) { html += `<div class="wiz-group-label">${s.group}</div>`; lastGroup = s.group; }
      html += `<button type="button" class="wiz-step${i === wizStepIdx ? ' current' : ''}${i < wizStepIdx ? ' done' : ''}" data-step="${i}"><span class="n">${i < wizStepIdx ? '✓' : i + 1}</span><span>${s.title}</span></button>`;
    });
    return html;
  }
  function renderWizStep(root) {
    const pane = root.querySelector('#wizContent');
    const step = WIZ_STEPS[wizStepIdx];
    if (step.id === '__create__') {
      pane.innerHTML = formHTML('project', [['project_key', 'Project Key'], ['project_type', 'Type'], ['fp_count', 'FP Count (min 10)'], ['start_date', 'Start Date'], ['technology', 'Technology'], ['brief_desc', 'Brief Description', 'multi'], ['scope', 'Scope', 'multi']]);
      wireForm(pane, 'project');
      return;
    }
    renderSectionContent(pane, step.id);
  }
  function renderWizardStage(root) {
    root.innerHTML =
      `<h1>New Project Wizard</h1>` +
      `<p class="lead">Every field from the Excel Data Sheet, collected step by step — ${WIZ_STEPS.length} steps across four groups, with inline validation.</p>` +
      `<div class="wiz-progress"><div class="wiz-progress-track"><span style="width:${Math.round(((wizStepIdx + 1) / WIZ_STEPS.length) * 100)}%"></span></div></div>` +
      `<div class="wiz-shell" style="margin-top:14px"><div class="wiz-rail" id="wizRail">${wizardRailHTML()}</div><div class="wiz-content" id="wizContent"></div></div>` +
      `<div style="display:flex;justify-content:space-between;margin-top:14px">` +
      `<button type="button" class="btn" id="wizBack">← Back</button>` +
      `<button type="button" class="btn accent" id="wizNext">${wizStepIdx === WIZ_STEPS.length - 1 ? 'Create Project →' : 'Next →'}</button></div>`;
    renderWizStep(root);
    root.querySelector('#wizRail').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-step]'); if (!btn) return;
      wizStepIdx = +btn.dataset.step; renderWizardStage(root);
    });
    root.querySelector('#wizBack').addEventListener('click', () => { if (wizStepIdx > 0) { wizStepIdx--; renderWizardStage(root); } });
    root.querySelector('#wizNext').addEventListener('click', () => {
      if (wizStepIdx < WIZ_STEPS.length - 1) { wizStepIdx++; renderWizardStage(root); }
      else { Engine.toast('🎉 Project ' + (STORE.project.project_key || 'DEMO-01') + ' created!'); }
    });
  }

  // ---------- Data Sheet ----------
  let dsActiveId = 'hardware';
  function datasheetRailHTML() {
    let lastGroup = null, html = '';
    SECTION_DEFS.forEach((s) => {
      if (s.group !== lastGroup) { html += `<div class="wiz-group-label">${s.group}</div>`; lastGroup = s.group; }
      html += `<button type="button" class="wiz-step${s.id === dsActiveId ? ' current' : ''}" data-sec="${s.id}"><span class="n">▸</span><span>${s.title}</span></button>`;
    });
    return html;
  }
  function renderDatasheetStage(root) {
    root.innerHTML =
      `<h1>Data Sheet</h1>` +
      `<p class="lead">One editable master sheet — four groups, ${SECTION_DEFS.length} sections — feeds every generated artifact below.</p>` +
      `<div class="wiz-shell" style="margin-top:14px"><div class="wiz-rail" id="dsRail" style="max-height:460px">${datasheetRailHTML()}</div>` +
      `<div class="wiz-content"><div style="font-weight:700;margin-bottom:10px;font-size:14px">${SECTION_BY_ID[dsActiveId].title}</div><div id="dsBody"></div></div></div>`;
    renderSectionContent(root.querySelector('#dsBody'), dsActiveId);
    root.querySelector('#dsRail').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-sec]'); if (!btn) return;
      dsActiveId = btn.dataset.sec; renderDatasheetStage(root);
    });
  }

  // ---------- Effort ----------
  function effortHTML() {
    const c = computeEffort();
    return `<h1>Estimated Effort</h1>` +
      `<p class="lead">The same formulas as the Excel Data Sheet — edit any phase % and every total, the schedule, and the milestone chain recompute instantly.</p>` +
      `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Phase</th><th>%</th><th>MD</th><th>Hr</th></tr></thead><tbody id="effBody">` +
      c.rows.map((r, i) => `<tr><td>${r.phase}</td><td class="num"><input data-i="${i}" type="number" min="0" max="100" value="${r.pct}" style="width:60px;text-align:right"></td><td class="num" data-md="${i}">${r.md}</td><td class="num" data-hr="${i}">${r.hr}</td></tr>`).join('') +
      `<tr class="total-row"><td>Total</td><td class="num" id="effTotalPct">${c.totalPct}%</td><td class="num" id="effTotalMd">${c.totalMd}</td><td class="num" id="effTotalHr">${c.totalHr}</td></tr></tbody></table></div>` +
      `<h2>Computed Facts</h2><div class="stat-grid" id="effFacts">` +
      statTile('Total Effort (MD)', c.totalMd, 'facTotalMd') + statTile('End Date', c.endDate, 'facEnd') +
      statTile('Kick-Off Meeting', c.kickOffDate, 'facKick') + statTile('Proposed PAT Delivery', c.patDate, 'facPat') +
      statTile('Avg. Resource/day', c.avgResPerDay, 'facAvg') + statTile('Total FTE', c.totalFte, 'facFte') + `</div>`;
  }
  function refreshEffort(root) {
    const c = computeEffort();
    c.rows.forEach((r, i) => {
      root.querySelector(`[data-md="${i}"]`).textContent = r.md;
      root.querySelector(`[data-hr="${i}"]`).textContent = r.hr;
    });
    root.querySelector('#effTotalPct').textContent = c.totalPct + '%';
    root.querySelector('#effTotalMd').textContent = c.totalMd;
    root.querySelector('#effTotalHr').textContent = c.totalHr;
    root.querySelector('#facTotalMd').textContent = c.totalMd;
    root.querySelector('#facEnd').textContent = c.endDate;
    root.querySelector('#facKick').textContent = c.kickOffDate;
    root.querySelector('#facPat').textContent = c.patDate;
    root.querySelector('#facAvg').textContent = c.avgResPerDay;
    root.querySelector('#facFte').textContent = c.totalFte;
  }
  function wireEffort(root) {
    root.querySelectorAll('#effBody input').forEach((inp) => {
      inp.addEventListener('input', () => { STORE.effort.phases[+inp.dataset.i].pct = Number(inp.value) || 0; refreshEffort(root); });
    });
  }

  // ---------- WBS ----------
  function buildWbsRows() {
    const templates = [
      { role: 'PM', task: 'Kick-off meeting', phase: 'PM', hr: 8, fixed: true },
      { role: 'PM', task: 'Weekly status reviews', phase: 'PM', hr: 16, fixed: true },
      { role: 'Developer', task: 'Build module skeleton', phase: 'Coding', hr: 40, fixed: false },
      { role: 'Developer', task: 'Implement business logic', phase: 'Coding', hr: 64, fixed: false },
      { role: 'Developer', task: 'Unit test module', phase: 'Unit Testing', hr: 24, fixed: false },
      { role: 'Team Lead', task: 'Code review', phase: 'Code Review', hr: 20, fixed: false },
      { role: 'Tester', task: 'Write test cases', phase: 'System Testing', hr: 24, fixed: false },
      { role: 'Tester', task: 'Execute system test cycle 1', phase: 'System Testing', hr: 32, fixed: false },
      { role: 'Tester', task: 'Execute system test cycle 2', phase: 'System Testing', hr: 24, fixed: false }
    ];
    const pctByRole = { PM: 100, Developer: 100, 'Team Lead': 50, Tester: 80 };
    return templates.map((t) => {
      const pct = pctByRole[t.role] ?? 100;
      const estimate = t.fixed ? t.hr : +(t.hr * pct / 100).toFixed(1);
      return { type: 'Task', summary: t.task, assignee: t.role, phase: t.phase, estimate };
    });
  }
  function wbsHTML(rows) {
    if (!rows || !rows.length) return '<p class="note">No WBS generated yet for this project.</p>';
    return '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Issue Type</th><th>Summary</th><th>Assignee (Role)</th><th>Phase</th><th>Original Estimate (Hr)</th></tr></thead><tbody id="wbsBody"></tbody></table></div>';
  }
  async function fillWbsBody(root) {
    const body = root.querySelector('#wbsBody'); if (!body) return;
    body.innerHTML = '';
    for (const r of STORE.wbsRows) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.type}</td><td>${r.summary}</td><td>${r.assignee}</td><td>${r.phase}</td><td class="num">${r.estimate}</td>`;
      tr.style.opacity = '0';
      body.appendChild(tr);
      requestAnimationFrame(() => { tr.style.transition = 'opacity .25s'; tr.style.opacity = '1'; });
      await Engine.wait(110);
    }
  }
  async function runGenerateWbs(root) {
    try {
      STORE.wbsRows = buildWbsRows();
      root.querySelector('#wbsHolder').innerHTML = wbsHTML(STORE.wbsRows);
      await fillWbsBody(root);
      Engine.toast('WBS generated — ' + STORE.wbsRows.length + ' tasks ready for JIRA import');
    } catch (e) { if (e !== Engine.CANCELLED) console.error(e); }
  }

  // ---------- SRS AI extraction ----------
  async function runExtraction(root) {
    try {
      const log = root.querySelector('#extractLog');
      log.style.display = 'block'; log.innerHTML = '';
      const lines = [
        'Reading SRS_Payroll_Module.pdf (14 pages)…',
        'Sending to Claude (claude-sonnet-5) via extract_srs tool…',
        '✓ 8 business requirements found', '✓ 14 functional requirements found',
        '✓ 6 non-functional requirements found', '✓ 5 use cases found',
        '✓ 7 design components, 9 API endpoints found', '✓ Extraction complete'
      ];
      for (const l of lines) {
        const row = document.createElement('div');
        row.className = 'ln';
        row.innerHTML = l.startsWith('✓') ? `<span class="ok">${l}</span>` : l;
        log.appendChild(row);
        await Engine.wait(380);
      }
      Engine.toast('AI extraction complete — Analysis & Design pre-filled');
    } catch (e) { if (e !== Engine.CANCELLED) console.error(e); }
  }

  // ---------- Artifacts gallery ----------
  const ARTIFACTS = [
    { id: 'analysisdocument', name: 'Analysis Document', ai: true, blurb: 'Business, functional & non-functional requirements, use cases, data entities' },
    { id: 'designdocument', name: 'Design Document', ai: true, blurb: 'Architecture overview, components, API endpoints, DB design, sequence flows' },
    { id: 'kickoff', name: 'Kick-Off', blurb: 'Presentation deck: agenda, scope, milestones, team roster' },
    { id: 'ain', name: 'AIN', blurb: 'Application Initiation Note — org-wide application record' },
    { id: 'ainproject', name: 'AIN-Project', blurb: 'Project-scoped Application Initiation Note, renamed per project' },
    { id: 'ippappinfo', name: 'IPP-Application Information', blurb: 'Internal Project Plan — application context' },
    { id: 'ippscope', name: 'IPP-Scope Management', blurb: 'Scope statement, constraints, dependencies, assumptions' },
    { id: 'ippstakeholder', name: 'IPP-Stakeholder plan', blurb: 'Stakeholder matrix — who’s involved in which activity' },
    { id: 'ippconfig', name: 'IPP-Configuration Mgmt.', blurb: 'Tools, versioning & configuration management plan' },
    { id: 'ippprocess', name: 'IPP-Process Planning', blurb: 'Applicable processes & tailoring notes' },
    { id: 'wbsjira', name: 'WBS For JIRA', blurb: 'Generated task breakdown, ready to import into JIRA' },
    { id: 'folderstructure', name: 'Folder Structure', blurb: 'Standard artifact folder layout per phase' }
  ];
  function artifactPreviewHTML(id) {
    if (id === 'analysisdocument') return sectionTitle('Business Requirements') + smallTbl(['#', 'Description', 'Priority'], [
      ['1', 'Users must be able to reset their password via email', 'High'],
      ['2', 'System must support role-based access control', 'High'],
      ['3', 'Payroll batch must complete within a 2-hour nightly window', 'Medium']
    ]) + sectionTitle('Use Cases') + smallTbl(['Name', 'Actor'], [['Submit Timesheet', 'Employee'], ['Approve Payroll Run', 'Payroll Admin']]) +
      '<p class="note">8 business, 14 functional, 6 non-functional requirements and 5 use cases extracted from the uploaded SRS by Claude.</p>';
    if (id === 'designdocument') return sectionTitle('Architecture Overview') +
      '<p style="color:var(--text-dim);font-size:13px">A Node.js/Express API backed by PostgreSQL, fronted by a React SPA; batch payroll jobs run on a scheduled worker.</p>' +
      sectionTitle('Components') + smallTbl(['Name', 'Responsibility'], [['Payroll Engine', 'Nightly batch calculation'], ['Auth Service', 'JWT issuance & validation'], ['Notification Service', 'Email/SMS delivery']]) +
      sectionTitle('API Endpoints') + smallTbl(['Method', 'Path'], [['POST', '/api/payroll/run'], ['GET', '/api/employees/:id/payslip']]);
    if (id === 'kickoff') return sectionTitle('Agenda') + smallTbl(['#', 'Topic'], (STORE.rows.agenda || []).map((r, i) => [String(i + 1), r.topic || '—'])) +
      sectionTitle('Milestones') + smallTbl(['Milestone', 'Date'], [['Kick-Off', STORE.effort.startDate], ['PAT Delivery', computeEffort().patDate]]);
    if (id === 'wbsjira') return STORE.wbsRows.length ? smallTbl(['Type', 'Summary', 'Assignee', 'Phase', 'Est. Hr'], STORE.wbsRows.map((r) => [r.type, r.summary, r.assignee, r.phase, String(r.estimate)])) : '<p class="note">Not generated yet — visit the “Generate WBS” chapter first.</p>';
    if (id === 'folderstructure') return smallTbl(['Phase', 'Artifact Folder'], [['Requirements', '01_Requirements'], ['Design', '02_Design'], ['Build', '03_Build'], ['Test', '04_Test'], ['Deploy', '05_Deploy']]);
    if (id === 'ippstakeholder') return smallTbl(['Activity', 'Team', 'Remarks'], (STORE.rows.stdMatrix || []).map((r) => [r.activity || '', r.team || '', r.remarks || '']));
    if (id === 'ain' || id === 'ainproject') return smallTbl(['Field', 'Value'], [['Application Name', STORE.application.app_name || 'PayrollCore'], ['Domain', STORE.application.domain || 'HR / Finance'], ['Technology', STORE.application.technology || 'Node.js, React, PostgreSQL']]);
    return '<p class="note">Assembled directly from the Data Sheet sections that feed it — populated automatically once those sections have data.</p>';
  }
  function openArtifactModal(root, art) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      `<div class="modal-box"><div class="modal-head"><h3>${art.name}${art.ai ? ' <span class="badge" style="margin-left:6px">AI</span>' : ''}</h3><button type="button" class="modal-close">&times;</button></div>` +
      `<div class="modal-body">${artifactPreviewHTML(art.id)}</div>` +
      `<div class="modal-foot">${['Excel', 'CSV', 'HTML', 'Word', 'PDF'].map((f) => `<button type="button" class="btn sm" data-fmt="${f.toLowerCase()}">${f}</button>`).join('')}</div></div>`;
    root.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    const map = { excel: 'xls', word: 'doc' };
    overlay.querySelectorAll('[data-fmt]').forEach((b) => b.addEventListener('click', () => realDownload(art.name, map[b.dataset.fmt] || b.dataset.fmt)));
    return overlay;
  }
  function artCardHTML(a) {
    return `<button type="button" class="art-card" data-art="${a.id}">${a.ai ? '<span class="badge">AI-GENERATED</span><br>' : ''}<h3>${a.name}</h3><p>${a.blurb}</p></button>`;
  }

  // ---------- Layouts ----------
  const LAYOUTS = [
    { id: 'modern', title: 'Modern UI', desc: 'Sidebar + header, Home/Summary/Section pages — the default power-user layout.' },
    { id: 'webapp', title: 'Web App UI (Classic)', desc: 'Accordion sections with the guided New Project wizard built in.' },
    { id: 'excel', title: 'Excel UI', desc: 'Sheet tabs, control panel and grids — a faithful skin of the original workbook, including Protect/Unprotect.' }
  ];
  let layoutActive = 'modern';
  function layoutMiniHTML(l) {
    if (l.id === 'excel') {
      return `<div class="thumb"><div style="display:flex;gap:4px;margin-bottom:8px">${['Data Sheet', 'Kick-Off', 'AIN', 'IPP'].map((t, i) => `<span style="font-size:9px;padding:3px 6px;border-radius:4px;background:${i === 0 ? 'var(--accent)' : 'var(--surface-3)'};color:${i === 0 ? '#fff' : 'var(--text-faint)'}">${t}</span>`).join('')}</div>` +
        `<div style="height:8px;width:70%;background:var(--surface-3);border-radius:3px;margin-bottom:6px"></div>` +
        `<div style="height:8px;width:90%;background:var(--surface-3);border-radius:3px;margin-bottom:6px"></div>` +
        `<div style="height:8px;width:55%;background:var(--surface-3);border-radius:3px"></div><div class="lock-overlay" id="excelLock">🔒</div></div>`;
    }
    if (l.id === 'webapp') {
      return `<div class="thumb"><div style="height:10px;width:100%;background:var(--surface-3);border-radius:3px;margin-bottom:10px"></div>` +
        `<div style="display:flex;gap:6px">${[1, 2, 3].map(() => '<div style="flex:1;height:60px;background:var(--surface-3);border-radius:6px"></div>').join('')}</div></div>`;
    }
    return `<div class="thumb"><div style="display:flex;gap:8px;height:100%"><div style="width:26%;background:var(--surface-3);border-radius:6px"></div>` +
      `<div style="flex:1;display:flex;flex-direction:column;gap:6px"><div style="height:10px;background:var(--surface-3);border-radius:3px"></div><div style="flex:1;background:var(--surface-3);border-radius:6px"></div></div></div></div>`;
  }
  function renderLayoutsStage(root) {
    root.innerHTML = `<h1>Three UI Layouts — Same Data</h1><p class="lead">Switch anytime from the header — every layout reads and writes the same project data.</p>` +
      `<div class="frame-triplet">${LAYOUTS.map((l) => `<div class="mini${l.id === layoutActive ? ' active' : ''}" data-layout="${l.id}"><h4>${l.title}</h4>${layoutMiniHTML(l)}</div>`).join('')}</div>` +
      `<div class="wiz-hint" style="margin-top:16px"><span>ℹ️</span><div><b id="layoutDescTitle"></b><p id="layoutDescText" style="margin:4px 0 0"></p></div></div>` +
      (layoutActive === 'excel' ? `<div class="radio-row" id="protectRow" style="margin-top:12px">` +
        `<label><input type="radio" name="prot" value="protect" ${STORE.protectMode ? 'checked' : ''}> Protect (read-only)</label>` +
        `<label><input type="radio" name="prot" value="unprotect" ${!STORE.protectMode ? 'checked' : ''}> Unprotect (editable)</label></div>` : '');
    const desc = LAYOUTS.find((l) => l.id === layoutActive);
    root.querySelector('#layoutDescTitle').textContent = desc.title;
    root.querySelector('#layoutDescText').textContent = desc.desc;
    root.querySelectorAll('[data-layout]').forEach((m) => m.addEventListener('click', () => { layoutActive = m.dataset.layout; renderLayoutsStage(root); }));
    const lock = root.querySelector('#excelLock'); if (lock) lock.classList.toggle('on', STORE.protectMode);
    const pr = root.querySelector('#protectRow');
    if (pr) pr.addEventListener('change', (e) => { STORE.protectMode = e.target.value === 'protect'; const l2 = root.querySelector('#excelLock'); if (l2) l2.classList.toggle('on', STORE.protectMode); });
  }

  window.__KAG_DEMO_INTERNALS2__ = {
    realDownload, WIZ_STEPS,
    get wizStepIdx() { return wizStepIdx; }, set wizStepIdx(v) { wizStepIdx = v; },
    renderWizardStage,
    get dsActiveId() { return dsActiveId; }, set dsActiveId(v) { dsActiveId = v; },
    renderDatasheetStage,
    effortHTML, wireEffort, refreshEffort,
    buildWbsRows, wbsHTML, fillWbsBody, runGenerateWbs,
    runExtraction, ARTIFACTS, artifactPreviewHTML, openArtifactModal, artCardHTML,
    LAYOUTS, get layoutActive() { return layoutActive; }, set layoutActive(v) { layoutActive = v; }, renderLayoutsStage
  };
})();

// ---------------- The 13 scenes ----------------
(function () {
  'use strict';
  const K = window.__KAG_DEMO_INTERNALS__;
  const K2 = window.__KAG_DEMO_INTERNALS2__;
  const { STORE, SECTION_BY_ID, refreshRowsTable, computeEffort } = K;
  const { realDownload, WIZ_STEPS, renderWizardStage, renderDatasheetStage, effortHTML, wireEffort, refreshEffort,
    buildWbsRows, wbsHTML, fillWbsBody, runGenerateWbs, runExtraction, ARTIFACTS, openArtifactModal, artCardHTML,
    LAYOUTS, renderLayoutsStage } = K2;

  const root_ = (stage) => stage.querySelector('.scene');

  const DEMO_PROJECTS = [{ key: 'GICPI-V1110', type: 'Web Application' }, { key: 'PAYROLL-2.0', type: 'Migration' }];
  const RECAP = [
    'Guided, step-by-step onboarding wizard', 'AI-powered SRS upload & extraction (Claude)',
    'Live effort, schedule & FTE calculation engine', 'Data Sheet CRUD across 4 groups, 24 sections',
    'One-click WBS generation for JIRA import', '12 auto-assembled key artifacts',
    '5 export formats — Excel, CSV, HTML, Word, PDF', '3 switchable UI layouts + Protect/Unprotect',
    'Multi-project support with instant switching'
  ];

  function authLoginHTML() {
    return `<div class="form-grid"><label class="field full"><span>Email</span><input id="authEmail" type="email" placeholder="you@company.com"></label>` +
      `<label class="field full"><span>Password</span><input id="authPassword" type="password" placeholder="••••••••"></label></div>` +
      `<button type="button" class="btn accent" id="authLoginBtn" style="margin-top:14px;width:100%">Log in</button>`;
  }
  function authSignupHTML() {
    return `<div class="form-grid"><label class="field"><span>Name</span><input placeholder="Priya Shah"></label>` +
      `<label class="field"><span>Email</span><input type="email" placeholder="you@company.com"></label>` +
      `<label class="field full"><span>Password</span><input type="password" placeholder="••••••••"></label></div>` +
      `<button type="button" class="btn accent" id="authSignupBtn" style="margin-top:14px;width:100%">Create account</button>`;
  }
  function wireAuthButtons(root) {
    const lb = root.querySelector('#authLoginBtn'); if (lb) lb.addEventListener('click', () => Engine.toast('Welcome back!'));
    const sb = root.querySelector('#authSignupBtn'); if (sb) sb.addEventListener('click', () => Engine.toast('Account created — check your email to verify.'));
  }

  const SCENES = [
    {
      id: 'welcome', group: 'Get Started', icon: '🚀', title: 'What is Key Artifact Generator',
      blurb: "Key Artifact Generator turns one Data Sheet into every project artifact you need.",
      render(root) {
        root.innerHTML =
          `<div class="scene-kicker">Interactive Product Tour</div><h1>Key Artifact Generator</h1>` +
          `<p class="lead">One master <b>Data Sheet</b> drives everything: a Kick-Off deck, an Application Initiation Note, a full Internal Project Plan, a JIRA-ready WBS — and, powered by Claude, an AI-generated Analysis &amp; Design Document straight from your SRS.</p>` +
          `<div class="chip-row">${['🧭 <b>Guided Wizard</b>', '🤖 <b>AI SRS Extraction</b>', '📊 <b>Live Effort &amp; Schedule Calc</b>', '📄 <b>12 Generated Artifacts</b>', '⬇️ <b>5 Export Formats</b>', '🎨 <b>3 Switchable UI Layouts</b>'].map((c) => `<span class="chip">${c}</span>`).join('')}</div>` +
          `<div class="device"><div class="device-bar"><div class="device-dots"><i></i><i></i><i></i></div><div class="device-url">kag.local — Onboarding</div></div>` +
          `<div class="device-body"><p style="margin:0 0 10px;color:var(--text-dim);font-size:13px">This tour is <b style="color:var(--text)">self-running</b> — sit back and watch, or flip to <b style="color:var(--accent)">Explore</b> up top and click through everything yourself.</p>` +
          `<button type="button" class="btn accent" id="welcomeStart">Start the tour →</button></div></div>`;
        root.querySelector('#welcomeStart').addEventListener('click', () => document.getElementById('btnNext').click());
      },
      async script(E, stage) {
        const root = root_(stage);
        for (const c of root.querySelectorAll('.chip')) await E.pulse(c, 380);
      }
    },
    {
      id: 'auth', group: 'Get Started', icon: '🔐', title: 'Sign Up & Log In',
      blurb: "Every user's projects are private, gated by JWT-based authentication.",
      render(root) {
        root.innerHTML = `<h1>Sign in to your workspace</h1><p class="lead">JWT-based auth (<code>AuthContext</code> + <code>auth.js</code> + middleware) keeps every account's projects private.</p>` +
          `<div class="device" style="max-width:420px"><div class="device-bar"><div class="device-dots"><i></i><i></i><i></i></div><div class="device-url">kag.local/login</div></div>` +
          `<div class="device-body"><div class="tabs-row"><button type="button" class="tab-btn active" data-tab="login">Log in</button><button type="button" class="tab-btn" data-tab="signup">Create account</button></div>` +
          `<div id="authPane">${authLoginHTML()}</div></div></div>`;
        const pane = root.querySelector('#authPane');
        root.querySelectorAll('.tab-btn').forEach((t) => t.addEventListener('click', () => {
          root.querySelectorAll('.tab-btn').forEach((x) => x.classList.remove('active'));
          t.classList.add('active');
          pane.innerHTML = t.dataset.tab === 'login' ? authLoginHTML() : authSignupHTML();
          wireAuthButtons(root);
        }));
        wireAuthButtons(root);
      },
      async script(E, stage) {
        const root = root_(stage);
        await E.typeInto(root.querySelector('#authEmail'), 'priya@acme.com');
        await E.typeInto(root.querySelector('#authPassword'), 'hunter22');
        const btn = root.querySelector('#authLoginBtn');
        await E.clickFx(btn);
        E.toast('Welcome back, Priya!');
        E.setCaption('Logged in — landing on the Onboarding home.', 'GUIDE');
        await E.wait(900);
      }
    },
    {
      id: 'picker', group: 'Get Started', icon: '📁', title: 'Projects — Pick or Start New',
      blurb: 'Pick an existing project to jump straight to its artifacts, or start a brand-new one.',
      render(root) {
        root.innerHTML = `<h1>Projects</h1><p class="lead">Pick an existing project to jump straight to its artifacts, or start a brand-new one.</p>` +
          `<div class="card-grid">${DEMO_PROJECTS.map((p) => `<button type="button" class="art-card" data-proj="${p.key}"><h3>${p.key}</h3><p>${p.type}</p></button>`).join('')}</div>` +
          `<button type="button" class="btn accent" id="newProjBtn" style="margin-top:16px">+ New Project</button>`;
        root.querySelectorAll('[data-proj]').forEach((c) => c.addEventListener('click', () => {
          Engine.toast('Opening ' + c.dataset.proj + '’s Analysis & Design home…');
          window.gotoScene('artifacts');
        }));
        root.querySelector('#newProjBtn').addEventListener('click', () => {
          Engine.toast('Opening the New Project wizard…');
          window.gotoScene('wizard');
        });
      },
      async script(E, stage) {
        const root = root_(stage);
        for (const c of root.querySelectorAll('[data-proj]')) await E.pulse(c, 420);
        await E.clickFx(root.querySelector('#newProjBtn'));
        E.setCaption('Starting a brand-new project…', 'GUIDE');
        await E.wait(600);
      }
    },
    {
      id: 'wizard', group: 'Guided Onboarding', icon: '🧭', title: 'New Project Wizard',
      blurb: 'A guided, validated, step-by-step wizard collects the entire Data Sheet.',
      render(root) { K2.wizStepIdx = 0; renderWizardStage(root); },
      async script(E, stage) {
        const root = root_(stage);
        K2.wizStepIdx = 0; renderWizardStage(root);
        await E.wait(400);
        await E.typeInto(root.querySelector('[data-key="project_key"]'), 'PAY-MIGR-02');
        await E.typeInto(root.querySelector('[data-key="project_type"]'), 'Migration');
        await E.typeInto(root.querySelector('[data-key="fp_count"]'), '165');
        await E.typeInto(root.querySelector('[data-key="start_date"]'), '2026-09-14');
        await E.typeInto(root.querySelector('[data-key="technology"]'), 'Node.js, React, PostgreSQL');
        await E.typeInto(root.querySelector('[data-key="brief_desc"]'), 'Migrate the legacy payroll batch system to a modern, API-driven service.');
        E.setCaption('Application-Data → Hardware — adding an inventory row…', 'GUIDE');
        await E.wait(500);
        K2.wizStepIdx = WIZ_STEPS.findIndex((s) => s.id === 'hardware'); renderWizardStage(root);
        await E.wait(400);
        let pane = root.querySelector('#wizContent');
        if (!STORE.rows.hardware.some((r) => r.description === 'Test Environment Server')) {
          STORE.rows.hardware.push({});
          refreshRowsTable(pane, 'hardware', SECTION_BY_ID.hardware.cols);
          let lastRow = pane.querySelector('.rows-body tr:last-child');
          let inputs = lastRow.querySelectorAll('input');
          await E.typeInto(inputs[0], 'Test Environment Server');
          await E.typeInto(inputs[1], '4-core / 16GB RAM');
          await E.typeInto(inputs[2], '1');
        } else {
          await E.pulse(pane.querySelector('.rows-body'), 500);
        }
        E.setCaption('Project-Data → Human Resource Plan — already has resources staffed.', 'GUIDE');
        await E.wait(500);
        K2.wizStepIdx = WIZ_STEPS.findIndex((s) => s.id === 'hrplan'); renderWizardStage(root);
        await E.wait(300);
        pane = root.querySelector('#wizContent');
        await E.pulse(pane.querySelector('.rows-body'), 600);
        E.setCaption('Project-Data → Risks — capturing a known risk.', 'GUIDE');
        await E.wait(500);
        K2.wizStepIdx = WIZ_STEPS.findIndex((s) => s.id === 'risks'); renderWizardStage(root);
        await E.wait(300);
        pane = root.querySelector('#wizContent');
        if (!STORE.rows.risks.some((r) => r.description === 'Legacy data export format may not map cleanly to the new schema')) {
          STORE.rows.risks.push({});
          refreshRowsTable(pane, 'risks', SECTION_BY_ID.risks.cols);
          const lastRow = pane.querySelector('.rows-body tr:last-child');
          const inputs = lastRow.querySelectorAll('input');
          await E.typeInto(inputs[0], 'Legacy data export format may not map cleanly to the new schema');
        } else {
          await E.pulse(pane.querySelector('.rows-body'), 500);
        }
        E.setCaption('Estimated Effort — standard phases are seeded automatically.', 'GUIDE');
        await E.wait(500);
        K2.wizStepIdx = WIZ_STEPS.findIndex((s) => s.id === 'effort'); renderWizardStage(root);
        await E.wait(300);
        pane = root.querySelector('#wizContent');
        await E.pulse(pane.querySelector('table.tbl'), 600);
        await E.wait(400);
        E.toast('🎉 Project PAY-MIGR-02 created!');
        E.setCaption('Project created — moving straight into the SRS upload step.', 'GUIDE');
        await E.wait(900);
      }
    },
    {
      id: 'srs', group: 'Guided Onboarding', icon: '🤖', title: 'AI SRS Upload & Extraction',
      blurb: 'Upload an SRS and Claude extracts structured requirements & design data automatically.',
      render(root) {
        root.innerHTML = `<h1>Upload Requirements Document</h1><p class="lead">Upload a .txt, .md or .pdf SRS — Claude reads it and auto-fills the Analysis &amp; Design artifacts via a structured <code>extract_srs</code> tool call.</p>` +
          `<div class="device" style="max-width:560px"><div class="device-bar"><div class="device-dots"><i></i><i></i><i></i></div><div class="device-url">kag.local — Upload Requirements</div></div>` +
          `<div class="device-body"><div class="dropzone" id="dropzone"><span class="dz-icon">📄</span><span id="dzLabel">Choose a file…</span></div>` +
          `<div class="chip-row"><button type="button" class="btn" id="skipBtn">Skip, continue manually →</button><button type="button" class="btn accent" id="analyzeBtn">Upload &amp; Analyze →</button></div>` +
          `<div class="extract-log" id="extractLog" style="display:none"></div></div></div>`;
        root.querySelector('#dropzone').addEventListener('click', () => {
          root.querySelector('#dzLabel').textContent = 'SRS_Payroll_Module.pdf';
          root.querySelector('#dropzone').classList.add('drag');
        });
        root.querySelector('#analyzeBtn').addEventListener('click', () => runExtraction(root));
        root.querySelector('#skipBtn').addEventListener('click', () => Engine.toast('Continuing without AI extraction — fill details in manually anytime.'));
      },
      async script(E, stage) {
        const root = root_(stage);
        root.querySelector('#dropzone').classList.add('drag');
        root.querySelector('#dzLabel').textContent = 'SRS_Payroll_Module.pdf';
        E.setCaption('Dropping SRS_Payroll_Module.pdf onto the upload zone…', 'GUIDE');
        await E.wait(600);
        await E.clickFx(root.querySelector('#analyzeBtn'));
        E.setCaption('Claude is reading the document and extracting structured data…', 'AI');
        await runExtraction(root);
        await E.wait(900);
      }
    },
    {
      id: 'review', group: 'Guided Onboarding', icon: '✅', title: 'Review Extracted Data',
      blurb: "A quick summary of everything the AI extraction picked up.",
      render(root) {
        root.innerHTML = `<h1>Review What Claude Found</h1><p class="lead">A quick summary before moving on to the generated Analysis &amp; Design documents.</p>` +
          `<div class="stat-grid">${[['Business Reqs', 'brStat'], ['Functional Reqs', 'frStat'], ['Non-Functional Reqs', 'nfrStat'], ['Use Cases', 'ucStat'], ['Components', 'compStat'], ['API Endpoints', 'epStat']].map(([label, id]) => `<div class="stat-tile"><b id="${id}">0</b><span>${label}</span></div>`).join('')}</div>` +
          `<div class="form-grid" style="margin-top:10px">` +
          `<div class="field full"><span>Brief Description</span><p style="color:var(--text-dim);font-size:13px;margin:4px 0 0">Migrate the legacy payroll batch system to a modern, API-driven service with self-service payslips.</p></div>` +
          `<div class="field"><span>Scope</span><p style="color:var(--text-dim);font-size:13px;margin:4px 0 0">Payroll calculation, payslip generation, employee self-service portal.</p></div>` +
          `<div class="field"><span>Technology</span><p style="color:var(--text-dim);font-size:13px;margin:4px 0 0">Node.js, React, PostgreSQL</p></div></div>` +
          `<button type="button" class="btn accent" id="reviewContinue" style="margin-top:16px">Continue to Analysis &amp; Design →</button>`;
        root.querySelector('#reviewContinue').addEventListener('click', () => window.gotoScene('artifacts'));
      },
      async script(E, stage) {
        const root = root_(stage);
        const targets = { brStat: 8, frStat: 14, nfrStat: 6, ucStat: 5, compStat: 7, epStat: 9 };
        for (const [id, target] of Object.entries(targets)) {
          const node = root.querySelector('#' + id);
          for (let v = 0; v <= target; v++) { node.textContent = v; await E.wait(32); }
        }
        await E.pulse(root.querySelector('#reviewContinue'), 600);
        E.setCaption('These numbers feed the Analysis and Design Document artifacts directly.', 'GUIDE');
        await E.wait(500);
      }
    },
    {
      id: 'datasheet', group: 'Data Sheet Engine', icon: '🗂️', title: 'Data Sheet — All Sections',
      blurb: 'One editable master sheet, four groups, two dozen sections — feeds every artifact.',
      render(root) { K2.dsActiveId = 'hardware'; renderDatasheetStage(root); },
      async script(E, stage) {
        const root = root_(stage);
        K2.dsActiveId = 'appDetails'; renderDatasheetStage(root);
        await E.wait(400);
        await E.pulse(root.querySelector('#dsBody'), 500);
        E.setCaption('Application-Data → Hardware — inline add/edit/delete, just like the Excel grid.', 'GUIDE');
        await E.wait(500);
        K2.dsActiveId = 'hardware'; renderDatasheetStage(root);
        await E.wait(300);
        let body = root.querySelector('#dsBody');
        await E.pulse(body.querySelector('.rows-body'), 450);
        if (!STORE.rows.hardware.some((r) => r.description === 'Backup NAS')) {
          STORE.rows.hardware.push({});
          refreshRowsTable(body, 'hardware', SECTION_BY_ID.hardware.cols);
          const lastRow = body.querySelector('.rows-body tr:last-child');
          const inputs = lastRow.querySelectorAll('input');
          await E.typeInto(inputs[0], 'Backup NAS');
          await E.typeInto(inputs[1], '20TB, RAID6');
          await E.typeInto(inputs[2], '1');
        }
        E.setCaption('Project-Data → HR Plan — resourcing already on the sheet.', 'GUIDE');
        await E.wait(500);
        K2.dsActiveId = 'hrplan'; renderDatasheetStage(root);
        await E.wait(300);
        body = root.querySelector('#dsBody');
        await E.pulse(body.querySelector('.rows-body'), 550);
        E.setCaption('Project-Data → Risks — flagging a new risk on the fly.', 'GUIDE');
        await E.wait(500);
        K2.dsActiveId = 'risks'; renderDatasheetStage(root);
        await E.wait(300);
        body = root.querySelector('#dsBody');
        if (!STORE.rows.risks.some((r) => r.description === 'Peak season load may exceed current server capacity')) {
          STORE.rows.risks.push({});
          refreshRowsTable(body, 'risks', SECTION_BY_ID.risks.cols);
          const lastRow = body.querySelector('.rows-body tr:last-child');
          const inputs = lastRow.querySelectorAll('input');
          await E.typeInto(inputs[0], 'Peak season load may exceed current server capacity');
        } else {
          await E.pulse(body.querySelector('.rows-body'), 500);
        }
        E.setCaption('Standards-Data → Stakeholder Matrix — shared, org-wide reference data.', 'GUIDE');
        await E.wait(500);
        K2.dsActiveId = 'stdMatrix'; renderDatasheetStage(root);
        await E.wait(300);
        body = root.querySelector('#dsBody');
        await E.pulse(body.querySelector('.rows-body'), 600);
        await E.wait(400);
      }
    },
    {
      id: 'effort', group: 'Data Sheet Engine', icon: '📊', title: 'Live Effort & Schedule Calc',
      blurb: 'Phase effort, total MD/Hr, and the whole schedule recompute live as you edit.',
      render(root) { root.innerHTML = effortHTML(); wireEffort(root); },
      async script(E, stage) {
        const root = root_(stage);
        const idx = STORE.effort.phases.findIndex((p) => p.phase === 'Coding');
        const codingInput = root.querySelector(`#effBody input[data-i="${idx}"]`);
        E.setCaption('Bumping Coding effort from 20% to 25% — watch the totals and schedule recalc live.', 'LIVE');
        await E.pulse(codingInput, 500);
        codingInput.value = '';
        for (const ch of '25') { codingInput.value += ch; codingInput.dispatchEvent(new Event('input', { bubbles: true })); await E.wait(220); }
        await E.wait(500);
        await E.pulse(root.querySelector('#effTotalMd'), 600);
        await E.wait(150);
        await E.pulse(root.querySelector('#facEnd'), 600);
        await E.wait(600);
      }
    },
    {
      id: 'wbs', group: 'Generate', icon: '🧩', title: 'Generate WBS for JIRA',
      blurb: 'Generate a JIRA-ready WBS from HR-plan resources and task templates.',
      render(root) {
        root.innerHTML = `<h1>Generate WBS (for JIRA)</h1>` +
          `<p class="lead">Per HR-plan resource, task templates are copied and scaled by % contribution — meetings and fixed-share tasks are excluded from scaling. Ready to paste into a JIRA CSV import.</p>` +
          `<button type="button" class="btn accent" id="genWbsBtn">🧩 Generate WBS</button>` +
          `<div id="wbsHolder" style="margin-top:14px">${wbsHTML(STORE.wbsRows)}</div>`;
        root.querySelector('#genWbsBtn').addEventListener('click', () => runGenerateWbs(root));
        if (STORE.wbsRows.length) fillWbsBody(root);
      },
      async script(E, stage) {
        const root = root_(stage);
        await E.clickFx(root.querySelector('#genWbsBtn'));
        E.setCaption('Copying task templates per staffed role, scaled by % contribution…', 'LIVE');
        await runGenerateWbs(root);
        await E.wait(700);
      }
    },
    {
      id: 'artifacts', group: 'Generate', icon: '📄', title: '12 Generated Artifacts',
      blurb: 'Twelve key artifacts assembled automatically from the Data Sheet.',
      render(root) {
        const featured = ARTIFACTS.filter((a) => a.ai);
        const rest = ARTIFACTS.filter((a) => !a.ai);
        root.innerHTML = `<h1>12 Generated Artifacts</h1><p class="lead">Everything below is assembled live from the Data Sheet — click any card to preview it (and try exporting).</p>` +
          `<div class="card-grid">${featured.map(artCardHTML).join('')}</div>` +
          `<h2>Also generated</h2><div class="card-grid" id="restGrid">${rest.map(artCardHTML).join('')}</div>`;
        root.querySelectorAll('[data-art]').forEach((card) => card.addEventListener('click', () => {
          openArtifactModal(root, ARTIFACTS.find((a) => a.id === card.dataset.art));
        }));
      },
      async script(E, stage) {
        const root = root_(stage);
        const openAndClose = async (id) => {
          const card = root.querySelector(`[data-art="${id}"]`);
          await E.pulse(card, 450);
          const art = ARTIFACTS.find((a) => a.id === id);
          const overlay = openArtifactModal(root, art);
          E.setCaption('Previewing the ' + art.name + (art.ai ? ' — generated by Claude from your SRS.' : '.'), art.ai ? 'AI' : 'GUIDE');
          await E.wait(1500);
          overlay.remove();
        };
        await openAndClose('analysisdocument');
        await E.wait(250);
        await openAndClose('designdocument');
        await E.wait(250);
        for (const a of root.querySelectorAll('#restGrid .art-card')) await E.pulse(a, 220);
      }
    },
    {
      id: 'export', group: 'Generate', icon: '⬇️', title: 'Export — 5 Formats',
      blurb: 'Every artifact exports to Excel, CSV, HTML, Word or PDF.',
      render(root) {
        root.innerHTML = `<h1>Export Any Artifact, Any Format</h1><p class="lead">Every artifact ships in five formats — Excel, CSV, HTML, Word and PDF — mirroring the workbook's "Copy To Desktop" macro.</p>` +
          `<div class="device" style="max-width:640px"><div class="device-bar"><div class="device-dots"><i></i><i></i><i></i></div><div class="device-url">kag.local — Kick-Off</div></div>` +
          `<div class="device-body">${K.smallTbl(['#', 'Topic'], [['1', 'Welcome & Introductions'], ['2', 'Project Scope & Objectives'], ['3', 'Milestones & Timeline'], ['4', 'Roles & Responsibilities'], ['5', 'Q & A']])}` +
          `<div class="chip-row">${[['xls', '📗 Excel'], ['csv', '📑 CSV'], ['html', '🌐 HTML'], ['doc', '📄 Word'], ['pdf', '🧾 PDF']].map(([f, l]) => `<button type="button" class="btn sm" data-fmt="${f}">${l}</button>`).join('')}</div>` +
          `<p class="note">Excel / CSV / HTML / Word downloads here are genuinely generated in your browser — try one. PDF is rendered server-side in the real app, so it's simulated in this demo.</p></div></div>`;
        root.querySelectorAll('[data-fmt]').forEach((b) => b.addEventListener('click', () => realDownload('Kick-Off', b.dataset.fmt)));
      },
      async script(E, stage) {
        const root = root_(stage);
        const labels = { xls: 'Excel', csv: 'CSV', html: 'HTML', doc: 'Word', pdf: 'PDF' };
        for (const fmt of ['xls', 'csv', 'html', 'doc', 'pdf']) {
          const btn = root.querySelector(`[data-fmt="${fmt}"]`);
          await E.clickFx(btn);
          E.toast(fmt === 'pdf' ? 'PDF export is rendered server-side — simulated here.' : 'Preparing ' + labels[fmt] + ' export… (click it yourself to really download)');
          await E.wait(450);
        }
      }
    },
    {
      id: 'layouts', group: 'Flexibility', icon: '🎨', title: '3 UI Layouts + Protect Mode',
      blurb: 'Modern, Web App (Classic) and Excel UI — three skins over the same data.',
      render(root) { renderLayoutsStage(root); },
      async script(E, stage) {
        const root = root_(stage);
        for (const l of LAYOUTS) {
          K2.layoutActive = l.id; renderLayoutsStage(root);
          E.setCaption(l.title + ' — ' + l.desc, 'GUIDE');
          await E.pulse(root.querySelector(`[data-layout="${l.id}"]`), 650);
          await E.wait(250);
        }
        const protRadio = root.querySelector('input[value="protect"]');
        await E.clickFx(protRadio);
        protRadio.checked = true; STORE.protectMode = true; renderLayoutsStage(root);
        E.setCaption('Protect mode locks the sheet read-only — mirrors RbProtect/RbUnprotect from the original workbook.', 'GUIDE');
        await E.wait(1100);
        const unRadio = root.querySelector('input[value="unprotect"]');
        await E.clickFx(unRadio);
        unRadio.checked = true; STORE.protectMode = false; renderLayoutsStage(root);
        await E.wait(400);
      }
    },
    {
      id: 'finish', group: 'Flexibility', icon: '🏁', title: 'Recap & Next Steps',
      blurb: "That's the full tour of Key Artifact Generator.",
      render(root) {
        root.innerHTML = `<h1>You've seen the full tour</h1><p class="lead">Everything Key Artifact Generator does, end to end — from a blank Data Sheet to a client-ready artifact set.</p>` +
          `<ul class="checklist" id="recapList">${RECAP.map((t) => `<li><span class="tick">•</span><span>${t}</span></li>`).join('')}</ul>` +
          `<div class="chip-row"><button type="button" class="btn accent" id="finishRestart">↺ Restart the demo</button><button type="button" class="btn" id="finishExplore">🖱 Switch to Explore</button></div>` +
          `<p class="note" style="margin-top:18px">Want the real thing? See <b>README.md</b> in the project root, or run <code>npm run db:setup &amp;&amp; npm start</code> inside <code>backend/</code>.</p>`;
        root.querySelector('#finishRestart').addEventListener('click', () => document.getElementById('btnRestart').click());
        root.querySelector('#finishExplore').addEventListener('click', () => document.getElementById('modeExploreBtn').click());
      },
      async script(E, stage) {
        const root = root_(stage);
        for (const li of root.querySelectorAll('#recapList li')) {
          li.classList.add('done'); li.querySelector('.tick').textContent = '✓';
          await E.wait(230);
        }
        await E.wait(400);
      }
    }
  ];

  window.SCENES = SCENES;
})();
