// Key Artifact Generator — Interactive Demo content.
// Shared in-memory "demo data store" + reusable UI builders, then the 15
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

  // What Claude extracts from the sample SRS for the New Project wizard (the
  // real app saves this into the project at upload time). Org data an SRS
  // never contains - HR plan, resources, stakeholder matrix, agenda - stays as
  // the sample rows above.
  const SRS_FILE = 'SRS_Payroll_Module.pdf';
  const TBD = 'To be assigned';
  const SRS_PREFILL = {
    project: {
      project_key: 'SRS_Payroll_Module', project_type: 'MQC', fp_count: '140', start_date: '',
      technology: 'Node.js, React, PostgreSQL',
      brief_desc: 'Migrate the legacy payroll batch system to a modern, API-driven service with self-service payslips.',
      scope: 'Payroll calculation, payslip generation, employee self-service portal.'
    },
    application: {
      app_name: 'PayrollCore', domain: 'HR / Finance', technology: 'Node.js 20, React 18, PostgreSQL 16',
      description: 'Payroll processing platform for 12,000 employees across 4 countries.'
    },
    rows: {
      hardware: [
        { description: 'Application Server', spec: '8-core / 32GB RAM', qty: '2' },
        { description: 'Database Server', spec: '16-core / 128GB RAM, 2TB SSD', qty: '1' }
      ],
      software: [
        { description: 'PostgreSQL', version: '16', installations: '1' }, { description: 'Node.js', version: '20', installations: '2' },
        { description: 'React', version: '18', installations: '1' }, { description: 'Nginx', version: '1.25', installations: '2' }
      ],
      environments: [
        { env: 'Development', server: 'dev.payroll.internal', access: 'Developers' },
        { env: 'UAT', server: 'uat.payroll.internal', access: 'Testers' },
        { env: 'Production', server: 'prod cluster', access: 'Ops only' }
      ],
      docs: [{ name: 'Legacy payroll data dictionary', version: 'v2.1' }, { name: 'Statutory deduction rules', version: '2026' }],
      constraints: [{ description: 'Payroll batch must finish within the 2-hour nightly window' }, { description: 'Go-live before the April financial-year start' }],
      dependencies: [{ description: 'Bank file format sign-off from Treasury' }, { description: 'HRMS team to expose the employee master API' }],
      assumptions: [{ description: 'Legacy data is available as nightly CSV exports' }, { description: 'Employees have corporate SSO accounts' }],
      risks: [
        { description: 'Legacy data export format may not map cleanly to the new schema' },
        { description: 'Statutory rule changes mid-project' },
        { description: 'Peak payroll-week load may exceed server capacity' }
      ],
      training: [{ name: 'Payroll domain walkthrough', type: 'Functional' }, { name: 'PostgreSQL performance tuning', type: 'Technical' }],
      modules: [
        { name: 'Payroll Engine', description: 'Nightly gross-to-net calculation' },
        { name: 'Payslips', description: 'PDF payslip generation and delivery' },
        { name: 'Self-Service Portal', description: 'Employees view payslips and tax forms' },
        { name: 'Reports', description: 'Statutory and management reports' }
      ],
      goals: [{ metric: 'Batch run time', target: '< 2 hours' }, { metric: 'Payslip accuracy', target: '100%' }, { metric: 'Portal availability', target: '99.9%' }],
      // not from the SRS: the standard role-wise team every SRS project starts
      // with, so the WBS can be generated - people are placeholders to assign
      hrplan: [
        ['Project Owner', 30], ['Offshore Domain Owner', 15], ['Technical Lead', 20], ['Developer1', 80],
        ['Developer2', 80], ['Test Lead', 20], ['Test Engineer', 70], ['PQAO', 3]
      ].map(([role, pct]) => ({ role, name: TBD, pct: String(pct) }))
    }
  };
  const SRS_SECTIONS = new Set(['appDetails', ...Object.keys(SRS_PREFILL.rows).filter((k) => k !== 'hrplan')]);
  function applySrsPrefill() {
    if (STORE.prefilled) return;
    Object.assign(STORE.project, SRS_PREFILL.project);
    Object.assign(STORE.application, SRS_PREFILL.application);
    for (const [k, rows] of Object.entries(SRS_PREFILL.rows)) STORE.rows[k] = rows.map((r) => ({ ...r }));
    STORE.prefilled = true;
  }

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

  // ---------------- Messages panel (mirrors frontend/src/data/projectMessages.js) ----------------
  // fix targets: 'wizard:<stepId>' opens the wizard on that step, 'scene:<id>' jumps to a chapter
  const FEEDS = {
    hardware: ['Kick-Off', 'IPP-Application Information'], software: ['Kick-Off', 'IPP-Application Information'],
    environments: ['IPP-Application Information'], docs: ['AIN-Project'], modules: ['AIN-Project', 'IPP-Scope Management'],
    training: ['IPP-Scope Management'], process: ['IPP-Process Planning'], goals: ['Kick-Off'], agenda: ['Kick-Off'],
    constraints: ['Kick-Off', 'IPP-Scope Management'], dependencies: ['Kick-Off', 'IPP-Scope Management'],
    assumptions: ['Kick-Off', 'IPP-Scope Management'], risks: ['Kick-Off', 'IPP-Scope Management']
  };
  const MESSAGE_LEVELS = { error: ['Action needed', '⛔'], warning: ['Recommended', '⚠️'], info: ['Tip', 'ℹ️'] };
  const hasContent = (r) => Object.values(r).some((v) => v != null && String(v).trim() !== '');
  // ---------------- Resource loading (mirrors checkResourceLoading in backend/src/services/wbs.js) ----------------
  // Each person's WBS hours = their role's task hours x their %; load = WBS hours / full-time hours
  // (working days x 8h). Over 100% = their tasks can't fit even full-time -> warning; Σ% > 100 -> error.
  const DEMO_SCHEDULE = { start: '2026-09-14', end: '2027-03-05', workingDays: 125 };
  const ROLE_TASK_HOURS = {   // role task-template hours at 100% for this demo project
    'Project Owner': 1450, 'Offshore Domain Owner': 1150, 'Technical Lead': 1500, Developer1: 1310, Developer2: 1310,
    'Test Lead': 1600, 'Test Engineer': 1180, PQAO: 1250, PM: 1450, Developer: 1310, Tester: 1180, 'Team Lead': 1500
  };
  function demoResourceLoading() {
    const fullTime = DEMO_SCHEDULE.workingDays * 8;
    const errors = []; const warnings = [];
    const members = (STORE.rows.hrplan || []).filter((r) => r.role).map((r) => {
      const pct = Number(r.pct) || 0;
      const name = r.name && r.name !== TBD ? r.name : `${r.role} (to be assigned)`;
      const wbsHrs = Math.round((ROLE_TASK_HOURS[r.role] || 1000) * pct / 100);
      const load = Math.round((wbsHrs / fullTime) * 100);
      let status = 'ok';
      if (pct > 100) { status = 'over'; errors.push(`${name} is allocated ${pct}% — one person cannot exceed 100%.`); }
      else if (wbsHrs > fullTime) {
        status = 'overloaded';
        warnings.push(`${name} would get ${wbsHrs}h of WBS tasks but has only ${fullTime}h of working time (${DEMO_SCHEDULE.workingDays} working days, full-time) — ${load}% loaded. Lower their ${pct}% to at most ${Math.floor(pct * fullTime / wbsHrs)}% and give the rest of the role to another person, or extend their dates.`);
      }
      return { name, role: r.role, pct, wbsHrs, booked: Math.round(fullTime * pct / 100), fullTime, load, status };
    });
    return { members, errors, warnings };
  }
  function resourceLoadingHTML() {
    const rl = demoResourceLoading();
    const chip = { ok: ['OK', 'ok'], overloaded: ['Overloaded', 'warn'], over: ['Over 100%', 'bad'] };
    return `<div class="rl-panel"><div class="rl-head"><b>Resource loading</b><span class="note">checked before generating · schedule ${DEMO_SCHEDULE.start} – ${DEMO_SCHEDULE.end}</span>` +
      (rl.errors.length ? `<span class="rl-chip bad">${rl.errors.length} blocking</span>` : '') + (rl.warnings.length ? `<span class="rl-chip warn">${rl.warnings.length} to check</span>` : '') + `</div>` +
      `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Person</th><th>Role</th><th>Allocation</th><th>WBS hours</th><th>Booked hours</th><th>Full-time hours</th><th>Load</th><th>Status</th></tr></thead><tbody>` +
      rl.members.map((m) => `<tr data-status="${m.status}"><td>${m.name}</td><td>${m.role}</td><td class="num">${m.pct}%</td><td class="num">${m.wbsHrs}</td><td class="num">${m.booked}</td><td class="num">${m.fullTime}</td><td class="num">${m.load}%</td><td><span class="rl-chip ${chip[m.status][1]}">${chip[m.status][0]}</span></td></tr>`).join('') +
      `</tbody></table></div>` +
      (rl.errors.length + rl.warnings.length ? `<ul class="rl-issues">${rl.errors.map((e) => `<li>⛔ ${e}</li>`).join('')}${rl.warnings.map((w) => `<li>⚠️ ${w}</li>`).join('')}</ul>` : '') + `</div>`;
  }

  function demoMessages() {
    const p = STORE.project;
    const msgs = [];
    if (!p.start_date) msgs.push({ level: 'error', title: 'Start Date is missing', detail: 'Schedule, milestone dates and WBS task dates are calculated from it — Generate WBS won’t run until it’s set.', fix: 'wizard:__create__', fixLabel: 'Set Start Date' });
    if (!(Number(p.fp_count) > 0)) msgs.push({ level: 'error', title: 'FP Count is 0', detail: 'Effort, FTE and every WBS estimate come from the function point count.', fix: 'wizard:__create__', fixLabel: 'Set FP Count' });
    const tbd = (STORE.rows.hrplan || []).filter((r) => r.name === TBD);
    if (tbd.length) msgs.push({ level: 'warning', title: `${tbd.length} team role${tbd.length > 1 ? 's are' : ' is'} not assigned to a person`, detail: `${tbd.map((r) => r.role).join(', ')} still ${tbd.length > 1 ? 'have placeholder people' : 'has a placeholder person'} — assign real resources, then generate the WBS.`, fix: 'wizard:hrplan', fixLabel: 'Assign people' });
    const rl = demoResourceLoading();
    rl.errors.forEach((e) => msgs.push({ level: 'error', title: 'Person allocated over 100%', detail: e + ' Generate WBS is blocked until this is fixed.', fix: 'wizard:hrplan', fixLabel: 'Fix HR plan' }));
    if (rl.warnings.length) msgs.push({ level: 'warning', title: `Resource loading: ${rl.warnings.length} thing${rl.warnings.length > 1 ? 's' : ''} to check before generating the WBS`, detail: rl.warnings.join(' ') + ' Generate WBS will ask you to confirm.', fix: 'scene:wbs', fixLabel: 'Review loading' });
    if (!STORE.prefilled) msgs.push({ level: 'warning', title: 'No requirements document analysed', detail: 'The Analysis and Design documents stay empty until an SRS is uploaded.', fix: 'scene:start', fixLabel: 'Upload SRS' });
    if (p.start_date && Number(p.fp_count) > 0 && !STORE.wbsRows.length) msgs.push({ level: 'info', title: 'WBS not generated yet', detail: 'Everything the WBS needs is in place — generate the JIRA-ready task breakdown.', fix: 'scene:wbs', fixLabel: 'Generate WBS' });
    const empty = Object.keys(FEEDS).filter((sid) => !(STORE.rows[sid] || []).some(hasContent));
    if (empty.length) msgs.push({ level: 'info', title: `${empty.length} section${empty.length > 1 ? 's are' : ' is'} empty`, detail: 'Optional, but these feed the artifacts shown — fill them in for complete documents.', chips: empty.map((sid) => ({ fix: 'wizard:' + sid, label: SECTION_BY_ID[sid].title, feeds: FEEDS[sid] })) });
    return msgs;
  }
  function messagesPanelHTML() {
    const msgs = demoMessages();
    if (!msgs.length) return `<div class="pm-panel pm-ok"><span>✅</span><div><b>All details complete</b><p>Nothing is missing for the artifacts or the WBS.</p></div></div>`;
    const counts = msgs.reduce((c, m) => ({ ...c, [m.level]: (c[m.level] || 0) + 1 }), {});
    return `<div class="pm-panel"><div class="pm-head"><b>Messages</b>${['error', 'warning', 'info'].filter((l) => counts[l]).map((l) => `<span class="pm-count pm-${l}">${counts[l]} ${MESSAGE_LEVELS[l][0]}</span>`).join('')}</div>` +
      `<ul class="pm-list">${msgs.map((m) => `<li class="pm-item pm-${m.level}"><span class="pm-icon">${MESSAGE_LEVELS[m.level][1]}</span><div class="pm-body"><b>${m.title}</b><p>${m.detail}</p>` +
        (m.chips ? `<div class="pm-chips">${m.chips.map((c) => `<button type="button" class="pm-chip" data-fix="${c.fix}" title="Used by: ${c.feeds.join(', ')}">${c.label}</button>`).join('')}</div>` : '') +
        `</div>${m.fix ? `<button type="button" class="btn sm pm-fix" data-fix="${m.fix}">${m.fixLabel} →</button>` : ''}</li>`).join('')}</ul></div>`;
  }
  // fix buttons: open the wizard on a step, or jump to a chapter
  function wireMessageFixes(container) {
    container.querySelectorAll('[data-fix]').forEach((b) => b.addEventListener('click', () => {
      const [kind, target] = b.dataset.fix.split(':');
      if (kind === 'wizard') STORE.wizardOpenAt = target;
      window.gotoScene(kind === 'wizard' ? 'wizard' : target);
    }));
  }

  // ---------------- Frameless Demo / Video Demo window ----------------
  // Mirrors the app's header buttons (frontend DemoWindows.jsx): a window drawn in
  // the page with minimise (to a dock tab), maximise/restore, full screen, pop out
  // and close; draggable by its title bar, resizable from the corner.
  const DEMO_WINDOWS = {
    demo: { title: 'Interactive Demo', icon: '🎬', hint: 'Self-running product tour', src: 'index.html#welcome' },
    video: { title: 'Video Demo', icon: '▶️', hint: 'Narrated walkthrough videos', src: 'video%20Presentations/index.html' }
  };
  const openWins = {};
  let winZ = 900;
  function dockRefresh() {
    let dock = document.getElementById('dwDock');
    const mins = Object.values(openWins).filter((w) => w.state === 'min');
    if (!mins.length) { if (dock) dock.remove(); return; }
    if (!dock) { dock = document.createElement('div'); dock.id = 'dwDock'; dock.className = 'dw-dock'; document.body.appendChild(dock); }
    dock.innerHTML = mins.map((w) => `<span class="dw-dock-item"><button type="button" data-restore="${w.id}">${DEMO_WINDOWS[w.id].icon} ${DEMO_WINDOWS[w.id].title}</button><button type="button" data-close="${w.id}" aria-label="Close">×</button></span>`).join('');
    dock.querySelectorAll('[data-restore]').forEach((b) => b.addEventListener('click', () => openWins[b.dataset.restore].restore()));
    dock.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => openWins[b.dataset.close].close()));
  }
  function openDemoWindow(id) {
    if (openWins[id]) { openWins[id].restore(); openWins[id].front(); return openWins[id]; }
    const def = DEMO_WINDOWS[id];
    const el = document.createElement('section');
    el.className = 'dw-window';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', def.title);
    const w = Math.min(1100, Math.round(window.innerWidth * 0.8)), h = Math.min(720, Math.round(window.innerHeight * 0.8));
    const pos = { x: Math.round((window.innerWidth - w) / 2) + (id === 'video' ? 24 : 0), y: Math.round((window.innerHeight - h) / 2) + (id === 'video' ? 24 : 0), w, h };
    el.innerHTML = `<header class="dw-titlebar"><span class="dw-title">${def.icon} ${def.title}<small>${def.hint}</small></span><span class="dw-controls">` +
      `<button type="button" data-act="pop" title="Open in a separate window" aria-label="Pop out">⧉</button>` +
      `<button type="button" data-act="min" title="Minimise" aria-label="Minimise">—</button>` +
      `<button type="button" data-act="max" title="Maximise" aria-label="Maximise">□</button>` +
      `<button type="button" data-act="full" title="Full screen" aria-label="Full screen">⛶</button>` +
      `<button type="button" data-act="close" class="dw-close" title="Close" aria-label="Close">×</button></span></header>` +
      `<iframe class="dw-frame" src="${def.src}" title="${def.title}" allow="fullscreen; autoplay" allowfullscreen></iframe>`;
    document.body.appendChild(el);
    const win = { id, el, state: 'normal' };
    const place = () => {
      el.classList.toggle('dw-max', win.state === 'max');
      el.hidden = win.state === 'min';
      if (win.state === 'normal') Object.assign(el.style, { left: pos.x + 'px', top: pos.y + 'px', width: pos.w + 'px', height: pos.h + 'px' });
      else if (win.state === 'max') Object.assign(el.style, { left: '', top: '', width: '', height: '' });
      const mx = el.querySelector('[data-act="max"]');
      mx.textContent = win.state === 'max' ? '❐' : '□';
      mx.title = mx.ariaLabel = win.state === 'max' ? 'Restore' : 'Maximise';
      dockRefresh();
    };
    win.front = () => { el.style.zIndex = ++winZ; };
    win.minimise = () => { win.state = 'min'; place(); };
    win.restore = () => { win.state = 'normal'; place(); win.front(); };
    win.maximise = () => { win.state = win.state === 'max' ? 'normal' : 'max'; place(); };
    win.fullscreen = () => (document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen?.().catch(() => {}));
    win.close = () => { if (document.fullscreenElement === el) document.exitFullscreen(); el.remove(); delete openWins[id]; dockRefresh(); };
    win.popOut = () => { if (window.open(def.src, 'kag-demo-' + id, 'popup=yes,width=1200,height=800')) win.close(); };
    const acts = { pop: win.popOut, min: win.minimise, max: win.maximise, full: win.fullscreen, close: win.close };
    el.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => acts[b.dataset.act]()));
    el.addEventListener('pointerdown', win.front);
    const bar = el.querySelector('.dw-titlebar');
    bar.addEventListener('dblclick', (e) => { if (!e.target.closest('button')) win.maximise(); });
    bar.addEventListener('pointerdown', (e) => {
      if (win.state !== 'normal' || e.button !== 0 || e.target.closest('button')) return;
      const sx = e.clientX, sy = e.clientY, ox = pos.x, oy = pos.y;
      const shield = document.createElement('div'); shield.className = 'dw-shield'; document.body.appendChild(shield);
      const move = (ev) => { pos.x = ox + ev.clientX - sx; pos.y = Math.max(0, oy + ev.clientY - sy); place(); };
      const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); shield.remove(); };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    });
    new ResizeObserver(() => { if (win.state === 'normal') { const r = el.getBoundingClientRect(); pos.w = Math.round(r.width); pos.h = Math.round(r.height); } }).observe(el);
    if (window.innerWidth < 760) win.state = 'max';
    openWins[id] = win;
    place(); win.front();
    return win;
  }
  document.getElementById('btnVideoDemo')?.addEventListener('click', () => openDemoWindow('video'));

  window.__KAG_DEMO_INTERNALS__ = {
    STORE, SECTION_DEFS, SECTION_BY_ID, escapeAttr, sectionTitle, smallTbl, statTile,
    rowsTableHTML, wireRowsTable, refreshRowsTable, formHTML, wireForm, renderSectionContent, computeEffort,
    SRS_FILE, SRS_SECTIONS, applySrsPrefill, TBD, demoMessages, messagesPanelHTML, wireMessageFixes,
    demoResourceLoading, resourceLoadingHTML, openDemoWindow, DEMO_WINDOWS
  };
})();

