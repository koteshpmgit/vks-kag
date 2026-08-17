// New Project Wizard — Web App UI only.
// Walks through every Key Section (skipping the read-only "Artifacts" group,
// which has nothing to fill in) with a tip and Previous/Next controls.
//
// Nothing is written to the backend until the wizard is actually finished:
// all 26 screens are open and navigable from the very first click, and every
// value entered along the way — the project's own fields, and every row
// added to Hardware/Software/Risks/etc — lives only in this module's local
// `draft` object. Only on the last step's "Finish" does the project actually
// get created, immediately followed by every drafted row being submitted to
// its real endpoint. Closing early discards the draft entirely; there is no
// partial save.
//
// Two groups of steps behave differently:
//  - Application Details, Resources and the 5 Standards sections are shared
//    across every project (not scoped to this one), so there's no reason to
//    defer them — they still render live via WebApp.renderSection and save
//    immediately, exactly like the normal single-page view.
//  - Phases and Milestones are always auto-seeded with a standard set by the
//    backend at project-creation time, so they can't be edited before that
//    point — the wizard shows a read-only preview of what will be created.
//  - Every other section (Hardware, Software, HR Plan, Risks, ...) is
//    project-scoped and genuinely new, so it's collected into `draft.lists`
//    and only submitted once the project exists.

const WIZARD_TIPS = {
  __create__: 'Start with the essentials — project key, type and sizing. Nothing is saved anywhere yet, so feel free to explore every screen before committing.',
  appDetails: 'Application Details are shared across every project for this application. Fill in the name, domain and links once — you can revisit them anytime from the normal sections.',
  hardware: 'List every server, workstation or device the project needs, with quantities and the dates each one should be provisioned by.',
  software: 'Capture installations and licenses with version numbers and the number of installations required, so procurement can be planned early.',
  environments: 'Record each environment (Dev / SIT / UAT / Prod) with its server path and how the team accesses it.',
  dar: 'Note any decisions that need formal evaluation — what is being decided, who is involved, and the outcome once resolved.',
  projSummary: 'These extend what you entered on the first screen — scope, quality objectives, shared folder paths and any project-specific conventions.',
  phases: 'Standard SDLC phases with their default % of effort — created automatically once you finish the wizard. Fine-tune the percentages afterward from Project Summary.',
  milestones: 'Formula-driven milestone dates — created automatically once you finish the wizard. Mark contractual deliverables afterward from Project Summary.',
  hrplan: 'Assign roles to named resources with their % contribution and the date range they are staffed for.',
  constraints: 'List known limits (budget, technology, timeline) that shape how the project can be executed.',
  dependencies: 'Capture external inputs or handoffs this plan depends on, so schedule risk is visible early.',
  assumptions: 'Record planning assumptions used across the generated artifacts — useful context if scope is questioned later.',
  risks: 'Note risk statements that should carry into the Kick-Off and AIN material.',
  training: 'Plan any training needed, who attends, and target delivery dates.',
  docs: 'List documents or items handed over to the team, with version and hard/soft copy status.',
  goals: 'Define measurable project goals — metric, target, frequency of collection and where results are stored.',
  process: 'Mark which standard processes apply, and note any tailoring for this project.',
  modules: 'Break the application into modules with their dev / TL / tester resourcing.',
  agenda: 'Draft the Kick-Off meeting agenda — one topic per row, in running order.',
  resources: 'This roster is shared across every project — add anyone missing before assigning them in HR Plan.',
  stdRoles: 'Organization-wide role responsibilities used by generated artifacts — usually only needs updating occasionally.',
  stdTools: 'Organization-wide tools, standards and templates by activity — shared across all projects.',
  stdMatrix: 'Organization-wide stakeholder responsibility mapping — shared across all projects.',
  stdFolders: 'Organization-wide standard folder plan for project storage — shared across all projects.',
  stdTasks: 'Organization-wide WBS task templates used when generating the JIRA WBS — shared across all projects.'
};

