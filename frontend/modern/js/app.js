// Key Artifact Generator - Modern UI (header + 2-column layout, accordions, popups)
// Reuses the same REST API as the classic Excel UI; artifact previews reuse the
// classic sheet renderers via the App shim below.

// ---- App shim so the classic sheet modules (js/sheets/*.js) can register ----
window.App = {
  sheets: [],
  registerSheet(s) { this.sheets.push(s); },
  get projectId() { return Modern.projectId; },
  goToSection() { Modern.closeModal(); Modern.openGroup('app'); },
  generateWbs() { return Modern.generateWbs(); },
  generateTimesheet() { return Modern.generateTimesheet(); },
  openTimesheetModal() { return Modern.openTimesheetModal(); },
  addWbsRow() { return Modern.addWbsRow(); },
  editWbsRow(row) { return Modern.editWbsRow(row); },
  deleteWbsRow(row) { return Modern.deleteWbsRow(row); },
  activateSheet() {},
  reloadAll() { return Modern.reload(); }
};

const Modern = {
  projectId: null,
  data: {},
  activeGroup: 'app',
  activeSection: null,
  layoutMode: 'accordion',   // 'accordion' | 'tabs' (persisted)

  // ---------------- field/config definitions ----------------
  fields: {
    application: [
      { key: 'app_name', label: 'Application Name' },
      { key: 'irn_no', label: 'IRN No' },
      { key: 'app_size_fp', label: 'Application Size in FP', type: 'number' },
      { key: 'front_office', label: 'Front Office' },
      { key: 'domain', label: 'Domain' },
      { key: 'category', label: 'Category' },
      { key: 'description', label: 'Application Description', type: 'textarea', full: true },
      { key: 'acceptance_criteria', label: 'Acceptance Criteria', type: 'textarea', full: true },
      { key: 'life_cycle', label: 'Life Cycle', type: 'textarea', full: true },
      { key: 'dcv', label: 'DCV' },
      { key: 'cvs', label: 'CVS' },
      { key: 'technology', label: 'Technology' },
      { key: 'scope', label: 'Scope', type: 'textarea', full: true },
      { key: 'org_chart_link', label: 'Org. Chart', full: true },
      { key: 'quality_plan_link', label: 'Quality Plan', full: true },
      { key: 'corfou_link', label: 'CORFOU Link', full: true },
      { key: 'hr_plan_link', label: 'Human Resource Plan', full: true },
      { key: 'radar_link', label: 'Radar Link', full: true }
    ],
    project: [
      { key: 'project_key', label: 'Project Key' },
      { key: 'project_type', label: 'Type' },
      { key: 'fp_count', label: 'FP Count', type: 'number' },
      { key: 'productivity_factor', label: 'Productivity Factor', type: 'number' },
      { key: 'start_date', label: 'Schedule — Start Date', type: 'date' },
      { key: 'avg_daily_res_pct', label: 'Average Daily Res %', type: 'number' },
      { key: 'technology', label: 'Tech' },
      { key: 'doc_owner_ipn', label: 'Doc Owner IPN' },
      { key: 'brief_desc', label: 'Brief Desc', type: 'textarea', full: true },
      { key: 'scope', label: 'Scope', type: 'textarea', full: true },
      { key: 'software_req', label: 'Software Req.', full: true },
      { key: 'hardware_req', label: 'Hardware Req.', full: true },
      { key: 'quality_objective', label: 'Quality Objective', type: 'textarea', full: true },
      { key: 'life_cycle', label: 'Project Life Cycle', type: 'textarea', full: true },
      { key: 'shared_folder_path', label: 'Shared folder path', full: true },
      { key: 'other_info', label: 'Other information', full: true },
      { key: 'naming_convention', label: 'Naming convention', type: 'textarea', full: true }
    ],
    hardware: [
      { key: 'sno', label: 'S.No', type: 'number' },
      { key: 'description', label: 'Description' },
      { key: 'spec', label: 'Configuration/Specification' },
      { key: 'quantity', label: 'Quantity', type: 'number' },
      { key: 'start_date', label: 'Start Date', type: 'date' },
      { key: 'end_date', label: 'End Date', type: 'date' }
    ],
    software: [
      { key: 'sno', label: 'S.No', type: 'number' },
      { key: 'description', label: 'Description' },
      { key: 'version', label: 'Version' },
      { key: 'installations', label: 'No. of Installations', type: 'number' },
      { key: 'start_date', label: 'Start Date', type: 'date' },
      { key: 'end_date', label: 'End Date', type: 'date' }
    ],
    environments: [
      { key: 'env_name', label: 'Environment' },
      { key: 'server_path', label: 'Server' },
      { key: 'access_type', label: 'Access' }
    ],
    dar: [
      { key: 'sno', label: 'S.No', type: 'number' },
      { key: 'task', label: 'Task/Phase for formal evaluation', full: true },
      { key: 'participants', label: 'Participants' },
      { key: 'remarks', label: 'Remarks' }
    ],
    docs: [
      { key: 'name', label: 'Document/Item Name' },
      { key: 'version', label: 'Version No./Specifications' },
      { key: 'copy_type', label: 'Hard copy/ Soft Copy' }
    ],
    goals: [
      { key: 'sno', label: 'S.No', type: 'number' },
      { key: 'metric_name', label: 'Metric Name', full: true },
      { key: 'frequency', label: 'Frequency of collection' },
      { key: 'target', label: 'Target' },
      { key: 'commitment', label: 'Commitment' },
      { key: 'source', label: 'Source of Metrics' },
      { key: 'storage', label: 'Storage Location' }
    ],
    training: [
      { key: 'sno', label: 'S.No', type: 'number' },
      { key: 'name', label: 'Name of training' },
      { key: 'train_type', label: 'Type of training' },
      { key: 'participants', label: 'Participants Name/Profile' },
      { key: 'start_date', label: 'Planned start date', type: 'date' },
      { key: 'end_date', label: 'Planned End date', type: 'date' }
    ],
    process: [
      { key: 'sno', label: 'S.No', type: 'number' },
      { key: 'process_name', label: 'Process Name' },
      { key: 'applicable', label: 'Applicable', type: 'select', options: ['Yes', 'NO'] },
      { key: 'tailoring', label: 'Applicable tailoring (if any)' }
    ],
    hrplan: [
      { key: 'sno', label: 'S.No', type: 'number' },
      { key: 'role_acronym', label: 'Role Acronym' },
      { key: 'role_name', label: 'Role' },
      { key: 'resource_name', label: 'Name of the Resource' },
      { key: 'resource_ipn', label: 'Resource IPN' },
      { key: 'contribution_pct', label: '% Contribution', type: 'number' },
      { key: 'start_date', label: 'Start Date', type: 'date' },
      { key: 'end_date', label: 'End Date', type: 'date' }
    ],
    modules: [
      { key: 'sno', label: 'S.No', type: 'number' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'dev_res', label: 'Dev Resources' },
      { key: 'tl_res', label: 'TL Resources' },
      { key: 'testers', label: 'Testers' }
    ],
    agenda: [
      { key: 'sno', label: 'S.No', type: 'number' },
      { key: 'topic', label: 'Topic', full: true }
    ],
    resources: [
      { key: 'ipn', label: 'IPN' },
      { key: 'role', label: 'Role' },
      { key: 'role_desc', label: 'Role Description' },
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'phone', label: 'Phone' }
    ],
    listItem: [
      { key: 'sno', label: 'S.No', type: 'number' },
      { key: 'description', label: 'Description', type: 'textarea', full: true }
    ],
    stdRoles: [
      { key: 'role_acronym', label: 'Role' },
      { key: 'responsibility', label: 'Responsibility', type: 'textarea', full: true }
    ],
    stdTools: [
      { key: 'sno', label: 'S.No', type: 'number' },
      { key: 'activity', label: 'Activity' },
      { key: 'standards', label: 'Standards/Techniques' },
      { key: 'tools', label: 'Tools/Templates' },
      { key: 'version', label: 'Version' }
    ],
    stdMatrix: [
      { key: 'activity', label: 'Important Activity', full: true },
      { key: 'vh', label: 'VH', type: 'select', options: ['', 'E', 'P', 'O', 'ES'] },
      { key: 'odo', label: 'ODO', type: 'select', options: ['', 'E', 'P', 'O', 'ES'] },
      { key: 'po', label: 'PO', type: 'select', options: ['', 'E', 'P', 'O', 'ES'] },
      { key: 'qado', label: 'QADO', type: 'select', options: ['', 'E', 'P', 'O', 'ES'] },
      { key: 'qa', label: 'QA', type: 'select', options: ['', 'E', 'P', 'O', 'ES'] },
      { key: 'tdo', label: 'TDO', type: 'select', options: ['', 'E', 'P', 'O', 'ES'] },
      { key: 'tos', label: 'TO', type: 'select', options: ['', 'E', 'P', 'O', 'ES'] },
      { key: 'team', label: 'Project team', type: 'select', options: ['', 'E', 'P', 'O', 'ES'] },
      { key: 'di', label: 'DI', type: 'select', options: ['', 'E', 'P', 'O', 'ES'] },
      { key: 'sepg', label: 'SEPG', type: 'select', options: ['', 'E', 'P', 'O', 'ES'] },
      { key: 'fo', label: 'FO', type: 'select', options: ['', 'E', 'P', 'O', 'ES'] },
      { key: 'ssm', label: 'SSM', type: 'select', options: ['', 'E', 'P', 'O', 'ES'] },
      { key: 'remarks', label: 'Remarks', full: true }
    ],
    stdFolders: [
      { key: 'phase', label: 'Phase' },
      { key: 'artifact_folder', label: 'Artifact Folder' },
      { key: 'others', label: 'Others' }
    ],
    stdTasks: [
      { key: 'role_acronym', label: 'Role' },
      { key: 'summary', label: 'Task Summary', full: true },
      { key: 'description', label: 'Task Desc', full: true },
      { key: 'phase', label: 'Phase', type: 'select', options: ['Management', 'Analysis', 'Design', 'CUT', 'System Testing', 'Support', 'General'] },
      { key: 'task_type', label: 'Task Type' },
      { key: 'start_rule', label: 'Start rule (milestone)', type: 'select', options: ['reqStart', 'reqEnd', 'designStart', 'designEnd', 'cutStart', 'cutEnd', 'sit1Start', 'sit1End', 'sit2Start', 'sit2End', 'patDelStart', 'patDelEnd', 'patSupStart', 'patSupEnd', 'uatStart', 'uatEnd'] },
      { key: 'end_rule', label: 'End rule (milestone)', type: 'select', options: ['reqStart', 'reqEnd', 'designStart', 'designEnd', 'cutStart', 'cutEnd', 'sit1Start', 'sit1End', 'sit2Start', 'sit2End', 'patDelStart', 'patDelEnd', 'patSupStart', 'patSupEnd', 'uatStart', 'uatEnd'] },
      { key: 'est_expr', label: 'Estimate rule (hours expression)', full: true },
      {
        key: 'fixed_share', label: 'Fixed estimate (not scaled by % contribution)',
        type: 'select', options: ['Yes', 'No'],
        fmt: (v) => (v === true || v === 'Yes' ? 'Yes' : 'No'),
        toInput: (v) => (v === true || v === 'Yes' ? 'Yes' : 'No')
      }
    ]
  },

  // ---------------- init / data ----------------
  async init() {
    this.initSettingsPopover();
    this.initVisualOptions();
    this.initSummaryPopup();
    this.initLayoutControls();

    const sel = document.getElementById('projectSelect');
    sel.onchange = async () => { this.projectId = Number(sel.value); await this.reload(); this.openGroup(this.activeGroup); };

    document.getElementById('btnNewProject').onclick = () => this.openNewProjectModal();
    document.getElementById('btnGenWbs').onclick = () => this.generateWbs();
    this.initLayoutSwitch();

    await this.loadProjects();
    await this.reload();
    this.buildNav();
    this.openGroup('app');
  },

  async loadProjects(selectProjectId) {
    const projects = await API.get('/projects');
    const sel = document.getElementById('projectSelect');
    sel.innerHTML = projects.map((p) => `<option value="${p.id}">${escHtml(p.project_key)}</option>`).join('');
    this.projectId = selectProjectId ? Number(selectProjectId) : (this.projectId || projects[0]?.id || null);
    if (this.projectId) sel.value = String(this.projectId);
  },

  // Burger menu (sidebar show/hide) + Accordion/Tabs layout switch, both persisted
  initLayoutControls() {
    const burger = document.getElementById('btnBurger');
    const layoutBtn = document.getElementById('btnLayout');

    // restore persisted preferences
    this.layoutMode = localStorage.getItem('kagLayout') === 'tabs' ? 'tabs' : 'accordion';
    if (localStorage.getItem('kagSidebar') === 'hidden') document.body.classList.add('sidebar-hidden');

    const syncLayoutBtn = () => {
      if (!layoutBtn) return;
      const toTabs = this.layoutMode === 'accordion';
      layoutBtn.innerHTML = toTabs ? '&#128450;' : '&#9776;&#65038;';
      layoutBtn.title = toTabs ? 'Switch to Tabbed layout' : 'Switch to Accordion layout';
      layoutBtn.setAttribute('aria-label', layoutBtn.title);
      layoutBtn.classList.toggle('mode-on', !toTabs);
    };
    syncLayoutBtn();

    if (layoutBtn) {
      layoutBtn.onclick = () => {
        this.layoutMode = this.layoutMode === 'accordion' ? 'tabs' : 'accordion';
        localStorage.setItem('kagLayout', this.layoutMode);
        syncLayoutBtn();
        this.openGroup(this.activeGroup, this.activeSection);
        this.toast(this.layoutMode === 'tabs' ? 'Tabbed layout' : 'Accordion layout');
      };
    }
    if (burger) {
      burger.onclick = () => {
        const hidden = document.body.classList.toggle('sidebar-hidden');
        localStorage.setItem('kagSidebar', hidden ? 'hidden' : 'shown');
      };
    }
  },

  // Header dropdown to jump straight to any of the other UI layouts
  initLayoutSwitch() {
    const sel = document.getElementById('layoutSelect');
    if (!sel) return;
    sel.value = '/';
    sel.onchange = () => { if (sel.value) location.href = sel.value; };
  },

  // Settings gear button toggles the Glass/3D/Depth/Color popover
  initSettingsPopover() {
    const btn = document.getElementById('btnSettings');
    const pop = document.getElementById('settingsPopover');
    if (!btn || !pop) return;
    const close = () => { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    btn.onclick = (e) => {
      e.stopPropagation();
      const summary = document.getElementById('summaryPopover');
      if (summary) summary.hidden = true;       // one popover at a time
      pop.hidden = !pop.hidden;
      btn.setAttribute('aria-expanded', String(!pop.hidden));
    };
    pop.onclick = (e) => e.stopPropagation();   // interacting inside keeps it open
    document.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  },

  initVisualOptions() {
    const glass = document.getElementById('optGlass');
    const depth3d = document.getElementById('opt3d');
    const depth = document.getElementById('optDepth');
    const color = document.getElementById('optColor');
    if (!glass || !depth3d || !depth || !color) return;

    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem('kagVisualOptions') || '{}');
    } catch {
      saved = {};
    }
    glass.checked = saved.glass !== false;
    depth3d.checked = saved.depth3d !== false;
    depth.value = saved.depth ?? 6;
    color.value = saved.color || 'ocean';

    const apply = () => {
      document.body.classList.toggle('fx-glass', glass.checked);
      document.body.classList.toggle('fx-3d', depth3d.checked);
      document.body.dataset.theme = color.value;
      document.documentElement.style.setProperty('--depth-scale', String(Number(depth.value) / 10));
      localStorage.setItem('kagVisualOptions', JSON.stringify({
        glass: glass.checked,
        depth3d: depth3d.checked,
        depth: depth.value,
        color: color.value
      }));
    };

    [glass, depth3d, depth, color].forEach((input) => input.addEventListener('input', apply));
    apply();
  },

  // Project Summary lives in the header: the chart icon button toggles a
  // popover panel (same pattern as the Settings popover).
  initSummaryPopup() {
    const btn = document.getElementById('btnSummary');
    const pop = document.getElementById('summaryPopover');
    if (!btn || !pop) return;
    const close = () => { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    btn.onclick = (e) => {
      e.stopPropagation();
      const settings = document.getElementById('settingsPopover');
      if (settings) settings.hidden = true;      // one popover at a time
      pop.hidden = !pop.hidden;
      btn.setAttribute('aria-expanded', String(!pop.hidden));
    };
    pop.onclick = (e) => e.stopPropagation();    // interacting inside keeps it open
    document.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  },

  openNewProjectModal() {
    const today = new Date().toISOString().slice(0, 10);
    const fields = [
      { key: 'project_key', label: 'Project Key' },
      { key: 'project_type', label: 'Project Type' },
      { key: 'fp_count', label: 'FP Count', type: 'number' },
      { key: 'productivity_factor', label: 'Productivity Factor', type: 'number' },
      { key: 'start_date', label: 'Start Date', type: 'date' },
      { key: 'technology', label: 'Technology' },
      { key: 'brief_desc', label: 'Brief Description', type: 'textarea', full: true },
      { key: 'scope', label: 'Scope', type: 'textarea', full: true }
    ];
    this.openFormModal('New Project', fields, {
      project_key: `NEW PROJECT ${Date.now().toString().slice(-5)}`,
      project_type: 'MQC',
      fp_count: 0,
      productivity_factor: 1,
      start_date: today,
      technology: ''
    }, async (vals) => {
      const project = await API.post('/projects', vals);
      this.projectId = Number(project.id);
      await this.loadProjects(project.id);
      document.getElementById('projectSelect').value = String(project.id);
      await this.reload();
      this.buildNav();
      this.openGroup('proj', 'projSummary');
      this.toast(`Project created: ${project.project_key}`);
    });
  },

  async reload() {
    const pid = this.projectId;
    const [application, project, computed, resources, hrplan, phases, milestones,
      hardware, software, lists, docs, goals, training, process, environments, dar,
      agenda, modules, stdRoles, stdTools, matrix, folders, taskTemplates, wbs] = await Promise.all([
      API.get('/application'), API.get(`/projects/${pid}`), API.get(`/projects/${pid}/computed`),
      API.get('/resources'), API.get(`/projects/${pid}/hrplan`), API.get(`/projects/${pid}/phases`),
      API.get(`/projects/${pid}/milestones`), API.get(`/projects/${pid}/hardware`),
      API.get(`/projects/${pid}/software`), API.get(`/projects/${pid}/lists`),
      API.get(`/projects/${pid}/docs`), API.get(`/projects/${pid}/goals`),
      API.get(`/projects/${pid}/training`), API.get(`/projects/${pid}/process`),
      API.get(`/projects/${pid}/environments`), API.get(`/projects/${pid}/dar`),
      API.get(`/projects/${pid}/agenda`), API.get(`/projects/${pid}/modules`),
      API.get('/standards/roles'), API.get('/standards/tools'),
      API.get('/standards/stakeholder-matrix'), API.get('/standards/folder-structure'),
      API.get('/standards/task-templates'), API.get(`/projects/${pid}/wbs`)
    ]);
    this.data = { application, project, computed, resources, hrplan, phases, milestones,
      hardware, software, lists, docs, goals, training, process, environments, dar,
      agenda, modules, stdRoles, stdTools, matrix, folders, taskTemplates, wbs };
    this.renderSummary();
    this.updateNavCompletion();
  },

  renderSummary() {
    const c = this.data.computed;
    const p = this.data.project;
    const milestones = c.milestones || [];
    const completedDeliverables = (this.data.milestones || []).filter((m) => m.deliverable).length;
    const milestonePct = milestones.length ? Math.round((completedDeliverables / milestones.length) * 100) : 0;
    const phasePct = (this.data.phases || []).reduce((s, phase) => s + Number(phase.pct || 0), 0);
    const resourceLoad = (this.data.hrplan || []).reduce((s, row) => s + Number(row.contribution_pct || 0), 0);
    const headKey = document.getElementById('summaryHeadKey');
    if (headKey) headKey.textContent = p.project_key || '';
    const oc = this.overallCompletion();
    const ocCls = oc.pct >= 100 ? 'p100' : oc.pct >= 50 ? 'p50' : oc.pct > 0 ? 'plow' : 'p0';
    const summaryBody = document.getElementById('summaryBody');
    summaryBody.innerHTML = `
      <div class="summary-hero">
        <span class="summary-key">${escHtml(p.project_key)}</span>
        <span class="summary-type">${escHtml(p.project_type || 'Project')}</span>
      </div>
      <div class="overall-comp ${ocCls}" title="${oc.filled} of ${oc.total} fields filled across all sections">
        <div class="progress-row"><span>&#9989; Overall completion</span><b>${oc.pct}%</b></div>
        <div class="progress-track big"><span style="width:${Math.min(oc.pct, 100)}%"></span></div>
        <small>${oc.filled} of ${oc.total} fields filled across ${oc.items.length} sections</small>
      </div>
      <details class="comp-details">
        <summary>Section-wise completion details</summary>
        <div class="comp-list">
          ${oc.items.map((it) => `
            <div class="sec-comp-row" data-group="${it.group}" data-sec="${it.sec}"
                 title="${it.filled} of ${it.total} filled — click to open">
              <span class="scr-name">${escHtml(it.title)}</span>
              <span class="scr-bar"><i class="${it.pct >= 100 ? 'g' : it.pct >= 50 ? 'b' : it.pct > 0 ? 'a' : ''}"
                    style="width:${Math.min(it.pct, 100)}%"></i></span>
              <b>${it.pct}%</b>
            </div>`).join('')}
        </div>
      </details>
      <div class="summary-widgets">
        ${this.summaryWidget('Effort', c.totalEffMd, 'MD', 'calc')}
        ${this.summaryWidget('Hours', c.totalEffHr, 'Hr', 'time')}
        ${this.summaryWidget('Team FTE', c.totalFte, 'FTE', 'people')}
        ${this.summaryWidget('WBS', this.data.wbs.length, 'tasks', 'tasks')}
      </div>
      <div class="summary-progress">
        <div class="progress-row"><span>Phase allocation</span><b>${escHtml(phasePct)}%</b></div>
        <div class="progress-track"><span style="width:${Math.min(phasePct, 100)}%"></span></div>
        <div class="progress-row"><span>Milestone deliverables</span><b>${escHtml(milestonePct)}%</b></div>
        <div class="progress-track"><span style="width:${Math.min(milestonePct, 100)}%"></span></div>
      </div>
      <div class="summary-facts">
        ${this.summaryFact('Start', fmtDate(p.start_date))}
        ${this.summaryFact('End', fmtDate(c.endDate))}
        ${this.summaryFact('Kick-Off', fmtDate(c.kickOffDate))}
        ${this.summaryFact('Proposed PAT', fmtDate(c.proposedPatDate))}
        ${this.summaryFact('Avg Resource/day', c.avgResPerDay)}
        ${this.summaryFact('Resource load', `${resourceLoad}%`)}
      </div>`;
    // clicking a section row jumps straight to that section
    summaryBody.querySelectorAll('.sec-comp-row').forEach((row) => {
      row.onclick = () => this.openGroup(row.dataset.group, row.dataset.sec);
    });
  },

  // aggregate completion across every editable section (see sectionCompletion)
  overallCompletion() {
    const items = [];
    let filled = 0, total = 0;
    this.groups.forEach((g) => {
      if (g.id === 'art') return;
      g.sections.forEach((sec) => {
        const c = this.sectionCompletion(sec);
        if (!c) return;
        items.push({ group: g.id, sec, title: this.sectionTitles[sec], ...c });
        filled += c.filled;
        total += c.total;
      });
    });
    // least-complete sections first, so users see what needs attention
    items.sort((a, b) => a.pct - b.pct);
    return { pct: total ? Math.round((filled / total) * 100) : 0, filled, total, items };
  },

  summaryWidget(label, value, unit, tone) {
    return `<div class="dash-widget ${tone}">
      <span>${escHtml(label)}</span>
      <strong>${escHtml(value ?? '')}</strong>
      <small>${escHtml(unit)}</small>
    </div>`;
  },

  summaryFact(label, value) {
    return `<div class="srow"><span>${escHtml(label)}</span><b>${escHtml(value ?? '')}</b></div>`;
  },

  // ---------------- navigation (left column accordion) ----------------
  groups: [
    { id: 'app', title: 'Application Data', icon: '&#128187;', sections: ['appDetails', 'hardware', 'software', 'environments', 'dar'] },
    { id: 'proj', title: 'Project Data', icon: '&#128200;', sections: ['projSummary', 'phases', 'milestones', 'hrplan', 'constraints', 'dependencies', 'assumptions', 'risks', 'training', 'docs', 'goals', 'process', 'modules', 'agenda'] },
    { id: 'res', title: 'Resource Data', icon: '&#128101;', sections: ['resources'] },
    { id: 'std', title: 'Standards Data', icon: '&#128218;', sections: ['stdRoles', 'stdTools', 'stdMatrix', 'stdFolders', 'stdTasks'] },
    { id: 'art', title: 'Artifacts', icon: '&#128196;', sections: ['artifacts'] }
  ],

  sectionTitles: {
    appDetails: 'Application Details', hardware: 'Hardware Requirements', software: 'Software Requirements',
    environments: 'Development Environments', dar: 'Decision Analysis & Resolution',
    projSummary: 'Project Summary', phases: 'Estimated Effort by Phase', milestones: 'Milestone Dates',
    hrplan: 'HR Plan (Role-Wise)', constraints: 'Constraints', dependencies: 'Dependencies',
    assumptions: 'Assumptions', risks: 'Risks', training: 'Training Plan',
    docs: 'Items Handed Over', goals: 'Project Goals (Metrics)', process: 'Process Planning',
    modules: 'Module Details', agenda: 'Kick-Off Agenda', resources: 'Resources',
    stdRoles: 'Roles & Responsibilities', stdTools: 'Tools & Techniques',
    stdMatrix: 'Stakeholder Matrix', stdFolders: 'Folder Structure', stdTasks: 'WBS Task Templates',
    artifacts: 'Generated Artifacts'
  },

  sectionDescriptions: {
    appDetails: 'Core application identity, scope, links and lifecycle references.',
    hardware: 'Infrastructure needs with quantities, dates and configuration notes.',
    software: 'Installations, versions and planned availability windows.',
    environments: 'Server paths and access points used by the delivery team.',
    dar: 'Formal evaluation candidates, participants and decision remarks.',
    projSummary: 'Project sizing, schedule inputs, ownership and planning notes.',
    phases: 'Effort split by phase with calculated MD and hour totals.',
    milestones: 'Formula-driven schedule dates with editable deliverables.',
    hrplan: 'Role-wise staffing, contribution percentages and date ranges.',
    constraints: 'Known limits that shape project execution.',
    dependencies: 'External inputs and handoffs required by the plan.',
    assumptions: 'Planning assumptions used across generated artifacts.',
    risks: 'Risk statements carried into the initiation material.',
    training: 'Training needs, attendees and planned delivery dates.',
    docs: 'Inputs and items handed over to the team.',
    goals: 'Metrics, targets and collection commitments.',
    process: 'Process applicability and tailoring decisions.',
    modules: 'Module ownership and staffing details.',
    agenda: 'Kick-off meeting sequence and topics.',
    resources: 'Reference roster for project resources and roles.',
    stdRoles: 'Standard responsibilities used by generated artifacts.',
    stdTools: 'Organization-level tools, templates and standards.',
    stdMatrix: 'Stakeholder responsibility mapping by activity.',
    stdFolders: 'Standard folder plan for project storage.',
    stdTasks: 'Task templates used when generating the JIRA WBS.',
    artifacts: 'Preview and download the generated project outputs.'
  },

  buildNav() {
    const nav = document.getElementById('navAccordion');
    nav.innerHTML = this.groups.map((g) => `
      <div class="nav-group" id="navg-${g.id}">
        <div class="nav-head" data-group="${g.id}">
          <span>${g.icon}&nbsp; ${escHtml(g.title)}</span>
          <span class="nav-head-meta">
            <span class="nav-pct" data-pct-group="${g.id}"></span>
            <span class="chev">&#9656;</span>
          </span>
        </div>
        <div class="nav-items">
          ${g.sections.map((s) => `<a data-section="${s}" data-group="${g.id}">
            <span class="nav-item-name">${escHtml(this.sectionTitles[s])}</span>
            <span class="nav-pct" data-pct-sec="${s}"></span>
          </a>`).join('')}
        </div>
      </div>`).join('');
    nav.querySelectorAll('.nav-head').forEach((el) => {
      el.onclick = () => this.openGroup(el.dataset.group);
    });
    nav.querySelectorAll('.nav-items a').forEach((a) => {
      a.onclick = () => { this.openGroup(a.dataset.group, a.dataset.section); };
    });
    this.updateNavCompletion();
  },

  // refresh the % chips on the sidebar accordion (group headers + section links)
  updateNavCompletion() {
    const cls = (pct) => pct >= 100 ? 'ng' : pct >= 50 ? 'nb' : pct > 0 ? 'na' : 'n0';
    this.groups.forEach((g) => {
      if (g.id === 'art') return;
      let filled = 0, total = 0;
      g.sections.forEach((sec) => {
        const c = this.sectionCompletion(sec);
        const chip = document.querySelector(`.nav-pct[data-pct-sec="${sec}"]`);
        if (c && chip) {
          chip.textContent = `${c.pct}%`;
          chip.className = `nav-pct ${cls(c.pct)}`;
          chip.title = `${c.filled} of ${c.total} fields filled`;
          filled += c.filled; total += c.total;
        }
      });
      const gp = total ? Math.round((filled / total) * 100) : 0;
      const gchip = document.querySelector(`.nav-pct[data-pct-group="${g.id}"]`);
      if (gchip) {
        gchip.textContent = `${gp}%`;
        gchip.className = `nav-pct group ${cls(gp)}`;
        gchip.title = `${filled} of ${total} fields filled in ${g.title}`;
      }
    });
  },

  openGroup(groupId, focusSection) {
    this.activeGroup = groupId;
    const group = this.groups.find((g) => g.id === groupId);
    document.querySelectorAll('.nav-group').forEach((el) =>
      el.classList.toggle('open', el.id === `navg-${groupId}`));
    document.getElementById('contentTitle').textContent = group.title;
    document.getElementById('contentHint').textContent =
      groupId === 'art' ? 'Click a card to preview & download'
        : this.layoutMode === 'tabs' ? 'Click a tab to switch section' : 'Click a section to expand';
    this.renderGroup(group, focusSection);
    const activeSec = this.activeSection || focusSection || group.sections[0];
    document.querySelectorAll('.nav-items a').forEach((a) =>
      a.classList.toggle('active', a.dataset.section === activeSec));
  },

  // resolve which section should be focused inside a group
  resolveSection(group, focusSection) {
    if (focusSection && group.sections.includes(focusSection)) return focusSection;
    if (this.activeSection && group.sections.includes(this.activeSection)) return this.activeSection;
    return group.sections[0];
  },

  // ---------------- content (right column: accordions OR tabs) ----------------
  renderGroup(group, focusSection) {
    const body = document.getElementById('contentBody');
    body.innerHTML = '';
    if (group.id === 'art') { this.renderArtifactCards(body); return; }
    if (this.layoutMode === 'tabs') { this.renderGroupTabs(group, focusSection, body); return; }
    const openId = this.resolveSection(group, focusSection);
    this.activeSection = openId;
    group.sections.forEach((sec) => {
      const item = document.createElement('div');
      item.className = 'acc-item' + (sec === openId ? ' open' : '');
      item.id = `acc-${sec}`;
      const count = this.sectionCount(sec);
      const access = this.sectionAccess(sec);
      item.innerHTML = `
        <div class="acc-head">
          <div class="acc-title">
            <span class="acc-icon">${this.sectionIcon(sec)}</span>
            <span>
              <h4>${escHtml(this.sectionTitles[sec])}</h4>
              <small>${escHtml(this.sectionDescriptions[sec] || '')}</small>
            </span>
          </div>
          <div class="acc-meta">
            ${this.completionBadge(sec)}
            ${access.map((a) => `<span class="field-pill ${a.kind}">${escHtml(a.text)}</span>`).join('')}
            ${count !== null ? `<span class="badge">${count} ${count === 1 ? 'row' : 'rows'}</span>` : '<span class="badge muted">form</span>'}
            <span class="chev">&#9656;</span>
          </div>
        </div>
        <div class="acc-body"></div>`;
      item.querySelector('.acc-head').onclick = () => {
        const wasOpen = item.classList.contains('open');
        body.querySelectorAll('.acc-item').forEach((i) => i.classList.remove('open'));
        if (!wasOpen) { item.classList.add('open'); this.activeSection = sec; }
        document.querySelectorAll('.nav-items a').forEach((a) =>
          a.classList.toggle('active', a.dataset.section === sec && !wasOpen));
      };
      body.appendChild(item);
      this.renderSection(sec, item.querySelector('.acc-body'));
    });
    const focus = document.getElementById(`acc-${openId}`);
    if (focus) focus.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  // Tabbed layout: one tab per section, single content panel below
  renderGroupTabs(group, focusSection, body) {
    const active = this.resolveSection(group, focusSection);
    this.activeSection = active;

    const tabbar = document.createElement('div');
    tabbar.className = 'tabbar';
    const panel = document.createElement('div');
    panel.className = 'tab-panel';

    const showSection = (sec) => {
      this.activeSection = sec;
      tabbar.querySelectorAll('.tab').forEach((t) =>
        t.classList.toggle('active', t.dataset.section === sec));
      document.querySelectorAll('.nav-items a').forEach((a) =>
        a.classList.toggle('active', a.dataset.section === sec));
      panel.innerHTML = '';
      const head = document.createElement('div');
      head.className = 'tab-panel-head';
      const access = this.sectionAccess(sec);
      head.innerHTML = `
        <span class="tp-desc">${escHtml(this.sectionDescriptions[sec] || '')}</span>
        <span class="tp-meta">${access.map((a) => `<span class="field-pill ${a.kind}">${escHtml(a.text)}</span>`).join('')}</span>`;
      panel.appendChild(head);
      const content = document.createElement('div');
      panel.appendChild(content);
      this.renderSection(sec, content);
    };

    group.sections.forEach((sec) => {
      const tab = document.createElement('button');
      tab.className = 'tab' + (sec === active ? ' active' : '');
      tab.dataset.section = sec;
      tab.innerHTML = `<span class="tab-icon">${this.sectionIcon(sec)}</span>
        <span>${escHtml(this.sectionTitles[sec])}</span>
        ${this.completionBadge(sec)}`;
      tab.onclick = () => showSection(sec);
      tabbar.appendChild(tab);
    });

    body.appendChild(tabbar);
    body.appendChild(panel);
    showSection(active);
  },

  // ---- % Complete per section (filled fields vs total fields) ----
  // A value counts as filled unless empty or a placeholder like <None> / <Mention ...>
  isFilled(v) {
    if (v === null || v === undefined) return false;
    const s = String(v).trim();
    if (s === '') return false;
    if (/^<.*>$/.test(s)) return false;
    return true;
  },

  completionObj(obj, fields) {
    const keys = fields.filter((f) => f.key !== 'sno' && f.key !== 'seq');
    const filled = keys.filter((f) => this.isFilled(obj?.[f.key])).length;
    return { filled, total: keys.length };
  },

  completionRows(rows, fields) {
    const keys = fields.filter((f) => f.key !== 'sno' && f.key !== 'seq');
    let filled = 0;
    (rows || []).forEach((r) => { keys.forEach((f) => { if (this.isFilled(r[f.key])) filled += 1; }); });
    return { filled, total: (rows || []).length * keys.length };
  },

  sectionCompletion(sec) {
    const d = this.data;
    const listKinds = { constraints: 'constraint', dependencies: 'dependency', assumptions: 'assumption', risks: 'risk' };
    let c = null;
    if (sec === 'appDetails') c = this.completionObj(d.application, this.fields.application);
    else if (sec === 'projSummary') c = this.completionObj(d.project, this.fields.project);
    else if (sec === 'phases') c = this.completionRows(d.phases, [{ key: 'pct' }]);
    else if (sec === 'milestones') c = this.completionRows(d.milestones, [{ key: 'deliverable' }]);
    else if (sec in listKinds) c = this.completionRows(d.lists.filter((l) => l.kind === listKinds[sec]), this.fields.listItem);
    else if (sec === 'resources') c = this.completionRows(d.resources, this.fields.resources);
    else if (sec === 'stdRoles') c = this.completionRows(d.stdRoles, this.fields.stdRoles);
    else if (sec === 'stdTools') c = this.completionRows(d.stdTools, this.fields.stdTools);
    else if (sec === 'stdMatrix') c = this.completionRows(d.matrix, this.fields.stdMatrix);
    else if (sec === 'stdFolders') c = this.completionRows(d.folders, this.fields.stdFolders);
    else if (sec === 'stdTasks') c = this.completionRows(d.taskTemplates, this.fields.stdTasks.filter((f) => f.key !== 'fixed_share'));
    else if (this.fields[sec]) c = this.completionRows(d[sec], this.fields[sec]);
    if (!c) return null;
    const pct = c.total ? Math.round((c.filled / c.total) * 100) : 0;
    return { ...c, pct };
  },

  completionBadge(sec) {
    const c = this.sectionCompletion(sec);
    if (!c) return '';
    const cls = c.pct >= 100 ? 'p100' : c.pct >= 50 ? 'p50' : c.pct > 0 ? 'plow' : 'p0';
    const title = c.total
      ? `${c.filled} of ${c.total} fields filled — ${c.pct}% complete`
      : 'No rows yet — 0% complete';
    return `<span class="pct-badge ${cls}" title="${escHtml(title)}"><i style="width:${Math.min(c.pct, 100)}%"></i><b>${c.pct}%</b></span>`;
  },

  sectionAccess(sec) {
    const readonly = ['artifacts'];
    const standards = ['stdRoles', 'stdTools', 'stdMatrix', 'stdFolders', 'stdTasks'];
    if (readonly.includes(sec)) return [{ kind: 'readonly', text: 'Read-only' }];
    if (standards.includes(sec)) return [{ kind: 'editable', text: 'Standards editable' }];
    if (sec === 'phases') return [{ kind: 'editable', text: 'Editable %' }, { kind: 'calculated', text: 'Calculated MD/Hr' }];
    if (sec === 'milestones') return [{ kind: 'editable', text: 'Editable deliverable' }, { kind: 'calculated', text: 'Calculated dates' }];
    if (sec === 'appDetails') return [{ kind: 'editable', text: 'Shared editable' }];
    if (sec === 'resources') return [{ kind: 'editable', text: 'Reference editable' }];
    return [{ kind: 'editable', text: 'Editable' }];
  },

  sectionIcon(sec) {
    const icons = {
      appDetails: '&#9638;', hardware: '&#128421;', software: '&#128187;', environments: '&#128736;', dar: '&#9878;',
      projSummary: '&#128202;', phases: '&#128200;', milestones: '&#128197;', hrplan: '&#128101;',
      constraints: '&#9940;', dependencies: '&#128279;', assumptions: '&#128161;', risks: '&#9888;',
      training: '&#127891;', docs: '&#128196;', goals: '&#127919;', process: '&#128209;',
      modules: '&#128230;', agenda: '&#128203;', resources: '&#128100;', stdRoles: '&#128188;',
      stdTools: '&#128295;', stdMatrix: '&#9636;', stdFolders: '&#128193;', stdTasks: '&#9989;'
    };
    return icons[sec] || '&#9638;';
  },

  sectionCount(sec) {
    const d = this.data;
    const map = {
      hardware: d.hardware, software: d.software, environments: d.environments, dar: d.dar,
      phases: d.phases, milestones: d.computed.milestones, hrplan: d.hrplan,
      constraints: d.lists.filter((l) => l.kind === 'constraint'),
      dependencies: d.lists.filter((l) => l.kind === 'dependency'),
      assumptions: d.lists.filter((l) => l.kind === 'assumption'),
      risks: d.lists.filter((l) => l.kind === 'risk'),
      training: d.training, docs: d.docs, goals: d.goals, process: d.process,
      modules: d.modules, agenda: d.agenda, resources: d.resources,
      stdRoles: d.stdRoles, stdTools: d.stdTools, stdMatrix: d.matrix,
      stdFolders: d.folders, stdTasks: d.taskTemplates
    };
    return map[sec] ? map[sec].length : null;
  },

  renderSection(sec, host) {
    this.renderFieldLegend(host, sec);
    const d = this.data;
    const listKinds = { constraints: 'constraint', dependencies: 'dependency', assumptions: 'assumption', risks: 'risk' };
    if (sec === 'appDetails') return this.renderObjectForm(host, d.application, this.fields.application, () => API.put(`/application/${d.application.id}`, d.application));
    if (sec === 'projSummary') return this.renderObjectForm(host, d.project, this.fields.project, () => API.put(`/projects/${this.projectId}`, d.project));
    if (sec === 'phases') return this.renderPhases(host);
    if (sec === 'milestones') return this.renderMilestones(host);
    if (sec in listKinds) return this.renderCrudTable(host, {
      rows: d.lists.filter((l) => l.kind === listKinds[sec]),
      fields: this.fields.listItem, coll: 'lists',
      extraOnCreate: { kind: listKinds[sec] }
    });
    if (sec === 'resources') return this.renderCrudTable(host, {
      rows: d.resources, fields: this.fields.resources,
      basePath: '/resources'
    });
    if (sec === 'stdRoles') return this.renderCrudTable(host, { rows: d.stdRoles, fields: this.fields.stdRoles, basePath: '/standards/roles' });
    if (sec === 'stdTools') return this.renderCrudTable(host, { rows: d.stdTools, fields: this.fields.stdTools, basePath: '/standards/tools' });
    if (sec === 'stdMatrix') return this.renderCrudTable(host, { rows: d.matrix, fields: this.fields.stdMatrix, basePath: '/standards/stakeholder-matrix' });
    if (sec === 'stdFolders') return this.renderCrudTable(host, { rows: d.folders, fields: this.fields.stdFolders, basePath: '/standards/folder-structure' });
    if (sec === 'stdTasks') return this.renderCrudTable(host, { rows: d.taskTemplates, fields: this.fields.stdTasks, basePath: '/standards/task-templates' });
    // plain project collections
    if (this.fields[sec]) return this.renderCrudTable(host, { rows: d[sec], fields: this.fields[sec], coll: sec });
  },

  renderFieldLegend(host, sec) {
    const access = this.sectionAccess(sec);
    const legend = document.createElement('div');
    legend.className = 'field-legend';
    legend.innerHTML = access.map((a) => `<span class="field-pill ${a.kind}">${escHtml(a.text)}</span>`).join('');
    host.appendChild(legend);
  },

  // object form (application / project)
  renderObjectForm(host, obj, fields, saver) {
    const form = document.createElement('div');
    form.className = 'form-grid';
    fields.forEach((f) => {
      const label = document.createElement('label');
      label.className = 'editable-field' + ((f.full || f.type === 'textarea') ? ' full' : '');
      label.innerHTML = `<span>${escHtml(f.label)}</span>`;
      const input = f.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
      if (f.type === 'textarea') input.rows = 3;
      else input.type = f.type || 'text';
      input.value = f.type === 'date' ? isoDate(obj[f.key]) : (obj[f.key] ?? '');
      input.onchange = () => { obj[f.key] = input.value; };
      label.appendChild(input);
      form.appendChild(label);
    });
    const actions = document.createElement('div');
    actions.className = 'form-actions';
    const btn = document.createElement('button');
    btn.className = 'btn btn-accent';
    btn.textContent = 'Save changes';
    btn.onclick = async () => {
      try {
        await saver();
        await this.reload();
        this.toast('Saved — computed values recalculated');
        this.openGroup(this.activeGroup);
      } catch (e) { this.toast('Save failed: ' + e.message, true); }
    };
    actions.appendChild(btn);
    host.appendChild(form);
    host.appendChild(actions);
  },

  // generic CRUD table with edit/delete popups
  renderCrudTable(host, cfg) {
    const { rows, fields, coll, basePath, extraOnCreate } = cfg;
    const base = basePath || `/projects/${this.projectId}/${coll}`;
    const bar = document.createElement('div');
    bar.className = 'section-toolbar';
    const addBtn = document.createElement('button');
    addBtn.className = 'act-btn add';
    addBtn.innerHTML = '&#65291;';
    addBtn.title = 'Add row';
    addBtn.setAttribute('aria-label', 'Add row');
    addBtn.onclick = () => this.openFormModal('Add row', fields, { sno: rows.length + 1, ...(extraOnCreate || {}) }, async (vals) => {
      await API.post(base, { ...(extraOnCreate || {}), ...vals });
      await this.reload(); this.openGroup(this.activeGroup);
      this.toast('Row added');
    });
    bar.appendChild(addBtn);
    host.appendChild(bar);

    const wrap = document.createElement('div');
    wrap.className = 'tbl-wrap';
    const tbl = document.createElement('table');
    tbl.className = 'tbl editable-table';
    tbl.innerHTML = `<tr>${fields.map((f) => `<th>${escHtml(f.label)}</th>`).join('')}<th></th></tr>`;
    rows.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = fields.map((f) => {
        let v = row[f.key];
        if (f.type === 'date') v = fmtDate(v);
        if (f.fmt) v = f.fmt(row[f.key]);
        return `<td class="editable-cell${f.type === 'number' ? ' num' : ''}">${escHtml(v ?? '')}</td>`;
      }).join('');
      const act = document.createElement('td');
      act.className = 'row-actions';
      const edit = document.createElement('button');
      edit.className = 'act-btn';
      edit.innerHTML = '&#9998;';
      edit.title = 'Edit row';
      edit.setAttribute('aria-label', 'Edit row');
      edit.onclick = () => this.openFormModal('Edit row', fields, row, async (vals) => {
        await API.put(`${base}/${row.id}`, { ...row, ...vals });
        await this.reload(); this.openGroup(this.activeGroup);
        this.toast('Row updated');
      });
      const del = document.createElement('button');
      del.className = 'act-btn danger';
      del.innerHTML = '&#128465;';
      del.title = 'Delete row';
      del.setAttribute('aria-label', 'Delete row');
      del.onclick = () => this.confirm('Delete this row?', async () => {
        await API.del(`${base}/${row.id}`);
        await this.reload(); this.openGroup(this.activeGroup);
        this.toast('Row deleted');
      });
      act.append(edit, del);
      tr.appendChild(act);
      tbl.appendChild(tr);
    });
    wrap.appendChild(tbl);
    host.appendChild(wrap);
  },

  renderReadTable(host, rows, cols) {
    const wrap = document.createElement('div');
    wrap.className = 'tbl-wrap';
    const tbl = document.createElement('table');
    tbl.className = 'tbl readonly-table';
    tbl.innerHTML = `<tr>${cols.map(([, l]) => `<th>${escHtml(l)}</th>`).join('')}</tr>` +
      rows.map((r) => `<tr>${cols.map(([k]) => `<td class="readonly-cell">${escHtml(r[k] === true ? 'Yes' : (r[k] ?? ''))}</td>`).join('')}</tr>`).join('');
    wrap.appendChild(tbl);
    host.appendChild(wrap);
  },

  renderPhases(host) {
    const { phases, computed } = this.data;
    const wrap = document.createElement('div');
    wrap.className = 'tbl-wrap';
    const tbl = document.createElement('table');
    tbl.className = 'tbl mixed-table';
    tbl.innerHTML = '<tr><th>Phase</th><th>%</th><th>MD (calc)</th><th>Hr (calc)</th><th></th></tr>';
    phases.forEach((p) => {
      const c = computed.phases.find((x) => x.phase === p.phase) || {};
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="readonly-cell">${escHtml(p.phase)}</td><td class="num editable-cell">${p.pct}%</td>
        <td class="num calc">${c.md ?? ''}</td><td class="num calc">${c.hr ?? ''}</td>`;
      const act = document.createElement('td');
      act.className = 'row-actions';
      const edit = document.createElement('button');
      edit.className = 'act-btn';
      edit.innerHTML = '&#9998;';
      edit.title = `Edit % — ${p.phase}`;
      edit.setAttribute('aria-label', `Edit percent for ${p.phase}`);
      edit.onclick = () => this.openFormModal(`Edit — ${p.phase}`, [{ key: 'pct', label: 'Percent of total effort', type: 'number' }], p, async (vals) => {
        await API.put(`/projects/${this.projectId}/phases/${p.id}`, { ...p, ...vals });
        await this.reload(); this.openGroup('proj', 'phases');
        this.toast('Phase effort updated');
      });
      act.appendChild(edit);
      tr.appendChild(act);
      tbl.appendChild(tr);
    });
    const totalPct = phases.reduce((s, p) => s + Number(p.pct || 0), 0);
    tbl.innerHTML += `<tr><td><b>Total</b></td><td class="num calc">${totalPct}%</td>
      <td class="num calc">${computed.totalEffMd}</td><td class="num calc">${computed.totalEffHr}</td><td></td></tr>`;
    wrap.appendChild(tbl);
    host.appendChild(wrap);
  },

  renderMilestones(host) {
    const { computed, milestones } = this.data;
    const note = document.createElement('p');
    note.style.cssText = 'color:var(--muted);font-size:12.5px;margin:6px 0';
    note.textContent = 'Dates are chained automatically from the project start date and phase efforts (Data Sheet formulas). Deliverables are editable.';
    host.appendChild(note);
    const wrap = document.createElement('div');
    wrap.className = 'tbl-wrap';
    const tbl = document.createElement('table');
    tbl.className = 'tbl mixed-table';
    tbl.innerHTML = '<tr><th>#</th><th>Milestone</th><th>Start</th><th>End</th><th>Deliverable</th><th></th></tr>';
    computed.milestones.forEach((m, i) => {
      const stored = milestones.find((x) => (x.name || '').trim() === m.name);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="readonly-cell">${i + 1}</td><td class="readonly-cell">${escHtml(m.name)}</td>
        <td class="calc">${fmtDate(m.start)}</td><td class="calc">${fmtDate(m.end)}</td>
        <td class="editable-cell">${escHtml(stored?.deliverable ?? '')}</td>`;
      const act = document.createElement('td');
      act.className = 'row-actions';
      if (stored) {
        const edit = document.createElement('button');
        edit.className = 'act-btn';
        edit.innerHTML = '&#9998;';
        edit.title = `Edit deliverable — ${m.name}`;
        edit.setAttribute('aria-label', `Edit deliverable for ${m.name}`);
        edit.onclick = () => this.openFormModal(`Deliverable — ${m.name}`, [{ key: 'deliverable', label: 'Deliverable' }], stored, async (vals) => {
          await API.put(`/projects/${this.projectId}/milestones/${stored.id}`, { ...stored, ...vals });
          await this.reload(); this.openGroup('proj', 'milestones');
          this.toast('Deliverable updated');
        });
        act.appendChild(edit);
      }
      tr.appendChild(act);
      tbl.appendChild(tr);
    });
    wrap.appendChild(tbl);
    host.appendChild(wrap);
  },

  // ---------------- artifacts ----------------
  artifactMeta: [
    { name: 'Kick-Off', icon: '&#127908;', desc: 'Kick-off presentation' },
    { name: 'AIN', icon: '&#128203;', desc: 'Application Initiation Note' },
    { name: 'AIN-Project', icon: '&#128196;', desc: 'Project Initiation Note' },
    { name: 'IPP-Application Information', icon: '&#128295;', desc: 'IPP — Application plan' },
    { name: 'IPP-Scope Management', icon: '&#127919;', desc: 'IPP — Scope, phases, HR plan' },
    { name: 'IPP-Stakeholder plan', icon: '&#129309;', desc: 'IPP — Stakeholder matrix' },
    { name: 'IPP-Configuration Mgmt.', icon: '&#128736;', desc: 'IPP — Configuration management' },
    { name: 'IPP-Process Planning', icon: '&#128209;', desc: 'IPP — Process applicability' },
    { name: 'WBS For JIRA', icon: '&#128202;', desc: 'Generated WBS (JIRA upload)' },
    { name: 'Folder Structure', icon: '&#128193;', desc: 'Standard folder tree' }
  ],

  renderArtifactCards(body) {
    const grid = document.createElement('div');
    grid.className = 'artifact-grid';
    this.artifactMeta.forEach((a) => {
      const displayName = a.name === 'AIN-Project' ? `AIN-${this.data.project.project_key}` : a.name;
      const card = document.createElement('div');
      card.className = 'artifact-card';
      card.innerHTML = `<div class="icon">${a.icon}</div><h4>${escHtml(displayName)}</h4><p>${escHtml(a.desc)}</p>`;
      card.onclick = () => this.openArtifact(a.name, displayName);
      grid.appendChild(card);
    });
    body.appendChild(grid);
  },

  openArtifact(name, displayName) {
    const sheet = App.sheets.find((s) => s.name === name);
    if (!sheet) return;
    const { modal, bodyEl, footEl } = this.openModal(displayName, true);
    const hostDiv = document.createElement('div');
    hostDiv.className = 'artifact-host';
    bodyEl.appendChild(hostDiv);
    sheet.render(hostDiv, this.data, App);

    // download icon buttons - one per export format (caption shows on mouse-over)
    const exportUrl = (fmt) =>
      `/api/projects/${this.projectId}/export/${encodeURIComponent(name)}${fmt ? `?format=${fmt}` : ''}`;
    const addDl = (icon, caption, fmt) => {
      const b = document.createElement('button');
      b.className = 'act-btn dl';
      b.innerHTML = icon;
      b.title = caption;
      b.setAttribute('aria-label', caption);
      b.onclick = () => { location.href = exportUrl(fmt); };
      footEl.appendChild(b);
    };
    addDl('&#128213;', 'Download PDF', 'pdf');
    addDl('&#127760;', 'Download HTML', 'html');
    addDl('&#128216;', 'Download Doc (Word)', 'doc');
    addDl('&#128215;', 'Download Excel (.xls)', '');
    if (name === 'WBS For JIRA') addDl('&#128196;', 'Download CSV', 'csv');
  },

  // GenWBS2 equivalent (same confirmation flow as the macro)
  async generateWbs() {
    const run = async () => {
      const r = await API.post(`/projects/${this.projectId}/wbs/generate`);
      await this.reload();
      this.toast(`WBS generated for ${this.data.project.project_key} — ${r.generated} tasks`);
      if (this.activeGroup === 'art') this.openGroup('art');
    };
    if (this.data.wbs.length) {
      this.confirm('Are you sure you want to Re-Generate WBS?', run);
    } else {
      await run();
    }
  },

  // ---------------- Timesheet (generate + CRUD) ----------------
  tsFields: [
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'assignee', label: 'Assignee (IPN)' },
    { key: 'summary', label: 'Task Summary', full: true },
    { key: 'phase', label: 'Phase' },
    { key: 'task_type', label: 'Task Type' },
    { key: 'hours', label: 'Hours', type: 'number' }
  ],

  // Generate Timesheet: persists day-wise entries per WBS task, then opens
  // the editable popup with download options.
  async generateTimesheet() {
    if (!this.data.wbs.length) {
      this.toast('Generate the WBS first — the timesheet is built from WBS tasks', true);
      return;
    }
    const run = async () => {
      this.toast('Generating timesheet…');
      const r = await API.post(`/projects/${this.projectId}/timesheet/generate`);
      if (!r.generated) {
        this.toast('No timesheet entries could be generated (no dated tasks with hours)', true);
        return;
      }
      this.toast(`Timesheet generated — ${r.generated} entries from ${r.fromTasks} WBS tasks`);
      await this.openTimesheetModal();
    };
    const existing = await API.get(`/projects/${this.projectId}/timesheet`);
    if (existing.entries.length) {
      this.confirm('Re-generate the timesheet? Existing entries (including manual edits) will be replaced.', run);
    } else {
      await run();
    }
  },

  // Editable timesheet popup: add/edit/delete rows + download options
  async openTimesheetModal() {
    const ts = await API.get(`/projects/${this.projectId}/timesheet`);
    if (!ts.entries.length) {
      this.toast('No timesheet yet — click Generate Timesheet first', true);
      return;
    }
    const { bodyEl, footEl } = this.openModal(`Timesheet — ${ts.projectKey}`, true);
    const base = `/projects/${this.projectId}/timesheet`;

    let h = `<div class="ts-summary">
      <span class="badge">${ts.entries.length} entries</span>
      <span class="badge">${ts.totalHours} hours</span>
      <span class="badge">${ts.resources} resources</span>
      <span class="badge">${ts.daysCovered} working days</span>
      <button class="act-btn add" id="ts-add" title="Add entry" aria-label="Add entry">&#65291;</button>
      <span class="ts-note">Each WBS task's estimate is spread evenly across the working days (Mon–Fri) between its start and end dates. Rows are editable.</span>
    </div>`;
    h += `<div class="tbl-wrap ts-table"><table class="tbl">
      <tr><th>Date</th><th>Day</th><th>Assignee (IPN)</th><th>Task Summary</th><th>Phase</th><th>Task Type</th><th>Hours</th><th></th></tr>`;
    let prevAssignee = null;
    ts.entries.forEach((e, i) => {
      const newBlock = e.assignee !== prevAssignee;
      prevAssignee = e.assignee;
      h += `<tr${newBlock ? ' class="ts-block"' : ''}><td>${escHtml(isoDate(e.date))}</td><td>${escHtml(e.day)}</td>
        <td>${escHtml(e.assignee)}</td><td>${escHtml(e.summary)}</td>
        <td>${escHtml(e.phase)}</td><td>${escHtml(e.task_type)}</td>
        <td class="num">${e.hours}</td>
        <td class="row-actions">
          <button class="act-btn ts-edit" data-i="${i}" title="Edit entry" aria-label="Edit entry">&#9998;</button>
          <button class="act-btn danger ts-del" data-i="${i}" title="Delete entry" aria-label="Delete entry">&#128465;</button>
        </td></tr>`;
    });
    h += `<tr class="ts-total"><td colspan="6"><b>Total</b></td><td class="num"><b>${ts.totalHours}</b></td><td></td></tr>`;
    h += `</table></div>`;
    bodyEl.innerHTML = h;

    // CRUD wiring - every operation refreshes the popup
    bodyEl.querySelector('#ts-add').onclick = () =>
      this.openFormModal('Add timesheet entry', this.tsFields,
        { date: ts.entries[0] ? isoDate(ts.entries[0].date) : '', hours: 8 }, async (vals) => {
          await API.post(base, vals);
          this.toast('Entry added');
          await this.openTimesheetModal();
        });
    bodyEl.querySelectorAll('.ts-edit').forEach((btn) => {
      btn.onclick = () => {
        const e = ts.entries[Number(btn.dataset.i)];
        this.openFormModal('Edit timesheet entry', this.tsFields, e, async (vals) => {
          await API.put(`${base}/${e.id}`, { ...e, ...vals });
          this.toast('Entry updated');
          await this.openTimesheetModal();
        });
      };
    });
    bodyEl.querySelectorAll('.ts-del').forEach((btn) => {
      btn.onclick = () => {
        const e = ts.entries[Number(btn.dataset.i)];
        this.confirm('Delete this timesheet entry?', async () => {
          await API.del(`${base}/${e.id}`);
          this.toast('Entry deleted');
          await this.openTimesheetModal();
        });
      };
    });

    // download options (icon buttons with captions on mouse-over)
    const tsUrl = (fmt) => `/api${base}/export${fmt ? `?format=${fmt}` : ''}`;
    const addDl = (icon, caption, fmt) => {
      const b = document.createElement('button');
      b.className = 'act-btn dl';
      b.innerHTML = icon;
      b.title = caption;
      b.setAttribute('aria-label', caption);
      b.onclick = () => { location.href = tsUrl(fmt); };
      footEl.appendChild(b);
    };
    addDl('&#128213;', 'Download Timesheet PDF', 'pdf');
    addDl('&#127760;', 'Download Timesheet HTML', 'html');
    addDl('&#128215;', 'Download Timesheet Excel (.xls)', '');
    addDl('&#128196;', 'Download Timesheet CSV', 'csv');
  },

  // ---------------- WBS row CRUD (edit the generated WBS) ----------------
  wbsFields: [
    { key: 'assignee', label: 'Assignee (IPN)' },
    { key: 'summary', label: 'Task Summary', full: true },
    { key: 'description', label: 'Task Desc', full: true },
    { key: 'start_date', label: 'Start Date', type: 'date' },
    { key: 'end_date', label: 'End Date', type: 'date' },
    { key: 'phase', label: 'Phase' },
    { key: 'task_type', label: 'Task Type' },
    { key: 'component', label: 'Component Value' },
    { key: 'est_hours', label: 'Estimated Hours', type: 'number' }
  ],

  async reopenWbs() {
    await this.reload();
    this.openArtifact('WBS For JIRA', `${this.data.project.project_key}-WBS`);
  },

  addWbsRow() {
    const p = this.data.project;
    this.openFormModal('Add WBS task', this.wbsFields,
      { component: p.project_key, phase: 'Management', est_hours: 0 }, async (vals) => {
        await API.post(`/projects/${this.projectId}/wbs`, { ...vals, project_key: p.project_key });
        this.toast('WBS task added');
        await this.reopenWbs();
      });
  },

  editWbsRow(row) {
    this.openFormModal('Edit WBS task', this.wbsFields, row, async (vals) => {
      await API.put(`/projects/${this.projectId}/wbs/${row.id}`, { ...row, ...vals });
      this.toast('WBS task updated');
      await this.reopenWbs();
    });
  },

  deleteWbsRow(row) {
    this.confirm(`Delete WBS task "${row.summary}"?`, async () => {
      await API.del(`/projects/${this.projectId}/wbs/${row.id}`);
      this.toast('WBS task deleted');
      await this.reopenWbs();
    });
  },

  // ---------------- modal & toast primitives ----------------
  openModal(title, large = false) {
    const root = document.getElementById('modalRoot');
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal${large ? ' modal-lg' : ''}">
      <div class="modal-head"><h3>${escHtml(title)}</h3><button class="modal-close">&times;</button></div>
      <div class="modal-body"></div>
      <div class="modal-foot"></div>
    </div>`;
    overlay.querySelector('.modal-close').onclick = () => this.closeModal();
    overlay.onclick = (e) => { if (e.target === overlay) this.closeModal(); };
    root.innerHTML = '';
    root.appendChild(overlay);
    return { modal: overlay, bodyEl: overlay.querySelector('.modal-body'), footEl: overlay.querySelector('.modal-foot') };
  },

  closeModal() { document.getElementById('modalRoot').innerHTML = ''; },

  openFormModal(title, fields, values, onSubmit) {
    const { bodyEl, footEl } = this.openModal(title);
    const form = document.createElement('div');
    form.className = 'form-grid';
    const inputs = {};
    fields.filter((f) => !f.hidden).forEach((f) => {
      const label = document.createElement('label');
      label.className = 'editable-field' + ((f.full || f.type === 'textarea') ? ' full' : '');
      label.innerHTML = `<span>${escHtml(f.label)}</span>`;
      let input;
      if (f.type === 'textarea') { input = document.createElement('textarea'); input.rows = 3; }
      else if (f.type === 'select') {
        input = document.createElement('select');
        (f.options || []).forEach((o) => {
          const opt = document.createElement('option');
          opt.value = o; opt.textContent = o;
          input.appendChild(opt);
        });
      } else { input = document.createElement('input'); input.type = f.type || 'text'; }
      let initVal = values[f.key];
      if (f.toInput) initVal = f.toInput(initVal);
      else if (f.type === 'date') initVal = isoDate(initVal);
      input.value = initVal ?? '';
      inputs[f.key] = input;
      label.appendChild(input);
      form.appendChild(label);
    });
    bodyEl.appendChild(form);

    const cancel = document.createElement('button');
    cancel.className = 'btn btn-light';
    cancel.textContent = 'Cancel';
    cancel.onclick = () => this.closeModal();
    const save = document.createElement('button');
    save.className = 'btn btn-accent';
    save.textContent = 'Save';
    save.onclick = async () => {
      const vals = {};
      for (const [k, input] of Object.entries(inputs)) vals[k] = input.value;
      try {
        await onSubmit(vals);
        this.closeModal();
      } catch (e) { this.toast('Failed: ' + e.message, true); }
    };
    footEl.append(cancel, save);
    const first = form.querySelector('input, textarea, select');
    if (first) first.focus();
  },

  confirm(message, onOk) {
    const { bodyEl, footEl } = this.openModal('Please confirm');
    bodyEl.innerHTML = `<p style="margin:4px 0 8px 0">${escHtml(message)}</p>`;
    const cancel = document.createElement('button');
    cancel.className = 'btn btn-light';
    cancel.textContent = 'Cancel';
    cancel.onclick = () => this.closeModal();
    const ok = document.createElement('button');
    ok.className = 'btn btn-accent';
    ok.textContent = 'OK';
    ok.onclick = async () => { this.closeModal(); await onOk(); };
    footEl.append(cancel, ok);
    ok.focus();
  },

  toast(msg, isError = false) {
    const root = document.getElementById('toastRoot');
    const t = document.createElement('div');
    t.className = 'toast' + (isError ? ' err' : '');
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }
};