// ---------------- Scene-specific builders (Wizard, Data Sheet, Effort, WBS, SRS, Artifacts, Layouts) ----------------
(function () {
  'use strict';
  const K = window.__KAG_DEMO_INTERNALS__;
  const { STORE, SECTION_DEFS, SECTION_BY_ID, sectionTitle, smallTbl, statTile,
    wireRowsTable, refreshRowsTable, formHTML, wireForm, renderSectionContent, computeEffort,
    SRS_FILE, SRS_SECTIONS, applySrsPrefill } = K;

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
      const fromSrs = STORE.prefilled && (s.id === '__create__' || SRS_SECTIONS.has(s.id));
      html += `<button type="button" class="wiz-step${i === wizStepIdx ? ' current' : ''}${i < wizStepIdx ? ' done' : ''}" data-step="${i}"><span class="n">${i < wizStepIdx ? '✓' : i + 1}</span><span>${s.title}</span>${fromSrs ? '<span class="srs-tag" title="Pre-filled from the SRS">SRS</span>' : ''}</button>`;
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
      `<h1>New Project Wizard${STORE.prefilled ? ` <small class="prefilled-note">— pre-filled from ${SRS_FILE}</small>` : ''}</h1>` +
      `<p class="lead">Every field from the Excel Data Sheet, step by step — ${WIZ_STEPS.length} steps across four groups. Steps tagged <span class="srs-tag">SRS</span> were filled in by Claude from the uploaded document; you review, add what an SRS can’t know (start date, HR plan) and save.</p>` +
      `<div class="wiz-progress"><div class="wiz-progress-track"><span style="width:${Math.round(((wizStepIdx + 1) / WIZ_STEPS.length) * 100)}%"></span></div></div>` +
      `<div class="wiz-shell" style="margin-top:14px"><div class="wiz-rail" id="wizRail">${wizardRailHTML()}</div><div class="wiz-content" id="wizContent"></div></div>` +
      `<div style="display:flex;justify-content:space-between;margin-top:14px">` +
      `<button type="button" class="btn" id="wizBack">← Back</button>` +
      `<button type="button" class="btn accent" id="wizNext">${wizStepIdx === WIZ_STEPS.length - 1 ? (STORE.prefilled ? 'Save Project →' : 'Create Project →') : 'Next →'}</button></div>`;
    renderWizStep(root);
    root.querySelector('#wizRail').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-step]'); if (!btn) return;
      wizStepIdx = +btn.dataset.step; renderWizardStage(root);
    });
    root.querySelector('#wizBack').addEventListener('click', () => { if (wizStepIdx > 0) { wizStepIdx--; renderWizardStage(root); } });
    root.querySelector('#wizNext').addEventListener('click', () => {
      if (wizStepIdx < WIZ_STEPS.length - 1) { wizStepIdx++; renderWizardStage(root); }
      else { Engine.toast('🎉 Project ' + (STORE.project.project_key || 'DEMO-01') + (STORE.prefilled ? ' saved!' : ' created!')); }
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
      const key = (root.querySelector('#srsKey') || {}).value || 'SRS_Payroll_Module';
      const lines = [
        `Reading ${SRS_FILE} (14 pages)…`,
        `Creating project ${key}…`,
        'Sending to Claude (claude-sonnet-5) via extract_srs tool…',
        '✓ 8 business, 14 functional, 6 non-functional requirements', '✓ 5 use cases, 7 design components, 9 API endpoints',
        '✓ Wizard data: application details, 2 hardware, 4 software, 3 environments',
        '✓ Wizard data: 3 risks, 2 constraints, 2 assumptions, 2 dependencies, 4 modules, 3 goals',
        '✓ Extraction complete — project created and pre-filled'
      ];
      for (const l of lines) {
        const row = document.createElement('div');
        row.className = 'ln';
        row.innerHTML = l.startsWith('✓') ? `<span class="ok">${l}</span>` : l;
        log.appendChild(row);
        await Engine.wait(380);
      }
      applySrsPrefill();
      STORE.project.project_key = key;
      Engine.toast('Project ' + key + ' created — Analysis, Design and wizard data pre-filled');
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

// ---------------- The 15 scenes ----------------
(function () {
  'use strict';
  const K = window.__KAG_DEMO_INTERNALS__;
  const K2 = window.__KAG_DEMO_INTERNALS2__;
  const { STORE, SECTION_BY_ID, refreshRowsTable, computeEffort, SRS_FILE, applySrsPrefill, TBD, messagesPanelHTML, wireMessageFixes, resourceLoadingHTML } = K;
  const { realDownload, WIZ_STEPS, renderWizardStage, renderDatasheetStage, effortHTML, wireEffort, refreshEffort,
    buildWbsRows, wbsHTML, fillWbsBody, runGenerateWbs, runExtraction, ARTIFACTS, openArtifactModal, artCardHTML,
    LAYOUTS, renderLayoutsStage } = K2;

  const root_ = (stage) => stage.querySelector('.scene');

  // ---------- Archive & Delete chapter ----------
  const archivedItem = (k) => `<li data-arch="${k}"><span><b>${k}</b><small>archived today</small></span><button type="button" class="btn sm" data-restore="${k}">Restore</button><button type="button" class="btn sm pm-danger" data-delete="${k}">Delete</button></li>`;
  function refreshManage(root) {
    const P = STORE.projects;
    root.querySelector('#activeGrid').innerHTML = P.active.map((k) => `<div class="art-card" data-key="${k}"><h3>${k}</h3><p>Project</p></div>`).join('') || '<p class="note">No active projects.</p>';
    root.querySelector('#archList').innerHTML = P.archived.map(archivedItem).join('') || '<li class="note">None</li>';
    root.querySelector('#archCount').textContent = P.archived.length;
    wireArchivedList(root);
  }
  function doArchive(root, key) {
    const P = STORE.projects;
    P.active = P.active.filter((k) => k !== key);
    if (!P.archived.includes(key)) P.archived.unshift(key);
    refreshManage(root); Engine.toast(key + ' archived');
  }
  function doRestore(root, key) {
    const P = STORE.projects;
    P.archived = P.archived.filter((k) => k !== key);
    if (!P.active.includes(key)) P.active.push(key);
    refreshManage(root); Engine.toast(key + ' restored');
  }
  function doDelete(root, key) {
    const P = STORE.projects;
    P.active = P.active.filter((k) => k !== key); P.archived = P.archived.filter((k) => k !== key);
    refreshManage(root); Engine.toast(key + ' deleted');
  }
  // mode 'archive' | 'delete'; returns the overlay (the autoplay script clicks it)
  function manageConfirm(root, mode, key = 'PAYROLL-2.0') {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = mode === 'archive'
      ? `<div class="modal-box"><div class="modal-head"><h3>Archive project</h3><button type="button" class="modal-close">&times;</button></div><div class="modal-body"><p style="margin-top:0"><b>Archive ${key}?</b></p><p>It is hidden from your project lists, but all its data is kept — restore it any time from “Archived projects” on the start screen.</p></div><div class="modal-foot"><button type="button" class="btn accent" data-act="archive">Archive</button><button type="button" class="btn" data-act="cancel">Cancel</button></div></div>`
      : `<div class="modal-box"><div class="modal-head"><h3>Delete project</h3><button type="button" class="modal-close">&times;</button></div><div class="modal-body"><p style="margin-top:0"><b>Permanently delete ${key}?</b></p><p>This removes the project and everything in it — the uploaded SRS, Analysis &amp; Design, Data Sheet sections, HR plan, WBS and timesheet. It cannot be undone.</p><p>To keep the data but hide the project, archive it instead.</p></div><div class="modal-foot"><button type="button" class="btn pm-danger" data-act="delete">Delete permanently</button><button type="button" class="btn" data-act="archive">Archive instead</button><button type="button" class="btn" data-act="cancel">Cancel</button></div></div>`;
    root.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.querySelector('[data-act="cancel"]').addEventListener('click', close);
    overlay.querySelector('[data-act="archive"]').addEventListener('click', () => { close(); doArchive(root, key); });
    const del = overlay.querySelector('[data-act="delete"]');
    if (del) del.addEventListener('click', () => { close(); doDelete(root, key); });
    return overlay;
  }
  function wireArchivedList(root) {
    root.querySelectorAll('#archList [data-restore]').forEach((b) => b.addEventListener('click', () => doRestore(root, b.dataset.restore)));
    root.querySelectorAll('#archList [data-delete]').forEach((b) => b.addEventListener('click', () => manageConfirm(root, 'delete', b.dataset.delete)));
  }
  function wireManage(root) {
    root.querySelector('#archBtn').addEventListener('click', () => { if (STORE.projects.active.includes('PAYROLL-2.0')) manageConfirm(root, 'archive'); else Engine.toast('PAYROLL-2.0 is already archived — restore it below.'); });
    root.querySelector('#delBtn').addEventListener('click', () => { if (STORE.projects.active.concat(STORE.projects.archived).includes('PAYROLL-2.0')) manageConfirm(root, 'delete'); else Engine.toast('PAYROLL-2.0 was deleted — restart the demo to bring it back.'); });
    root.querySelector('#switchBtn').addEventListener('click', () => Engine.toast('Back to the start screen to pick another project.'));
    wireArchivedList(root);
  }


  // Generate WBS as the app does: errors block (message), warnings ask first.
  // Returns the confirm overlay when one was opened (the autoplay script clicks it).
  function generateWithChecks(root) {
    const rl = K.demoResourceLoading();
    if (rl.errors.length) { Engine.toast('⛔ WBS not generated — fix the resource loading first'); return null; }
    if (!rl.warnings.length) { runGenerateWbs(root); return null; }
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-box"><div class="modal-head"><h3>Check resource loading</h3><button type="button" class="modal-close">&times;</button></div>` +
      `<div class="modal-body"><p style="margin-top:0">Resource loading needs a look before generating the WBS:</p><ul class="rl-issues">${rl.warnings.map((w) => `<li>⚠️ ${w}</li>`).join('')}</ul><p>Generate the WBS anyway?</p></div>` +
      `<div class="modal-foot"><button type="button" class="btn" data-act="fix">Fix first</button><button type="button" class="btn accent" data-act="anyway">Generate anyway</button></div></div>`;
    root.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.querySelector('[data-act="fix"]').addEventListener('click', () => { close(); Engine.toast('Open the HR plan to adjust the shares, then generate again.'); });
    overlay.querySelector('[data-act="anyway"]').addEventListener('click', () => { close(); runGenerateWbs(root); });
    return overlay;
  }

  const DEMO_PROJECTS = [{ key: 'GICPI-V1110', type: 'Web Application' }, { key: 'PAYROLL-2.0', type: 'Migration' }];
  const RECAP = [
    'SRS-first onboarding — upload a requirements doc and the project is created for you',
    'Claude extracts Analysis & Design plus the wizard data (app details, hardware, software, risks, modules…)',
    'Pre-filled New Project wizard — review, complete and save in place',
    'Messages section — flags missing details, with one-click fixes',
    'Archive (restorable) or permanently delete a project, right before Switch Project',
    'Demo & Video Demo buttons in every header — open in a frameless window (minimise, maximise, full screen)',
    'Resource loading check before generating the WBS — blocks over-allocation, flags overloads',
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
          `<p class="lead">One master <b>Data Sheet</b> drives everything: a Kick-Off deck, an Application Initiation Note, a full Internal Project Plan, a JIRA-ready WBS — and, powered by Claude, an AI-generated Analysis &amp; Design Document straight from your SRS. Start by uploading the SRS: Claude creates the project and pre-fills the project wizard for you.</p>` +
          `<div class="chip-row">${['🤖 <b>SRS-First, AI Pre-filled</b>', '🧭 <b>Guided Wizard</b>', '🔔 <b>Missing-Detail Messages</b>', '📊 <b>Live Effort &amp; Schedule Calc</b>', '📄 <b>12 Generated Artifacts</b>', '⬇️ <b>5 Export Formats</b>', '🎨 <b>3 Switchable UI Layouts</b>'].map((c) => `<span class="chip">${c}</span>`).join('')}</div>` +
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
        E.setCaption('Logged in — the first screen is Upload Requirements Document.', 'GUIDE');
        await E.wait(900);
      }
    },
    {
      id: 'start', group: 'SRS-First Onboarding', icon: '🤖', title: 'Start From Your SRS',
      blurb: 'The first screen after login: upload an SRS and Claude creates the project for you.',
      render(root) {
        root.innerHTML = `<h1>Upload Requirements Document</h1><p class="lead">The first screen after login. Upload a .txt, .md or .pdf SRS (up to 10 MB) — the project is created from it, and Claude fills in its details, the Analysis &amp; Design documents and the New Project wizard via a structured <code>extract_srs</code> tool call.</p>` +
          `<div class="device" style="max-width:600px"><div class="device-bar"><div class="device-dots"><i></i><i></i><i></i></div><div class="device-url">kag.local — Upload Requirements Document</div></div>` +
          `<div class="device-body"><div class="dropzone" id="dropzone"><span class="dz-icon">📄</span><span id="dzLabel">Choose a file…</span></div>` +
          `<div class="form-grid" style="margin-top:12px"><label class="field full"><span>Project Key</span><input id="srsKey" placeholder="Defaults to the file name"></label></div>` +
          `<div class="chip-row"><button type="button" class="btn" id="manualBtn">Create manually instead</button><button type="button" class="btn accent" id="analyzeBtn">Upload &amp; Analyze →</button></div>` +
          `<div class="extract-log" id="extractLog" style="display:none"></div>` +
          `<h2 style="margin-top:18px">Or open an existing project</h2>` +
          `<div class="card-grid">${DEMO_PROJECTS.map((p) => `<button type="button" class="art-card" data-proj="${p.key}"><h3>${p.key}</h3><p>${p.type}</p></button>`).join('')}</div></div></div>`;
        const pickFile = () => {
          root.querySelector('#dzLabel').textContent = SRS_FILE;
          root.querySelector('#dropzone').classList.add('drag');
          const key = root.querySelector('#srsKey');
          if (!key.value) key.value = SRS_FILE.replace(/\.[^.]+$/, '');
        };
        root.querySelector('#dropzone').addEventListener('click', pickFile);
        root.querySelector('#analyzeBtn').addEventListener('click', async () => {
          pickFile();
          await runExtraction(root);
          await Engine.wait(900);
          window.gotoScene('review');
        });
        root.querySelector('#manualBtn').addEventListener('click', () => Engine.toast('Opens the same step-by-step wizard with a blank draft — no SRS needed.'));
        root.querySelectorAll('[data-proj]').forEach((c) => c.addEventListener('click', () => {
          Engine.toast('Opening ' + c.dataset.proj + '’s Analysis & Design home…');
          window.gotoScene('artifacts');
        }));
      },
      async script(E, stage) {
        const root = root_(stage);
        E.setCaption('Dropping ' + SRS_FILE + ' onto the upload zone — the Project Key defaults to the file name.', 'GUIDE');
        await E.clickFx(root.querySelector('#dropzone'));
        root.querySelector('#dropzone').click();
        await E.pulse(root.querySelector('#srsKey'), 500);
        await E.clickFx(root.querySelector('#analyzeBtn'));
        E.setCaption('The project is created, then Claude reads the document and extracts structured data…', 'AI');
        await runExtraction(root);
        await E.wait(900);
      }
    },
    {
      id: 'review', group: 'SRS-First Onboarding', icon: '✅', title: 'Review Extracted Data',
      blurb: 'A summary of what Claude found, with a one-click jump into the pre-filled wizard.',
      render(root) {
        applySrsPrefill();
        root.innerHTML = `<h1>Review What Claude Found</h1><p class="lead">A summary of the extraction for <b>${STORE.project.project_key}</b> — then open the pre-filled wizard, or go straight to the Analysis &amp; Design documents.</p>` +
          `<div class="stat-grid">${[['Business Reqs', 'brStat'], ['Functional Reqs', 'frStat'], ['Non-Functional Reqs', 'nfrStat'], ['Use Cases', 'ucStat'], ['Components', 'compStat'], ['API Endpoints', 'epStat']].map(([label, id]) => `<div class="stat-tile"><b id="${id}">0</b><span>${label}</span></div>`).join('')}</div>` +
          `<div class="form-grid" style="margin-top:10px">` +
          `<div class="field full"><span>Brief Description</span><p style="color:var(--text-dim);font-size:13px;margin:4px 0 0">${STORE.project.brief_desc}</p></div>` +
          `<div class="field"><span>Scope</span><p style="color:var(--text-dim);font-size:13px;margin:4px 0 0">${STORE.project.scope}</p></div>` +
          `<div class="field"><span>Technology</span><p style="color:var(--text-dim);font-size:13px;margin:4px 0 0">${STORE.project.technology}</p></div></div>` +
          `<div class="wizard-cta"><div><b>Complete the project setup</b><p>Open the New Project wizard pre-filled with everything found in the SRS — application details, hardware, software, risks, modules and more.</p></div>` +
          `<button type="button" class="btn accent" id="openWizardBtn">Open New Project Wizard</button></div>` +
          `<button type="button" class="btn" id="reviewContinue" style="margin-top:16px">Continue to Analysis &amp; Design →</button>`;
        root.querySelector('#openWizardBtn').addEventListener('click', () => window.gotoScene('wizard'));
        root.querySelector('#reviewContinue').addEventListener('click', () => window.gotoScene('artifacts'));
      },
      async script(E, stage) {
        const root = root_(stage);
        const targets = { brStat: 8, frStat: 14, nfrStat: 6, ucStat: 5, compStat: 7, epStat: 9 };
        for (const [id, target] of Object.entries(targets)) {
          const node = root.querySelector('#' + id);
          for (let v = 0; v <= target; v++) { node.textContent = v; await E.wait(32); }
        }
        E.setCaption('These feed the Analysis and Design documents — and the wizard is ready, pre-filled.', 'GUIDE');
        await E.wait(400);
        await E.clickFx(root.querySelector('#openWizardBtn'));
        E.setCaption('Opening the New Project wizard on this project…', 'GUIDE');
        await E.wait(600);
      }
    },
    {
      id: 'wizard', group: 'SRS-First Onboarding', icon: '🧭', title: 'Pre-filled Project Wizard',
      blurb: 'The step-by-step wizard, already filled in from the SRS — review, complete and save.',
      render(root) {
        applySrsPrefill();
        K2.wizStepIdx = Math.max(0, WIZ_STEPS.findIndex((s) => s.id === STORE.wizardOpenAt));
        STORE.wizardOpenAt = null;
        renderWizardStage(root);
      },
      async script(E, stage) {
        const root = root_(stage);
        applySrsPrefill();
        const show = async (id, caption, ms = 650) => {
          K2.wizStepIdx = WIZ_STEPS.findIndex((s) => s.id === id); renderWizardStage(root);
          E.setCaption(caption, 'AI');
          await E.wait(300);
          const pane = root.querySelector('#wizContent');
          await E.pulse(pane.querySelector('.rows-body') || pane.querySelector('.form-grid') || pane, ms);
          return root.querySelector('#wizContent');
        };
        K2.wizStepIdx = 0; renderWizardStage(root);
        E.setCaption('Create Project — key, FP estimate, technology, description and scope came from the SRS.', 'AI');
        await E.wait(400);
        await E.pulse(root.querySelector('#wizContent .form-grid'), 700);
        E.setCaption('The start date isn’t in the SRS — that’s yours to add.', 'GUIDE');
        await E.typeInto(root.querySelector('[data-key="start_date"]'), '2026-09-14');
        await show('appDetails', 'Application Details — name, domain, technology and description, all from the SRS.');
        await show('hardware', 'Hardware — both servers and their specs were read from the document.');
        await show('risks', 'Risks — three risks extracted; edit or delete any of them.');
        await show('modules', 'Module Details — four functional modules identified by Claude.');
        const pane = await show('hrplan', 'Human Resource Plan — an SRS never names the team, so a standard role-wise team was added with placeholder people.', 700);
        const pmIdx = STORE.rows.hrplan.findIndex((r) => r.role === 'Project Owner' && r.name === TBD);
        if (pmIdx >= 0) {
          E.setCaption('Assigning a real person to the Project Owner role…', 'GUIDE');
          await E.typeInto(pane.querySelectorAll(`.rows-body tr[data-i="${pmIdx}"] input`)[1], 'Meera Iyer');
        }
        K2.wizStepIdx = WIZ_STEPS.length - 1; renderWizardStage(root);
        await E.wait(300);
        await E.clickFx(root.querySelector('#wizNext'));
        E.toast('🎉 Project ' + STORE.project.project_key + ' saved!');
        E.setCaption('Saved in place — the same project, now complete. Every artifact picks up this data.', 'GUIDE');
        await E.wait(900);
      }
    },
    {
      id: 'messages', group: 'SRS-First Onboarding', icon: '🔔', title: 'Messages — What’s Missing',
      blurb: 'A Messages section flags missing details, each with a button that jumps straight to the fix.',
      render(root) {
        applySrsPrefill();
        root.innerHTML = `<h1>Messages — What’s Missing</h1><p class="lead">The project home, classic Home and Modern layout all show a <b>Messages</b> section: what’s still missing for the artifacts and the WBS, how serious it is, and a button that jumps straight to the fix. It updates as you complete things.</p>` +
          `<div class="device" style="max-width:760px"><div class="device-bar"><div class="device-dots"><i></i><i></i><i></i></div><div class="device-url">kag.local — Analysis &amp; Design</div></div>` +
          `<div class="device-body"><div style="font-weight:700;font-size:16px;margin-bottom:2px">Analysis &amp; Design</div><p class="note" style="margin:0 0 12px">${STORE.project.project_key} — generate, preview and download your project artifacts.</p>` +
          `<div id="pmHolder">${messagesPanelHTML()}</div>` +
          `<div class="card-grid" style="margin-top:12px">${['Analysis Document', 'Design Document'].map((n) => `<div class="art-card"><span class="badge">AI-GENERATED</span><h3>${n}</h3><p>Preview &amp; download →</p></div>`).join('')}</div></div></div>` +
          `<div class="stat-grid" style="margin-top:14px">${[['⛔', 'Action needed', 'Blocks output — e.g. no Start Date or an FP Count of 0'], ['⚠️', 'Recommended', 'Placeholder team members, no SRS analysed, empty application details'], ['ℹ️', 'Tip', 'WBS not generated yet, empty optional sections and the artifacts they feed']].map(([i, t, d]) => `<div class="stat-tile" style="text-align:left"><b style="font-size:14px;font-family:var(--sans);color:var(--text)">${i} ${t}</b><span>${d}</span></div>`).join('')}</div>`;
        wireMessageFixes(root.querySelector('#pmHolder'));
      },
      async script(E, stage) {
        const root = root_(stage);
        const holder = root.querySelector('#pmHolder');
        const refresh = () => { holder.innerHTML = messagesPanelHTML(); wireMessageFixes(holder); };
        for (const li of holder.querySelectorAll('.pm-item')) {
          const title = li.querySelector('b').textContent;
          E.setCaption(title + (li.classList.contains('pm-warning') ? ' — recommended before sharing the artifacts.' : li.classList.contains('pm-error') ? ' — this blocks output.' : ' — a tip.'), 'GUIDE');
          await E.pulse(li, 900);
        }
        const assign = holder.querySelector('[data-fix="wizard:hrplan"]');
        if (assign) {
          await E.clickFx(assign);
          E.setCaption('“Assign people” opens the wizard on the HR plan — here we assign both developers…', 'GUIDE');
          await E.wait(500);
          for (const [role, who] of [['Developer1', 'Ravi Menon'], ['Developer2', 'Anita Rao']]) {
            const r = STORE.rows.hrplan.find((x) => x.role === role && x.name === TBD);
            if (r) r.name = who;
          }
          refresh();
          E.setCaption('…and the message updates: fewer roles left to assign.', 'LIVE');
          await E.pulse(holder.querySelector('.pm-warning') || holder.querySelector('.pm-panel'), 900);
        }
        const wbsBtn = holder.querySelector('[data-fix="scene:wbs"]');
        if (wbsBtn) {
          await E.pulse(wbsBtn, 700);
          E.setCaption('Everything the WBS needs is in place — “Generate WBS” jumps straight to it (see the Generate chapter).', 'GUIDE');
          await E.wait(900);
        }
      }
    },
    {
      id: 'manage', group: 'SRS-First Onboarding', icon: '🗃️', title: 'Archive & Delete Projects',
      blurb: 'Archive a project to hide it (restorable any time), or delete it permanently — right before Switch Project.',
      render(root) {
        if (!STORE.projects) STORE.projects = { active: [STORE.project.project_key, 'GICPI-V1110', 'PAYROLL-2.0'], archived: ['LEGACY-HR'] };
        const P = STORE.projects;
        root.innerHTML = `<h1>Archive &amp; Delete Projects</h1><p class="lead">On the project home, <b>Archive project</b> and <b>Delete project</b> sit right before <b>Switch Project</b>. Archiving hides a project from every project list but keeps all its data — restore it from <b>Archived projects</b> on the start screen. Deleting is permanent and removes everything; its confirmation offers <b>Archive instead</b>.</p>` +
          `<div class="device" style="max-width:720px"><div class="device-bar"><div class="device-dots"><i></i><i></i><i></i></div><div class="device-url">kag.local — Analysis &amp; Design</div></div>` +
          `<div class="device-body"><div style="font-weight:700;font-size:16px">Analysis &amp; Design</div><p class="note" style="margin:2px 0 12px">PAYROLL-2.0 — generate, preview and download your project artifacts.</p>` +
          `<div class="pm-actions"><button type="button" class="btn sm" id="archBtn">🗃️ Archive project</button><button type="button" class="btn sm pm-danger" id="delBtn">🗑 Delete project</button><span style="flex:1"></span><button type="button" class="btn sm" id="switchBtn">← Switch Project</button></div></div></div>` +
          `<div class="device" style="max-width:720px;margin-top:14px"><div class="device-bar"><div class="device-dots"><i></i><i></i><i></i></div><div class="device-url">kag.local — start screen</div></div>` +
          `<div class="device-body"><div style="font-weight:700;margin-bottom:8px">Or open an existing project</div><div class="card-grid" id="activeGrid">${P.active.map((k) => `<div class="art-card" data-key="${k}"><h3>${k}</h3><p>Project</p></div>`).join('')}</div>` +
          `<div style="font-weight:700;margin:16px 0 8px">Archived projects (<span id="archCount">${P.archived.length}</span>)</div><ul class="arch-list" id="archList">${P.archived.map((k) => archivedItem(k)).join('')}</ul></div></div>`;
        wireManage(root);
      },
      async script(E, stage) {
        const root = root_(stage);
        const P = STORE.projects;
        E.setCaption('Archive and Delete sit right before Switch Project on the project home.', 'GUIDE');
        await E.pulse(root.querySelector('.pm-actions'), 900);
        await E.clickFx(root.querySelector('#archBtn'));
        let ov = manageConfirm(root, 'archive');
        E.setCaption('Archiving hides PAYROLL-2.0 from the lists — all its data is kept.', 'GUIDE');
        await E.wait(1300);
        await E.clickFx(ov.querySelector('[data-act="archive"]'));
        ov.remove(); doArchive(root, 'PAYROLL-2.0');
        await E.pulse(root.querySelector('#archList'), 900);
        E.setCaption('It now appears under Archived projects — Restore brings it straight back.', 'GUIDE');
        const restore = root.querySelector('#archList [data-restore="PAYROLL-2.0"]');
        if (restore) { await E.clickFx(restore); doRestore(root, 'PAYROLL-2.0'); }
        await E.pulse(root.querySelector('#activeGrid'), 700);
        await E.clickFx(root.querySelector('#delBtn'));
        ov = manageConfirm(root, 'delete');
        E.setCaption('Delete is permanent — the dialog says what goes and offers “Archive instead”.', 'GUIDE');
        await E.wait(1800);
        await E.clickFx(ov.querySelector('[data-act="cancel"]'));
        ov.remove();
        E.setCaption('Cancelled — nothing deleted. Only the project’s owner can archive or delete it.', 'GUIDE');
        await E.wait(900);
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
      blurb: 'Resource loading is checked first, then a JIRA-ready WBS is generated from HR-plan roles and task templates.',
      render(root) {
        root.innerHTML = `<h1>Generate WBS (for JIRA)</h1>` +
          `<p class="lead">Per HR-plan resource, task templates are copied and scaled by % contribution — meetings and fixed-share tasks are excluded from scaling. Before anything is written, each person’s WBS hours are checked against their working time: over-allocation blocks generation, overloads ask you to confirm.</p>` +
          `<div id="rlHolder">${resourceLoadingHTML()}</div>` +
          `<button type="button" class="btn accent" id="genWbsBtn" style="margin-top:14px">🧩 Generate WBS</button>` +
          `<div id="wbsHolder" style="margin-top:14px">${wbsHTML(STORE.wbsRows)}</div>`;
        root.querySelector('#genWbsBtn').addEventListener('click', () => generateWithChecks(root));
        if (STORE.wbsRows.length) fillWbsBody(root);
      },
      async script(E, stage) {
        const root = root_(stage);
        E.setCaption('Resource loading: each person’s WBS hours vs their full-time working hours.', 'LIVE');
        await E.pulse(root.querySelector('#rlHolder .rl-panel'), 900);
        const over = root.querySelector('#rlHolder tr[data-status="overloaded"]');
        if (over) {
          E.setCaption('Developer1’s tasks don’t fit their working time — the message says exactly how far to lower their %.', 'GUIDE');
          await E.pulse(over, 1100);
        }
        await E.clickFx(root.querySelector('#genWbsBtn'));
        const overlay = generateWithChecks(root);
        if (overlay) {
          E.setCaption('Warnings don’t block — Generate WBS asks: fix first, or generate anyway?', 'GUIDE');
          await E.wait(1600);
          await E.clickFx(overlay.querySelector('[data-act="anyway"]'));
          overlay.remove();
        }
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
      id: 'help', group: 'Flexibility', icon: '🎓', title: 'Demo & Video Demo Buttons',
      blurb: 'Every header has Demo and Video Demo buttons — they open in a frameless window you can minimise, maximise or go full screen.',
      render(root) {
        root.innerHTML = `<h1>Demo &amp; Video Demo — Built In</h1><p class="lead">Every layout’s header — and the login and sign-up pages — has <b>🎬 Demo</b> and <b>▶ Video Demo</b> buttons, so anyone can learn the app without leaving it. Each opens in a <b>frameless window</b> inside the app. Try them below — the Video Demo window shows the real narrated videos.</p>` +
          `<div class="device" style="max-width:820px"><div class="device-bar"><div class="device-dots"><i></i><i></i><i></i></div><div class="device-url">kag.local — any layout’s header</div></div>` +
          `<div class="device-body"><div class="mock-header"><span class="mh-brand"><span class="tb-logo">KA</span> Key Artifact Generator</span><span class="mh-actions">` +
          `<button type="button" class="btn sm" id="mhDemo">🎬 Demo</button><button type="button" class="btn sm" id="mhVideo">▶ Video Demo</button><button type="button" class="btn sm">Advanced / Full Editor</button><span class="note" style="margin:0">Priya Shah</span></span></div>` +
          `<p class="note" style="margin:12px 0 0">Also on the login and sign-up pages: <i>“New here? See how it works: 🎬 Demo · ▶ Video Demo”</i></p></div></div>` +
          `<div class="stat-grid" style="margin-top:14px">${[['—', 'Minimise', 'Collapse to a tab at the bottom — click it to restore'], ['□', 'Maximise / Restore', 'Fill the screen; double-click the title bar too'], ['⛶', 'Full screen', 'The browser’s real full screen — great for presenting'], ['⧉', 'Pop out', 'Open as a separate window, e.g. on a second monitor'], ['✥', 'Drag &amp; resize', 'Move it by the title bar, resize from the corner'], ['×', 'Close', 'Both windows can be open at once']].map(([i, t, d]) => `<div class="stat-tile" style="text-align:left"><b style="font-size:14px;font-family:var(--sans);color:var(--text)">${i}&nbsp; ${t}</b><span>${d}</span></div>`).join('')}</div>`;
        root.querySelector('#mhDemo').addEventListener('click', () => K.openDemoWindow('demo'));
        root.querySelector('#mhVideo').addEventListener('click', () => K.openDemoWindow('video'));
      },
      async script(E, stage) {
        const root = root_(stage);
        const btns = root.querySelector('.mh-actions');
        E.setCaption('Demo and Video Demo sit in every header — next to the layout’s own controls.', 'GUIDE');
        await E.pulse(btns, 900);
        await E.clickFx(root.querySelector('#mhVideo'));
        const win = K.openDemoWindow('video');
        E.setCaption('Video Demo opens in a frameless window — the narrated walkthrough videos.', 'GUIDE');
        try {
          await E.wait(2600);
          await E.clickFx(win.el.querySelector('[data-act="max"]'));
          win.maximise();
          E.setCaption('Maximise fills the screen (or go full screen with ⛶ for presenting).', 'GUIDE');
          await E.wait(1800);
          await E.clickFx(win.el.querySelector('[data-act="max"]'));
          win.maximise();
          await E.wait(700);
          await E.clickFx(win.el.querySelector('[data-act="min"]'));
          win.minimise();
          E.setCaption('Minimise keeps it as a tab at the bottom — carry on working, restore it any time.', 'GUIDE');
          await E.pulse(document.getElementById('dwDock'), 1300);
          win.restore();
          await E.wait(900);
        } finally {
          win.close();
        }
        E.setCaption('Close it when done — the app is right where you left it.', 'GUIDE');
        await E.wait(700);
      }
    },
    {
      id: 'finish', group: 'Flexibility', icon: '🏁', title: 'Recap & Next Steps',
      blurb: "That's the full tour of Key Artifact Generator.",
      render(root) {
        root.innerHTML = `<h1>You've seen the full tour</h1><p class="lead">Everything Key Artifact Generator does, end to end — from a blank Data Sheet to a client-ready artifact set.</p>` +
          `<ul class="checklist" id="recapList">${RECAP.map((t) => `<li><span class="tick">•</span><span>${t}</span></li>`).join('')}</ul>` +
          `<div class="chip-row"><button type="button" class="btn accent" id="finishRestart">↺ Restart the demo</button><button type="button" class="btn" id="finishExplore">🖱 Switch to Explore</button></div>` +
          `<p class="note" style="margin-top:18px">Want the real thing? See <b>README.md</b> in the project root, or run <code>docker compose up -d --build</code> there and open <code>http://localhost:8081</code>.</p>`;
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