const NewProjectWizard = {
  isOpen: false,
  steps: [],
  stepIndex: 0,
  projectCreated: false,
  submitting: false,
  draft: null,
  _localIdSeq: 1,

  // Project-scoped sections collected locally and only submitted at Finish.
  // (Application Details / Resources / Standards are shared across projects
  // and stay live; Phases/Milestones are backend-seeded, not user-created.)
  DRAFT_LIST_KEYS: ['hardware', 'software', 'environments', 'dar', 'hrplan',
    'constraints', 'dependencies', 'assumptions', 'risks', 'training',
    'docs', 'goals', 'process', 'modules', 'agenda'],
  LIST_KIND_BY_SECTION: { constraints: 'constraint', dependencies: 'dependency', assumptions: 'assumption', risks: 'risk' },

  PHASE_DEFAULTS: [
    ['Analysis', 8], ['Design', 11], ['Design Review', 3], ['Coding', 20],
    ['Code Review', 4], ['Unit Testing', 6], ['System Testing', 24],
    ['PM', 10], ['PAT/UAT Support', 10], ['Other Efforts', 4]
  ],
  MILESTONE_DEFAULTS: ['Requirement Analysis', 'Design', 'Coding & UTC execution',
    'System test cycle 1', 'System test cycle 2', 'PAT Delivery', 'PAT Support', 'UAT Support', 'Go - Live'],

  // ---------------- lifecycle ----------------
  open() {
    this.steps = this.buildSteps();
    this.stepIndex = 0;
    this.projectCreated = false;
    this.submitting = false;
    this._localIdSeq = 1;
    const today = new Date().toISOString().slice(0, 10);
    this.draft = {
      project: {
        project_key: `NEW PROJECT ${Date.now().toString().slice(-5)}`,
        project_type: 'MQC',
        fp_count: 0,
        productivity_factor: 1,
        start_date: today,
        technology: '',
        brief_desc: '',
        scope: ''
      },
      lists: Object.fromEntries(this.DRAFT_LIST_KEYS.map((k) => [k, []]))
    };
    this.isOpen = true;
    this.render();
  },

  buildSteps() {
    const steps = [{ key: '__create__', groupTitle: 'Get Started', title: 'Create Project' }];
    WebApp.groups.filter((g) => g.id !== 'art').forEach((g) => {
      g.sections.forEach((sec) => {
        steps.push({ key: sec, groupId: g.id, groupTitle: g.title, title: WebApp.sectionTitles[sec] });
      });
    });
    return steps;
  },

  confirmClose() {
    const untouched = this.stepIndex === 0 && Object.values(this.draft.lists).every((a) => a.length === 0);
    if (untouched) { this.close(); return; }
    WebApp.confirm(
      'Exit the wizard? Nothing has been saved yet — everything you’ve entered will be lost.',
      () => this.close()
    );
  },

  close() {
    this.isOpen = false;
    document.getElementById('wizardRoot').innerHTML = '';
    if (this.projectCreated) {
      WebApp.buildNav();
      WebApp.buildHeaderMenu();
      WebApp.openSection('proj', 'projSummary');
    }
  },

  // ---------------- shell ----------------
  render() {
    const root = document.getElementById('wizardRoot');
    const step = this.steps[this.stepIndex];
    const total = this.steps.length;
    const pct = Math.round((this.stepIndex / (total - 1)) * 100);

    root.innerHTML = `
      <div class="wizard-overlay">
        <div class="wizard-panel modal modal-lg" role="dialog" aria-modal="true" aria-label="New Project Wizard">
          <div class="wizard-header">
            <div class="wizard-header-top">
              <h2>&#10024; New Project Wizard</h2>
              <button type="button" class="modal-close" id="wizClose" title="Close" aria-label="Close">&times;</button>
            </div>
            <div class="wizard-progress">
              <div class="wizard-progress-track"><span style="width:${pct}%"></span></div>
              <small>Step ${this.stepIndex + 1} of ${total} — ${escHtml(step.title)}</small>
            </div>
          </div>
          <div class="wizard-body">
            <nav class="wizard-steplist" id="wizSteps"></nav>
            <div class="wizard-content">
              <div class="wizard-tip" id="wizTip"></div>
              <div class="wizard-rowcount" id="wizRowStatus" hidden></div>
              <div class="wizard-errors" id="wizErrors" hidden></div>
              <div class="wizard-step-host" id="wizStepHost"></div>
            </div>
          </div>
          <div class="wizard-footer">
            <button type="button" class="btn btn-light" id="wizPrev">&#8592; Previous</button>
            <button type="button" class="btn btn-accent" id="wizNext">Next &#8594;</button>
          </div>
        </div>
      </div>`;

    document.getElementById('wizClose').onclick = () => this.confirmClose();
    document.getElementById('wizPrev').onclick = () => this.goPrev();
    document.getElementById('wizNext').onclick = () => this.goNext();

    this.renderStepList();
    this.renderStep();
  },

  renderStepList() {
    const host = document.getElementById('wizSteps');
    if (!host) return;
    let html = '';
    let lastGroup = null;
    this.steps.forEach((s, i) => {
      if (s.groupTitle !== lastGroup) {
        html += `<div class="wiz-step-group">${escHtml(s.groupTitle)}</div>`;
        lastGroup = s.groupTitle;
      }
      const state = i === this.stepIndex ? 'current' : (this.isVisited(i) ? 'done' : '');
      const num = i === 0 ? '&#128640;' : (this.isVisited(i) ? '&#10003;' : String(i));
      html += `<button type="button" class="wiz-step ${state}" data-i="${i}">
        <span class="wiz-step-num">${num}</span>
        <span class="wiz-step-label">${escHtml(s.title)}</span>
      </button>`;
    });
    host.innerHTML = html;
    host.querySelectorAll('.wiz-step').forEach((btn) => {
      btn.onclick = () => this.goToStep(Number(btn.dataset.i));
    });
  },

  isVisited(i) {
    const key = this.steps[i].key;
    if (key === '__create__') return this.isCreateStepValid();
    if (key === 'appDetails') return this.isAppDetailsValid();
    if (key === 'projSummary') return this.isProjSummaryValid();
    if (key === 'phases' || key === 'milestones') return false; // nothing to complete before creation
    return this.rowCount(key) > 0;
  },

  renderStep() {
    const step = this.steps[this.stepIndex];
    const host = document.getElementById('wizStepHost');
    const tipHost = document.getElementById('wizTip');
    const errHost = document.getElementById('wizErrors');
    errHost.hidden = true;
    errHost.innerHTML = '';
    tipHost.innerHTML = `<span class="wizard-tip-icon">&#128161;</span><div><b>Tip</b><p>${escHtml(WIZARD_TIPS[step.key] || '')}</p></div>`;
    host.innerHTML = '';

    if (step.key === '__create__') this.renderDraftObjectForm(host, this.createFieldDefs, this.draft.project);
    else if (step.key === 'projSummary') this.renderDraftObjectForm(host, WebApp.fields.project, this.draft.project);
    else if (step.key === 'phases') this.renderPhasesPreview(host);
    else if (step.key === 'milestones') this.renderMilestonesPreview(host);
    else if (this.isDraftListKey(step.key)) this.renderDraftCrudTable(host, step.key);
    else WebApp.renderSection(step.key, host); // appDetails, resources, stdRoles/Tools/Matrix/Folders/Tasks — shared, live

    this.renderRowCountStatus();
    this.updateFooter();
  },

  // called by WebApp.refreshActiveView() after a *live* section (appDetails,
  // resources, standards) saves a row — draft sections use refreshDraftListStep
  // instead, since they never touch WebApp's own data/API path
  refreshStep() {
    if (!this.isOpen) return;
    const step = this.steps[this.stepIndex];
    if (step.key === '__create__' || step.key === 'projSummary' || this.isDraftListKey(step.key)) return;
    const host = document.getElementById('wizStepHost');
    if (!host) return;
    host.innerHTML = '';
    WebApp.renderSection(step.key, host);
    this.renderRowCountStatus();
    this.renderStepList();
    const errEl = document.getElementById('wizErrors');
    if (errEl) { errEl.hidden = true; errEl.innerHTML = ''; }
  },

  refreshDraftListStep() {
    const step = this.steps[this.stepIndex];
    const host = document.getElementById('wizStepHost');
    if (host) { host.innerHTML = ''; this.renderDraftCrudTable(host, step.key); }
    this.renderRowCountStatus();
    this.renderStepList();
    const errEl = document.getElementById('wizErrors');
    if (errEl) { errEl.hidden = true; errEl.innerHTML = ''; }
  },

  // ---------------- "at least N rows" rule for list/table sections ----------------
  MIN_ROWS: 2,

  isListStep(key) {
    return key !== '__create__' && key !== 'appDetails' && key !== 'projSummary'
      && key !== 'phases' && key !== 'milestones';
  },

  isDraftListKey(key) { return this.DRAFT_LIST_KEYS.includes(key); },

  rowCount(sec) {
    if (this.draft.lists[sec]) return this.draft.lists[sec].length;
    return WebApp.sectionCount(sec) || 0; // resources / standards — still live
  },

  renderRowCountStatus() {
    const el = document.getElementById('wizRowStatus');
    const step = this.steps[this.stepIndex];
    if (!el || !this.isListStep(step.key)) { if (el) el.hidden = true; return; }
    const count = this.rowCount(step.key);
    const ok = count >= this.MIN_ROWS;
    el.hidden = false;
    el.className = 'wizard-rowcount ' + (ok ? 'ok' : 'low');
    el.innerHTML = ok
      ? `<span>&#10003;</span> ${count} row${count === 1 ? '' : 's'} added — meets the ${this.MIN_ROWS}-row minimum for this section.`
      : `<span>&#9888;</span> ${count} of ${this.MIN_ROWS} rows added — add ${this.MIN_ROWS - count} more before moving on.`;
  },

  validateListStep(sec) {
    const count = this.rowCount(sec);
    if (count < this.MIN_ROWS) {
      const title = WebApp.sectionTitles[sec];
      const remaining = this.MIN_ROWS - count;
      const tip = WIZARD_TIPS[sec] || '';
      this.showError(`"${title}" needs at least ${this.MIN_ROWS} rows before continuing — add ${remaining} more (currently ${count}). ${tip}`);
      return false;
    }
    return true;
  },

  updateFooter() {
    const prev = document.getElementById('wizPrev');
    const next = document.getElementById('wizNext');
    prev.disabled = this.stepIndex === 0 || this.submitting;
    next.disabled = this.submitting;
    if (this.submitting) next.textContent = 'Creating…';
    else if (this.stepIndex === this.steps.length - 1) next.textContent = 'Finish — Create Project ✓';
    else next.textContent = 'Next →';
  },

  showError(msg) {
    const el = document.getElementById('wizErrors');
    el.hidden = false;
    el.innerHTML = `<span>&#9888;</span> ${escHtml(msg)}`;
    // the step content can be scrolled well past the fold (long forms), so
    // without this the alert renders off-screen and the user sees nothing
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  // ---------------- draft object-form steps (Create Project / Project Summary) ----------------
  createFieldDefs: [
    { key: 'project_key', label: 'Project Key', required: true },
    { key: 'project_type', label: 'Project Type', required: true },
    { key: 'fp_count', label: 'FP Count', type: 'number', min: 10, hint: 'Function Points must be at least 10 — 0 means nothing has been sized yet. Try a realistic estimate such as 10, 25 or 50.' },
    { key: 'productivity_factor', label: 'Productivity Factor', type: 'number' },
    { key: 'start_date', label: 'Start Date', type: 'date', required: true },
    { key: 'technology', label: 'Technology' },
    { key: 'brief_desc', label: 'Brief Description', type: 'textarea', full: true },
    { key: 'scope', label: 'Scope', type: 'textarea', full: true }
  ],

  // Plain in-place binding to `this.draft.project` — no save button, no API
  // call: every keystroke already updates the one object that gets POSTed
  // as-is when the wizard finishes.
  renderDraftObjectForm(host, fields, obj) {
    const form = document.createElement('div');
    form.className = 'form-grid';
    fields.forEach((f) => {
      const label = document.createElement('label');
      label.className = 'editable-field' + ((f.full || f.type === 'textarea') ? ' full' : '');
      const reqMark = f.required ? ' <b class="wiz-req">*</b>' : '';
      const minHint = f.min !== undefined ? ` <i class="field-hint-inline">(min ${f.min})</i>` : '';
      label.innerHTML = `<span>${escHtml(f.label)}${reqMark}${minHint}</span>`;
      const input = f.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
      if (f.type === 'textarea') input.rows = 3;
      else input.type = f.type || 'text';
      if (f.type === 'number' && f.min !== undefined) input.min = String(f.min);
      input.value = f.type === 'date' ? isoDate(obj[f.key]) : (obj[f.key] ?? '');
      input.oninput = () => { obj[f.key] = input.value; };
      label.appendChild(input);
      form.appendChild(label);
    });
    host.appendChild(form);
  },

  isCreateStepValid() {
    const v = this.draft.project;
    if (!v.project_key || !String(v.project_key).trim()) return false;
    if (!v.project_type || !String(v.project_type).trim()) return false;
    if (!v.start_date) return false;
    if (v.productivity_factor !== '' && Number.isNaN(Number(v.productivity_factor))) return false;
    if (Number.isNaN(Number(v.fp_count)) || Number(v.fp_count) < 10) return false;
    return true;
  },
  validateCreateStep() {
    if (this.isCreateStepValid()) return true;
    const v = this.draft.project;
    const errs = [];
    if (!v.project_key || !String(v.project_key).trim()) errs.push('Project Key is required.');
    if (!v.project_type || !String(v.project_type).trim()) errs.push('Project Type is required.');
    if (!v.start_date) errs.push('Start Date is required.');
    if (v.productivity_factor !== '' && Number.isNaN(Number(v.productivity_factor))) errs.push('Productivity Factor must be a number.');
    if (Number.isNaN(Number(v.fp_count))) errs.push('FP Count must be a number.');
    else if (Number(v.fp_count) < 10) errs.push(this.createFieldDefs.find((f) => f.key === 'fp_count').hint);
    this.showError(errs.join(' '));
    return false;
  },

  isProjSummaryValid() {
    return WebApp.validateObjectFields(WebApp.fields.project, this.draft.project).length === 0;
  },
  validateProjSummary() {
    if (this.isProjSummaryValid()) return true;
    this.showError(WebApp.validateObjectFields(WebApp.fields.project, this.draft.project).join(' '));
    return false;
  },

  // ---------------- live object-form step (Application Details) ----------------
  // Shared across every project, so it isn't part of the draft — it saves
  // immediately via the normal API, same as the single-page view.
  async persistAppDetails() {
    const app = WebApp.data.application;
    await API.put(`/application/${app.id}`, app);
    await WebApp.reload();
  },
  isAppDetailsValid() {
    const app = WebApp.data.application;
    return !!(app.app_name && String(app.app_name).trim());
  },
  validateAppDetails() {
    if (this.isAppDetailsValid()) return true;
    this.showError('Application Name is required before continuing.');
    return false;
  },

  // ---------------- draft list/table steps ----------------
  renderDraftCrudTable(host, sec) {
    const fields = this.LIST_KIND_BY_SECTION[sec] ? WebApp.fields.listItem : WebApp.fields[sec];
    const rows = this.draft.lists[sec];

    const bar = document.createElement('div');
    bar.className = 'section-toolbar';
    const addBtn = document.createElement('button');
    addBtn.className = 'act-btn add';
    addBtn.innerHTML = '&#65291;';
    addBtn.title = 'Add row';
    addBtn.setAttribute('aria-label', 'Add row');
    addBtn.onclick = () => {
      WebApp.openFormModal('Add row', fields, { sno: rows.length + 1 }, async (vals) => {
        rows.push({ _localId: this._localIdSeq++, ...vals });
        this.refreshDraftListStep();
        WebApp.toast('Row added');
      });
    };
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
      edit.onclick = () => {
        WebApp.openFormModal('Edit row', fields, row, async (vals) => {
          Object.assign(row, vals);
          this.refreshDraftListStep();
          WebApp.toast('Row updated');
        });
      };
      const del = document.createElement('button');
      del.className = 'act-btn danger';
      del.innerHTML = '&#128465;';
      del.title = 'Delete row';
      del.setAttribute('aria-label', 'Delete row');
      del.onclick = () => {
        WebApp.confirm('Delete this row?', async () => {
          const idx = rows.indexOf(row);
          if (idx >= 0) rows.splice(idx, 1);
          this.refreshDraftListStep();
          WebApp.toast('Row deleted');
        });
      };
      act.append(edit, del);
      tr.appendChild(act);
      tbl.appendChild(tr);
    });
    wrap.appendChild(tbl);
    host.appendChild(wrap);
  },

  // ---------------- Phases / Milestones (backend-seeded, read-only here) ----------------
  renderPhasesPreview(host) {
    const note = document.createElement('p');
    note.className = 'wizard-note';
    note.textContent = 'Created automatically with these starting percentages once you finish the wizard.';
    host.appendChild(note);
    const wrap = document.createElement('div');
    wrap.className = 'tbl-wrap';
    const tbl = document.createElement('table');
    tbl.className = 'tbl readonly-table';
    tbl.innerHTML = '<tr><th>Phase</th><th>%</th></tr>' +
      this.PHASE_DEFAULTS.map(([name, pct]) => `<tr><td class="readonly-cell">${escHtml(name)}</td><td class="readonly-cell num">${pct}%</td></tr>`).join('');
    wrap.appendChild(tbl);
    host.appendChild(wrap);
  },
  renderMilestonesPreview(host) {
    const note = document.createElement('p');
    note.className = 'wizard-note';
    note.textContent = 'Created automatically with formula-driven dates once you finish the wizard.';
    host.appendChild(note);
    const wrap = document.createElement('div');
    wrap.className = 'tbl-wrap';
    const tbl = document.createElement('table');
    tbl.className = 'tbl readonly-table';
    tbl.innerHTML = '<tr><th>Milestone</th></tr>' +
      this.MILESTONE_DEFAULTS.map((name) => `<tr><td class="readonly-cell">${escHtml(name)}</td></tr>`).join('');
    wrap.appendChild(tbl);
    host.appendChild(wrap);
  },

  // ---------------- validation dispatch ----------------
  // ---- pure checks (no alert side effects) — safe to scan ahead with ----
  isStepValid(key, direction = 'forward') {
    if (key === '__create__') return this.isCreateStepValid();
    if (key === 'appDetails') return this.isAppDetailsValid();
    if (key === 'projSummary') return this.isProjSummaryValid();
    if (direction === 'forward' && this.isListStep(key)) return this.rowCount(key) >= this.MIN_ROWS;
    return true;
  },
  // ---- alert-showing versions, only call against the currently-rendered step ----
  validateStepByKey(key, direction = 'forward') {
    if (key === '__create__') return this.validateCreateStep();
    if (key === 'appDetails') return this.validateAppDetails();
    if (key === 'projSummary') return this.validateProjSummary();
    if (direction === 'forward' && this.isListStep(key)) return this.validateListStep(key);
    return true;
  },
  validateCurrentStep(direction = 'forward') {
    return this.validateStepByKey(this.steps[this.stepIndex].key, direction);
  },

  async persistCurrentStepData() {
    // the only step still backed by a live save mid-flow — draft steps have
    // nothing to persist until Finish, and list rows already save themselves
    // (drafted locally, or live-saved immediately for shared sections)
    if (this.steps[this.stepIndex].key === 'appDetails') await this.persistAppDetails();
  },

  // ---------------- navigation ----------------
  async goNext() {
    if (!this.validateCurrentStep()) return;
    await this.persistCurrentStepData();

    if (this.stepIndex >= this.steps.length - 1) { await this.finishWizard(); return; }
    this.stepIndex += 1;
    this.render();
  },

  async goPrev() {
    if (this.stepIndex === 0) return;
    if (!this.validateCurrentStep('back')) return;
    await this.persistCurrentStepData();
    this.stepIndex -= 1;
    this.render();
  },

  async goToStep(i) {
    if (i === this.stepIndex) return;

    if (i > this.stepIndex) {
      // Jumping ahead can skip clean over several steps at once — check every
      // one being passed, not just the one being left, otherwise the sidebar
      // becomes a loophole around the "at least 2 rows" / required-field
      // rules that Next enforces one step at a time.
      for (let s = this.stepIndex; s < i; s++) {
        if (!this.isStepValid(this.steps[s].key, 'forward')) {
          if (s !== this.stepIndex) { this.stepIndex = s; this.render(); }
          this.validateStepByKey(this.steps[s].key, 'forward'); // show the alert against that step's own DOM
          return;
        }
      }
      await this.persistCurrentStepData();
    } else {
      if (!this.validateCurrentStep('back')) return;
      await this.persistCurrentStepData();
    }

    this.stepIndex = i;
    this.render();
  },

  // ---------------- finish: the only point anything gets created ----------------
  async finishWizard() {
    // final safety net — re-check every step, not just the one Next already
    // validated, in case Previous/sidebar navigation left an earlier step
    // invalid again after it once passed
    for (let s = 0; s < this.steps.length; s++) {
      if (!this.isStepValid(this.steps[s].key, 'forward')) {
        this.stepIndex = s;
        this.render();
        this.validateStepByKey(this.steps[s].key, 'forward');
        return;
      }
    }

    this.submitting = true;
    this.updateFooter();

    let project;
    try {
      project = await API.post('/projects', this.draft.project);
    } catch (e) {
      this.submitting = false;
      this.updateFooter();
      this.showError('Failed to create the project: ' + e.message);
      return;
    }

    WebApp.projectId = Number(project.id);
    await WebApp.loadProjects(project.id);
    document.getElementById('projectSelect').value = String(project.id);

    let rowFailures = 0;
    for (const sec of this.DRAFT_LIST_KEYS) {
      const kind = this.LIST_KIND_BY_SECTION[sec];
      const base = kind ? `/projects/${WebApp.projectId}/lists` : `/projects/${WebApp.projectId}/${sec}`;
      for (const row of this.draft.lists[sec]) {
        const { _localId, ...vals } = row;
        try { await API.post(base, kind ? { kind, ...vals } : vals); }
        catch (e) { rowFailures += 1; }
      }
    }

    this.projectCreated = true;
    await WebApp.reload();
    this.submitting = false;
    if (rowFailures > 0) {
      WebApp.toast(`Project "${project.project_key}" created, but ${rowFailures} row${rowFailures === 1 ? '' : 's'} failed to save — check Project Summary and re-add if needed.`, true);
    } else {
      WebApp.toast(`🎉 Project "${project.project_key}" created with everything you entered!`);
    }
    this.close();
  }
};

// Classic <script> top-level `const` doesn't attach to `window` the way `var`
// does — WebApp.refreshActiveView() checks window.NewProjectWizard, so make
// it explicit rather than relying on implicit globals.
window.NewProjectWizard = NewProjectWizard;
