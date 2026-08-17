// App shell: sheet tabs, left-panel controls, toolbar - replicates the workbook UI & macros.
const App = {
  projectId: null,
  data: {},          // loaded server data cache
  sheets: [],        // registered sheet modules
  dirty: new Set(),  // pending edits (savers)

  registerSheet(sheet) { this.sheets.push(sheet); },

  sheetNames() { return this.sheets.map((s) => s.name); },

  async init() {
    // projects
    const projects = await API.get('/projects');
    const sel = document.getElementById('projectSelect');
    sel.innerHTML = projects.map((p) => `<option value="${p.id}">${escHtml(p.project_key)}</option>`).join('');
    this.projectId = projects[0]?.id || null;
    sel.onchange = () => { this.projectId = Number(sel.value); this.reloadAll(); };

    this.buildTabs();
    this.buildMenus();
    this.buildLeftPanel();
    this.bindToolbar();
    await this.reloadAll();
    this.activateSheet('Data Sheet');
    setStatus('Ready');
  },

  async reloadAll() {
    if (!this.projectId) return;
    const pid = this.projectId;
    setStatus('Calculating…');
    const [application, project, computed, resources, hrplan, phases, milestones,
      hardware, software, lists, docs, goals, training, process, environments, dar,
      agenda, modules, stdRoles, stdTools, matrix, folders, wbs] = await Promise.all([
      API.get('/application'),
      API.get(`/projects/${pid}`),
      API.get(`/projects/${pid}/computed`),
      API.get('/resources'),
      API.get(`/projects/${pid}/hrplan`),
      API.get(`/projects/${pid}/phases`),
      API.get(`/projects/${pid}/milestones`),
      API.get(`/projects/${pid}/hardware`),
      API.get(`/projects/${pid}/software`),
      API.get(`/projects/${pid}/lists`),
      API.get(`/projects/${pid}/docs`),
      API.get(`/projects/${pid}/goals`),
      API.get(`/projects/${pid}/training`),
      API.get(`/projects/${pid}/process`),
      API.get(`/projects/${pid}/environments`),
      API.get(`/projects/${pid}/dar`),
      API.get(`/projects/${pid}/agenda`),
      API.get(`/projects/${pid}/modules`),
      API.get('/standards/roles'),
      API.get('/standards/tools'),
      API.get('/standards/stakeholder-matrix'),
      API.get('/standards/folder-structure'),
      API.get(`/projects/${pid}/wbs`)
    ]);
    this.data = { application, project, computed, resources, hrplan, phases, milestones,
      hardware, software, lists, docs, goals, training, process, environments, dar,
      agenda, modules, stdRoles, stdTools, matrix, folders, wbs };

    // Worksheet_Activate: LblProject.Caption = ProjectName; AIN sheet renamed "AIN-<Project>"
    document.getElementById('lblProject').textContent = project.project_key;
    const ainTab = document.querySelector('#tabbar .tab[data-sheet="AIN-Project"]');
    if (ainTab) ainTab.textContent = `AIN-${project.project_key}`;
    const wbsTab = document.querySelector('#tabbar .tab[data-sheet="WBS For JIRA"]');
    if (wbsTab) wbsTab.textContent = wbs.length ? `${project.project_key}-WBS` : 'WBS For JIRA';

    this.renderAll();
  },

  renderAll() {
    for (const s of this.sheets) {
      const host = document.getElementById(`sheet-${s.id}`);
      if (host) s.render(host, this.data, this);
    }
  },

  buildTabs() {
    const tabbar = document.getElementById('tabbar');
    const area = document.getElementById('sheetarea');
    tabbar.innerHTML = ''; area.innerHTML = '';
    for (const s of this.sheets) {
      const tab = document.createElement('span');
      tab.className = 'tab';
      tab.dataset.sheet = s.name;
      tab.textContent = s.name;
      tab.onclick = () => this.activateSheet(s.name);
      tabbar.appendChild(tab);
      const div = document.createElement('div');
      div.className = 'sheet';
      div.id = `sheet-${s.id}`;
      area.appendChild(div);
    }
  },

  activateSheet(name) {
    const s = this.sheets.find((x) => x.name === name);
    if (!s) return;
    document.querySelectorAll('#tabbar .tab').forEach((t) =>
      t.classList.toggle('active', t.dataset.sheet === name));
    document.querySelectorAll('.sheet').forEach((d) =>
      d.classList.toggle('active', d.id === `sheet-${s.id}`));
    document.getElementById('sheetarea').scrollTop = 0;
    document.getElementById('cellRef').textContent = 'A1';
    setStatus('Ready');
    // left panel only relevant on Data Sheet (as in the workbook)
    document.getElementById('leftpanel').style.display = name === 'Data Sheet' ? 'block' : 'none';
  },

  // GoToDataSection(strSection) - scrolls to a section within Data Sheet
  goToSection(sectionId) {
    this.activateSheet('Data Sheet');
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.remove('highlight-flash');
      void el.offsetWidth;
      el.classList.add('highlight-flash');
    }
  },

  buildLeftPanel() {
    const combos = {
      comboAppData: [
        ['Select the Section...', ''],
        ['Application Details', 'sec-app-details'],
        ['Hardware', 'sec-app-hardware'],
        ['Software', 'sec-app-software'],
        ['Devolopment Environments', 'sec-app-env'],
        ['Decision Analysis and Resolution', 'sec-app-dar'],
        ['Human Res Plan for Application', 'sec-app-hrplan']
      ],
      comboProjData: [
        ['Select the Section...', ''],
        ['Projects Summary', 'sec-proj-summary'],
        ['Estimated Effort', 'sec-proj-effort'],
        ['Milestone Dates', 'sec-proj-milestones'],
        ['Items handed over', 'sec-proj-docs'],
        ['Constraints', 'sec-proj-constraints'],
        ['Dependencies', 'sec-proj-dependencies'],
        ['Assumptions', 'sec-proj-assumptions'],
        ['Risks', 'sec-proj-risks'],
        ['Training Plan', 'sec-proj-training'],
        ['Human Resource plan -Detail Role-Wise', 'sec-proj-hrplan'],
        ['Module Details', 'sec-proj-modules'],
        ['Process Planning', 'sec-proj-process'],
        ['Project Goals', 'sec-proj-goals']
      ],
      comboResData: [
        ['Select the Section...', ''],
        ['Resource-Data', 'sec-res-data']
      ],
      comboStdData: [
        ['Select the Section...', ''],
        ['Roles & Responsibilities', 'sec-std-roles'],
        ['Tools, Methodologies and Techniques', 'sec-std-tools'],
        ['Stakeholder Matrix', 'sec-std-matrix'],
        ['Folder Structure', 'sec-std-folders'],
        ['Task Templates (WBS)', 'sec-std-tasks']
      ]
    };
    for (const [id, opts] of Object.entries(combos)) {
      const sel = document.getElementById(id);
      sel.innerHTML = opts.map(([t, v]) => `<option value="${v}">${escHtml(t)}</option>`).join('');
      sel.onchange = () => { if (sel.value) this.goToSection(sel.value); sel.selectedIndex = 0; };
    }
    // label clicks jump to first section of their group (LblAppData_Click etc.)
    document.getElementById('lblAppData').onclick = () => this.goToSection('sec-app-details');
    document.getElementById('lblProjData').onclick = () => this.goToSection('sec-proj-summary');
    document.getElementById('lblResData').onclick = () => this.goToSection('sec-res-data');
    document.getElementById('lblStdData').onclick = () => this.goToSection('sec-std-roles');
    document.getElementById('lblProject').onclick = () => this.goToSection('sec-app-details');
    // CmdMenu_Click: Range("A2").Select - back to the top
    document.getElementById('cmdMenu').onclick = () => {
      document.getElementById('sheetarea').scrollTop = 0;
    };
    // protect radios (secondary set on panel)
    document.getElementById('rbProtect2').onchange = () => this.setProtect(true);
    document.getElementById('rbUnprotect2').onchange = () => this.setProtect(false);

    // artifact combos - PopulateArtifactCombo added every worksheet name
    const artiOptions = ['Select Artifact to Copy', ...this.sheetNames()];
    for (const id of ['cmbArtiName', 'cmbArtiName2']) {
      const el = document.getElementById(id);
      el.innerHTML = artiOptions.map((n) => `<option>${escHtml(n)}</option>`).join('');
    }
    document.getElementById('btnCopyToDesktop2').onclick = () =>
      this.copyArtifact(document.getElementById('cmbArtiName2').value);
  },

  bindToolbar() {
    document.getElementById('btnCopyToDesktop').onclick = () =>
      this.copyArtifact(document.getElementById('cmbArtiName').value);
    document.getElementById('btnGenWbs').onclick = () => this.generateWbs();
    document.getElementById('btnSave').onclick = () => this.saveAll();
    document.getElementById('rbProtect').onchange = () => this.setProtect(true);
    document.getElementById('rbUnprotect').onchange = () => this.setProtect(false);
    const layoutSelect = document.getElementById('layoutSelect');
    if (layoutSelect) {
      layoutSelect.value = '/excel';
      layoutSelect.onchange = () => { if (layoutSelect.value) location.href = layoutSelect.value; };
    }
    document.addEventListener('focusin', (e) => {
      if (e.target.matches('.grid input, .grid textarea, .grid select')) {
        const td = e.target.closest('td');
        const tr = e.target.closest('tr');
        if (td && tr) {
          const col = [...tr.children].indexOf(td);
          const row = [...tr.parentElement.children].indexOf(tr) + 1;
          document.getElementById('cellRef').textContent =
            String.fromCharCode(64 + Math.min(col + 1, 26)) + row;
          document.getElementById('cellValue').textContent = e.target.value || '';
        }
      }
    });
  },

  // SheetProtUnProt(Pflag)
  setProtect(flag) {
    document.body.classList.toggle('protected', flag);
    document.getElementById('rbProtect').checked = flag;
    document.getElementById('rbUnprotect').checked = !flag;
    document.getElementById('rbProtect2').checked = flag;
    document.getElementById('rbUnprotect2').checked = !flag;
    setStatus(flag ? 'Sheet protected (read-only)' : 'Sheet unprotected (editable)');
  },

  // CopyArtifactToDesktop(StrSheetName)
  async copyArtifact(name) {
    if (!name || name === 'Select Artifact to Copy') return;
    const proj = this.data.project?.project_key || '';
    const ans = await msgBox(`Proceed for copy ${proj}-${name} to desktop`, {
      title: 'Confirm selection', buttons: ['OK', 'Cancel']
    });
    if (ans !== 'OK') return;
    const artifact = name === `AIN-${proj}` ? 'AIN-Project' : name;
    window.location.href = `/api/projects/${this.projectId}/export/${encodeURIComponent(artifact)}`;
    await msgBox(`${proj}-${name} has been copied to Desktop`);
  },

  // GenWBS2
  async generateWbs() {
    const proj = this.data.project?.project_key || '';
    if (this.data.wbs.length) {
      const ans = await msgBox('Are you sure you want to Re-Generate WBS', {
        title: ' Confirm WBS Re-Genaration', buttons: ['OK', 'Cancel']
      });
      if (ans !== 'OK') return;
    }
    setStatus('Generating WBS…');
    const r = await API.post(`/projects/${this.projectId}/wbs/generate`);
    await this.reloadAll();
    this.activateSheet('WBS For JIRA');
    await msgBox(`WBS genarated for the project - ${proj}-WBS (${r.generated} tasks)`);
    setStatus('Ready');
  },

  // Generate Timesheet: day-wise entries per WBS task; asks for download after generation
  async generateTimesheet() {
    const proj = this.data.project?.project_key || '';
    if (!this.data.wbs.length) {
      await msgBox('Generate the WBS first - the timesheet is built from the WBS tasks');
      return;
    }
    setStatus('Generating Timesheet…');
    await API.post(`/projects/${this.projectId}/timesheet/generate`);
    const ts = await API.get(`/projects/${this.projectId}/timesheet`);
    setStatus('Ready');
    if (!ts.entries.length) {
      await msgBox('No timesheet entries could be generated (no dated tasks with hours)');
      return;
    }
    const ans = await msgBox(
      `Timesheet generated for ${proj}:\n\n` +
      `${ts.entries.length} day-wise entries\n${ts.totalHours} total hours\n` +
      `${ts.resources} resources across ${ts.daysCovered} working days\n\n` +
      `Download as Excel (.xls)?`,
      { title: 'Timesheet generated', buttons: ['OK', 'Cancel'] });
    if (ans === 'OK') location.href = `/api/projects/${this.projectId}/timesheet/export`;
  },

  async saveAll() {
    setStatus('Saving…');
    try {
      for (const fn of this.dirty) await fn();
      this.dirty.clear();
      await this.reloadAll();
      setStatus('Saved');
    } catch (e) {
      await msgBox('Save failed: ' + e.message);
      setStatus('Save failed');
    }
  },

  markDirty(saver) { this.dirty.add(saver); setStatus('Modified - click Save'); },

  buildMenus() {
    const menus = {
      file: [
        ['Save', () => this.saveAll()],
        ['Copy Artifact To Desktop…', () => this.copyArtifact(document.getElementById('cmbArtiName').value)],
        ['Export WBS (CSV)', () => { window.location.href = `/api/projects/${this.projectId}/export/WBS%20For%20JIRA?format=csv`; }]
      ],
      edit: [
        ['Refresh (recalculate)', () => this.reloadAll()]
      ],
      view: this.sheetNames().map((n) => [n, () => this.activateSheet(n)]),
      insert: [
        ['Add Constraint row', () => this.addListRow('constraint')],
        ['Add Dependency row', () => this.addListRow('dependency')],
        ['Add Assumption row', () => this.addListRow('assumption')],
        ['Add Risk row', () => this.addListRow('risk')]
      ],
      tools: [
        ['Generate WBS (GenWBS2)', () => this.generateWbs()],
        ['Protect Sheet', () => this.setProtect(true)],
        ['Unprotect Sheet', () => this.setProtect(false)]
      ],
      data: [
        ['Application-Data', () => this.goToSection('sec-app-details')],
        ['Project-Data', () => this.goToSection('sec-proj-summary')],
        ['Resource-Data', () => this.goToSection('sec-res-data')],
        ['Standards-Data', () => this.goToSection('sec-std-roles')]
      ],
      help: [
        ['About Key Artifact Generator', () => msgBox('Key Artifact Generator V1.0 (Web Edition)\nGenerates project key artifacts: Kick-Off, AIN, IPP, WBS for JIRA.\nBackend: Node.js + PostgreSQL')]
      ]
    };
    const dd = document.getElementById('menu-dropdowns');
    document.querySelectorAll('#menubar .menu-item').forEach((mi) => {
      mi.onclick = (e) => {
        dd.innerHTML = '';
        const items = menus[mi.dataset.menu] || [];
        const box = document.createElement('div');
        box.className = 'menu-dropdown';
        box.style.display = 'block';
        box.style.left = `${mi.getBoundingClientRect().left}px`;
        box.style.top = `${mi.getBoundingClientRect().bottom}px`;
        items.forEach(([label, fn]) => {
          const it = document.createElement('div');
          it.textContent = label;
          it.onclick = () => { dd.innerHTML = ''; fn(); };
          box.appendChild(it);
        });
        dd.appendChild(box);
        e.stopPropagation();
      };
    });
    document.addEventListener('click', () => { dd.innerHTML = ''; });
  },

  // AddConstraint_Click / AddEmptyRow
  async addListRow(kind) {
    const rows = this.data.lists.filter((l) => l.kind === kind);
    await API.post(`/projects/${this.projectId}/lists`, {
      kind, sno: rows.length + 1, description: ''
    });
    await this.reloadAll();
    this.goToSection(`sec-proj-${kind}s`);
  }
};

// App.init() is invoked from index.html after all sheet modules have registered.
