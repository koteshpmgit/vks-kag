// Key Artifact Generator - Web App UI (header menu + left nav + single-page content)
// Same REST API and field/section definitions as the Modern UI; artifact previews
// reuse the classic sheet renderers via the App shim below. Navigation here always
// shows exactly one page at a time: the Home/welcome page, or one section's page,
// selected from the header menu or the left nav.

// ---- App shim so the classic sheet modules (js/sheets/*.js) can register ----
window.App = {
  sheets: [],
  registerSheet(s) { this.sheets.push(s); },
  get projectId() { return WebApp.projectId; },
  goToSection() { WebApp.closeModal(); WebApp.openSection('app', 'appDetails'); },
  generateWbs() { return WebApp.generateWbs(); },
  generateTimesheet() { return WebApp.generateTimesheet(); },
  openTimesheetModal() { return WebApp.openTimesheetModal(); },
  addWbsRow() { return WebApp.addWbsRow(); },
  editWbsRow(row) { return WebApp.editWbsRow(row); },
  deleteWbsRow(row) { return WebApp.deleteWbsRow(row); },
  activateSheet() {},
  reloadAll() { return WebApp.reload(); }
};

const WebApp = {
  projectId: null,
  data: {},
  currentPage: 'home',      // 'home' | 'section'
  activeGroup: null,
  activeSection: null,

  // ---------------- field/config definitions (same as every other layout) ----------------
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
      { key: 'fp_count', label: 'FP Count', type: 'number', min: 10, hint: 'Function Points must be at least 10 — 0 means nothing has been sized yet. Try a realistic estimate such as 10, 25 or 50.' },
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
    this.initSummaryPopup();
    this.initSettingsPopover();
    this.initBackgroundPopup();
    this.initVisualOptions();
    this.initSidebarToggle();
    this.initLayoutSwitch();

    const sel = document.getElementById('projectSelect');
    sel.onchange = async () => {
      this.projectId = Number(sel.value);
      await this.reload();
      this.buildNav();
      this.buildHeaderMenu();
      this.syncNavActive();
      if (this.currentPage === 'section') this.openSection(this.activeGroup, this.activeSection);
      // 'home' and 'summary' pages are already re-rendered by reload() above
    };

    document.getElementById('btnNewProject').onclick = () => NewProjectWizard.open();
    document.getElementById('btnGenWbs').onclick = () => this.generateWbs();
    document.getElementById('waHomeLink').onclick = () => this.showHome();
    document.getElementById('waBrandHome').onclick = () => this.showHome();
    document.getElementById('waSummaryLink').onclick = () => this.showSummary();

    await this.loadProjects();
    await this.reload();
    this.buildNav();
    this.buildHeaderMenu();
    this.showHome();
  },

  async loadProjects(selectProjectId) {
    const projects = await API.get('/projects');
    const sel = document.getElementById('projectSelect');
    sel.innerHTML = projects.map((p) => `<option value="${p.id}">${escHtml(p.project_key)}</option>`).join('');
    this.projectId = selectProjectId ? Number(selectProjectId) : (this.projectId || projects[0]?.id || null);
    if (this.projectId) sel.value = String(this.projectId);
  },

  // Burger button toggles the sidebar, persisted like the other layouts
  initSidebarToggle() {
    const burger = document.getElementById('btnBurger');
    if (localStorage.getItem('kagWaSidebar') === 'hidden') document.body.classList.add('wa-sidebar-hidden');
    if (burger) {
      burger.onclick = () => {
        const hidden = document.body.classList.toggle('wa-sidebar-hidden');
        localStorage.setItem('kagWaSidebar', hidden ? 'hidden' : 'shown');
      };
    }
  },

  // Header icon dropdown to jump straight to any of the other UI layouts
  initLayoutSwitch() {
    const item = document.getElementById('layoutSwitchWrap');
    const btn = document.getElementById('btnLayoutSwitch');
    const menu = document.getElementById('layoutSwitchMenu');
    if (!item || !btn || !menu) return;

    menu.querySelectorAll('a').forEach((a) => {
      a.classList.toggle('active', a.dataset.layout === '/webapp');
      a.onclick = () => { if (a.dataset.layout) location.href = a.dataset.layout; };
    });

    btn.onclick = (e) => {
      e.stopPropagation();
      const wasOpen = item.classList.contains('open');
      this.closeOtherPopovers();
      if (!wasOpen) item.classList.add('open');
      btn.setAttribute('aria-expanded', String(!wasOpen));
    };
  },

  // Project Summary lives in the header: the chart icon button toggles a popover panel
  // Hides every header popover except the one currently being opened, plus
  // any open header-menu group dropdown — keeps exactly one panel on screen.
  closeOtherPopovers(exceptId) {
    ['summaryPopover', 'settingsPopover', 'backgroundPopover'].forEach((id) => {
      if (id === exceptId) return;
      const el = document.getElementById(id);
      if (el) el.hidden = true;
    });
    this.closeHeaderMenus();
  },

  initSummaryPopup() {
    const btn = document.getElementById('btnSummary');
    const pop = document.getElementById('summaryPopover');
    if (!btn || !pop) return;
    const close = () => { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    btn.onclick = (e) => {
      e.stopPropagation();
      this.closeOtherPopovers('summaryPopover');
      pop.hidden = !pop.hidden;
      btn.setAttribute('aria-expanded', String(!pop.hidden));
    };
    pop.onclick = (e) => e.stopPropagation();
    document.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  },

  // Settings gear button toggles the Display Settings popover
  // (Glass / 3D / Depth / Theme / Custom accent color / Density)
  initSettingsPopover() {
    const btn = document.getElementById('btnSettings');
    const pop = document.getElementById('settingsPopover');
    if (!btn || !pop) return;
    const close = () => { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    btn.onclick = (e) => {
      e.stopPropagation();
      this.closeOtherPopovers('settingsPopover');
      pop.hidden = !pop.hidden;
      btn.setAttribute('aria-expanded', String(!pop.hidden));
    };
    pop.onclick = (e) => e.stopPropagation();
    document.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  },

  // ---------------- Background customization (color / image / video) ----------------
  BG_SWATCHES: [
    '#0f172a', '#0891b2', '#0f766e', '#7c3aed', '#be123c', '#ea580c',
    'linear-gradient(135deg,#0f172a,#0891b2)', 'linear-gradient(135deg,#7c3aed,#0891b2)',
    'linear-gradient(135deg,#0f766e,#22c55e)', 'linear-gradient(135deg,#be123c,#ea580c)',
    'linear-gradient(135deg,#1e293b,#334155)', 'linear-gradient(120deg,#0ea5e9,#22d3ee,#a7f3d0)'
  ],

  // Background icon button toggles a Color/Image/Video popover. Color and
  // Image URL/upload persist to localStorage (data URLs for uploaded images
  // are small enough to fit); an uploaded video only gets an Object URL,
  // which browsers invalidate on reload, so that one is session-only —
  // a video URL persists fine since it's just a string.
  initBackgroundPopup() {
    const btn = document.getElementById('btnBackground');
    const pop = document.getElementById('backgroundPopover');
    if (!btn || !pop) return;
    const close = () => { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    btn.onclick = (e) => {
      e.stopPropagation();
      this.closeOtherPopovers('backgroundPopover');
      pop.hidden = !pop.hidden;
      btn.setAttribute('aria-expanded', String(!pop.hidden));
    };
    pop.onclick = (e) => e.stopPropagation();
    document.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    pop.querySelectorAll('.bg-tab').forEach((tab) => {
      tab.onclick = () => {
        pop.querySelectorAll('.bg-tab').forEach((t) => t.classList.toggle('active', t === tab));
        pop.querySelectorAll('.bg-panel').forEach((p) => { p.hidden = p.dataset.bgPanel !== tab.dataset.bgTab; });
      };
    });

    const swatchHost = document.getElementById('bgSwatches');
    swatchHost.innerHTML = this.BG_SWATCHES.map((v) =>
      `<button type="button" class="bg-swatch" data-swatch="${escHtml(v)}" style="background:${v}" title="Use this color"></button>`).join('');
    swatchHost.querySelectorAll('.bg-swatch').forEach((el) => {
      el.onclick = () => {
        this.applyAndSaveBackground({ type: 'color', value: el.dataset.swatch });
        swatchHost.querySelectorAll('.bg-swatch').forEach((s) => s.classList.toggle('active', s === el));
      };
    });

    document.getElementById('bgColorInput').oninput = (e) => this.applyAndSaveBackground({ type: 'color', value: e.target.value });

    document.getElementById('bgImageFile').onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => this.applyAndSaveBackground({ type: 'image', value: reader.result });
      reader.readAsDataURL(file);
    };

    document.getElementById('bgVideoFile').onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      this.applyBackground({ type: 'video', value: URL.createObjectURL(file) }); // session-only, see note above
    };

    document.getElementById('btnBackgroundApply').onclick = () => {
      const activeTab = pop.querySelector('.bg-tab.active').dataset.bgTab;
      if (activeTab === 'color') {
        this.applyAndSaveBackground({ type: 'color', value: document.getElementById('bgColorInput').value });
      } else if (activeTab === 'image') {
        const url = document.getElementById('bgImageUrl').value.trim();
        if (url) this.applyAndSaveBackground({ type: 'image', value: url });
      } else if (activeTab === 'video') {
        const url = document.getElementById('bgVideoUrl').value.trim();
        if (url) this.applyAndSaveBackground({ type: 'video', value: url });
      }
    };

    document.getElementById('btnBackgroundReset').onclick = () => {
      this.applyAndSaveBackground({ type: 'default' });
      document.getElementById('bgImageUrl').value = '';
      document.getElementById('bgVideoUrl').value = '';
      swatchHost.querySelectorAll('.bg-swatch').forEach((s) => s.classList.remove('active'));
    };

    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('kagWaBackground') || 'null'); } catch { saved = null; }
    if (saved) this.applyBackground(saved);
  },

  applyAndSaveBackground(state) {
    this.applyBackground(state);
    try {
      if (state.type === 'default') localStorage.removeItem('kagWaBackground');
      else localStorage.setItem('kagWaBackground', JSON.stringify(state));
    } catch (e) {
      this.toast('Background applied, but it’s too large to remember after a reload', true);
    }
  },

  applyBackground(state) {
    const oldVideo = document.getElementById('bgVideoEl');
    if (oldVideo) oldVideo.remove();
    const html = document.documentElement;
    const body = document.body;

    if (!state || state.type === 'default') {
      html.style.background = '';
      body.style.background = '';
      body.classList.remove('bg-is-light', 'bg-is-dark');
      return;
    }
    if (state.type === 'color') {
      html.style.background = state.value;
      body.style.background = state.value;
      this.setBackgroundContrast(this.backgroundIsLight(state.value));
    } else if (state.type === 'image') {
      const bg = `center / cover fixed no-repeat url("${state.value}")`;
      html.style.background = bg;
      body.style.background = bg;
      this.setBackgroundContrast(false); // safe fallback until the image can be sampled
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => this.sampleBackgroundContrast(img);
      img.src = state.value;
    } else if (state.type === 'video') {
      html.style.background = '#000';
      body.style.background = '#000';
      this.setBackgroundContrast(false);
      const v = document.createElement('video');
      v.id = 'bgVideoEl';
      v.autoplay = true;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.src = state.value;
      v.addEventListener('loadeddata', () => this.sampleBackgroundContrast(v), { once: true });
      body.prepend(v);
    }
  },

  // Pick a readable foreground automatically. Gradients are classified from
  // the average of their colour stops; photos/video are sampled on a tiny
  // canvas when browser security permits it.
  backgroundIsLight(value) {
    const colors = String(value).match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi) || [];
    if (!colors.length) return false;
    const luminance = colors.reduce((sum, color) => {
      let rgb;
      if (color[0] === '#') {
        let hex = color.slice(1);
        if (hex.length === 3 || hex.length === 4) hex = hex.slice(0, 3).split('').map((c) => c + c).join('');
        rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
      } else {
        rgb = (color.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      }
      const linear = rgb.map((c) => {
        const n = c / 255;
        return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4;
      });
      return sum + .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
    }, 0) / colors.length;
    return luminance > .42;
  },

  setBackgroundContrast(isLight) {
    document.body.classList.toggle('bg-is-light', !!isLight);
    document.body.classList.toggle('bg-is-dark', !isLight);
  },

  sampleBackgroundContrast(media) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 24; canvas.height = 24;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(media, 0, 0, canvas.width, canvas.height);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let total = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        total += (.2126 * pixels[i] + .7152 * pixels[i + 1] + .0722 * pixels[i + 2]) / 255;
      }
      this.setBackgroundContrast(total / (pixels.length / 4) > .57);
    } catch (_) {
      // Cross-origin media may forbid pixel access; the dark fallback remains.
    }
  },

  // Wires the Glass / 3D / Depth / Theme / Custom accent / Density controls,
  // persisted in localStorage. Custom accent goes beyond the Modern UI's
  // fixed theme presets: any hex color can be picked and is used to derive
  // a full accent/gradient palette, overriding the selected preset.
  initVisualOptions() {
    const glass = document.getElementById('optGlass');
    const depth3d = document.getElementById('opt3d');
    const depth = document.getElementById('optDepth');
    const color = document.getElementById('optColor');
    const customColor = document.getElementById('optCustomColor');
    const density = document.getElementById('optDensity');
    const resetBtn = document.getElementById('btnResetDisplay');
    if (!glass || !depth3d || !depth || !color) return;

    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem('kagWaVisualOptions') || '{}');
    } catch {
      saved = {};
    }
    glass.checked = saved.glass !== false;
    depth3d.checked = saved.depth3d !== false;
    depth.value = saved.depth ?? 6;
    color.value = saved.color || 'ocean';
    if (customColor) customColor.value = saved.customColor || '#0891b2';
    if (density) density.value = saved.density || 'comfortable';
    let customActive = !!saved.customActive;

    const apply = () => {
      document.body.classList.toggle('fx-glass', glass.checked);
      document.body.classList.toggle('fx-3d', depth3d.checked);
      document.body.dataset.theme = color.value;
      document.documentElement.style.setProperty('--depth-scale', String(Number(depth.value) / 10));
      if (density) document.body.classList.toggle('wa-compact', density.value === 'compact');
      this.applyCustomAccent(customActive && customColor ? customColor.value : null);
      localStorage.setItem('kagWaVisualOptions', JSON.stringify({
        glass: glass.checked,
        depth3d: depth3d.checked,
        depth: depth.value,
        color: color.value,
        customColor: customColor ? customColor.value : undefined,
        customActive,
        density: density ? density.value : undefined
      }));
    };

    [glass, depth3d, depth, density].forEach((input) => input && input.addEventListener('input', apply));
    color.addEventListener('input', () => { customActive = false; apply(); });
    if (customColor) customColor.addEventListener('input', () => { customActive = true; apply(); });
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        glass.checked = true; depth3d.checked = true; depth.value = 6; color.value = 'ocean';
        if (customColor) customColor.value = '#0891b2';
        if (density) density.value = 'comfortable';
        customActive = false;
        apply();
        this.toast('Display settings reset');
      });
    }
    apply();
  },

  // Derives a full accent palette (dark shade, soft tint, gradients) from any
  // custom hex color, and applies it as inline overrides on <body> so it wins
  // over the selected theme preset. Pass null to clear the override.
  applyCustomAccent(hex) {
    const body = document.body;
    const props = ['--accent', '--accent-dark', '--accent-soft', '--sheet-head', '--cool-gradient', '--panel-gradient'];
    if (!hex) { props.forEach((p) => body.style.removeProperty(p)); return; }
    const dark = this.mixColor(hex, '#000000', 0.35);
    const soft = this.mixColor(hex, '#ffffff', 0.92);
    const sheetHead = this.mixColor(hex, '#ffffff', 0.95);
    const panelTint = this.mixColor(hex, '#ffffff', 0.96);
    body.style.setProperty('--accent', hex);
    body.style.setProperty('--accent-dark', dark);
    body.style.setProperty('--accent-soft', soft);
    body.style.setProperty('--sheet-head', sheetHead);
    body.style.setProperty('--cool-gradient', `linear-gradient(135deg, #0f172a 0%, ${dark} 48%, ${hex} 100%)`);
    body.style.setProperty('--panel-gradient', `linear-gradient(145deg, rgba(255,255,255,.98), ${panelTint})`);
  },

  mixColor(hex, mixHex, weight) {
    const a = this.hexToRgb(hex);
    const b = this.hexToRgb(mixHex);
    const r = Math.round(a.r + (b.r - a.r) * weight);
    const g = Math.round(a.g + (b.g - a.g) * weight);
    const bl = Math.round(a.b + (b.b - a.b) * weight);
    return `rgb(${r}, ${g}, ${bl})`;
  },

  hexToRgb(hex) {
    const h = (hex || '#0891b2').replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const n = parseInt(full, 16) || 0;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
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
    const welcomeName = document.getElementById('waWelcomeName');
    if (welcomeName) welcomeName.textContent = project.project_key ? `, ${project.project_key}` : '';
    this.renderSummary();
    this.updateNavCompletion();
    if (this.currentPage === 'home' || this.currentPage === 'summary') this.renderPage();
  },

  // Called after any save/add/edit/delete so whichever view is showing that
  // data (the normal section page, or a step inside the New Project Wizard)
  // repaints with the fresh rows. Wizard takes priority since its content
  // lives outside #contentBody while it's open.
  refreshActiveView() {
    if (window.NewProjectWizard && NewProjectWizard.isOpen) { NewProjectWizard.refreshStep(); return; }
    if (this.currentPage === 'section') this.openSection(this.activeGroup, this.activeSection);
  },

  // Builds the Project Summary markup (completion, effort/hours/FTE/WBS widgets,
  // phase/milestone progress, key dates) shared by the header popover, the Home
  // page and the dedicated Project Summary page.
  summaryPanelHtml() {
    const c = this.data.computed;
    const p = this.data.project;
    const milestones = c.milestones || [];
    const completedDeliverables = (this.data.milestones || []).filter((m) => m.deliverable).length;
    const milestonePct = milestones.length ? Math.round((completedDeliverables / milestones.length) * 100) : 0;
    const phasePct = (this.data.phases || []).reduce((s, phase) => s + Number(phase.pct || 0), 0);
    const resourceLoad = (this.data.hrplan || []).reduce((s, row) => s + Number(row.contribution_pct || 0), 0);
    const oc = this.overallCompletion();
    const ocCls = oc.pct >= 100 ? 'p100' : oc.pct >= 50 ? 'p50' : oc.pct > 0 ? 'plow' : 'p0';
    return `
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
  },

  // wires the "click a section row to jump there" behaviour, wherever the panel is shown
  wireSummaryRows(container, { closePopover, closeModal } = {}) {
    container.querySelectorAll('.sec-comp-row').forEach((row) => {
      row.onclick = () => {
        if (closeModal) this.closeModal();
        if (closePopover) {
          const pop = document.getElementById('summaryPopover');
          if (pop) pop.hidden = true;
        }
        this.openSection(row.dataset.group, row.dataset.sec);
      };
    });
  },

  renderSummary() {
    const headKey = document.getElementById('summaryHeadKey');
    if (headKey) headKey.textContent = this.data.project.project_key || '';
    const summaryBody = document.getElementById('summaryBody');
    summaryBody.innerHTML = this.summaryPanelHtml();
    this.wireSummaryRows(summaryBody, { closePopover: true });
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

  // ---------------- Key Sections (groups) — same catalogue as the Modern UI ----------------
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

  // ---------------- navigation: icon-only header menu + left nav ----------------
  // Home, Project Summary and each group are plain icon buttons — no visible
  // text label — so the row stays narrow enough to keep the header a single
  // thin line even with five groups. Each group icon opens a small dropdown
  // listing that group's sections; Home/Summary navigate directly. A single
  // hamburger-behind-everything menu was tried and dropped: with the sidebar
  // toggle also using a hamburger glyph, two burger icons in one header read
  // as confusing/duplicated controls.
  buildHeaderMenu() {
    const nav = document.getElementById('waHeaderMenu');
    nav.innerHTML = `<button class="icon-btn" id="waMenuHome" title="Home" aria-label="Home">&#127968;</button>` +
      `<button class="icon-btn" id="waMenuSummary" title="Project Summary" aria-label="Project Summary">&#128202;</button>` +
      this.groups.map((g) => `
        <div class="wa-menu-item" data-group="${g.id}">
          <button class="icon-btn" data-group-btn="${g.id}" title="${escHtml(g.title)}" aria-label="${escHtml(g.title)}">${g.icon}</button>
          <div class="wa-menu-dropdown">
            ${g.sections.map((s) => `<a data-group="${g.id}" data-section="${s}">${escHtml(this.sectionTitles[s])}</a>`).join('')}
          </div>
        </div>`).join('');
    document.getElementById('waMenuHome').onclick = () => { this.showHome(); this.closeHeaderMenus(); };
    document.getElementById('waMenuSummary').onclick = () => { this.showSummary(); this.closeHeaderMenus(); };
    nav.querySelectorAll('.wa-menu-dropdown a').forEach((a) => {
      a.onclick = () => { this.openSection(a.dataset.group, a.dataset.section); this.closeHeaderMenus(); };
    });
    nav.querySelectorAll('[data-group-btn]').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const item = btn.closest('.wa-menu-item');
        const wasOpen = item.classList.contains('open');
        this.closeOtherPopovers();
        if (!wasOpen) item.classList.add('open');
      };
    });
    document.addEventListener('click', () => this.closeHeaderMenus());
  },

  closeHeaderMenus() {
    document.querySelectorAll('.wa-menu-item.open').forEach((el) => {
      el.classList.remove('open');
      const trigger = el.querySelector('[aria-expanded]');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
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
      el.onclick = () => this.openSection(el.dataset.group);
    });
    nav.querySelectorAll('.nav-items a').forEach((a) => {
      a.onclick = () => this.openSection(a.dataset.group, a.dataset.section);
    });
    this.updateNavCompletion();
  },

  // refresh the % chips on the sidebar nav (group headers + section links)
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

  // keep the left nav, header menu and Home link in sync with the page actually shown
  syncNavActive() {
    document.querySelectorAll('.nav-group').forEach((el) =>
      el.classList.toggle('open', this.currentPage === 'section' && el.id === `navg-${this.activeGroup}`));
    document.querySelectorAll('.nav-items a').forEach((a) =>
      a.classList.toggle('active', this.currentPage === 'section' && a.dataset.group === this.activeGroup && a.dataset.section === this.activeSection));
    // scoped to the header's Key Section menu specifically — the Layout
    // switch dropdown reuses the same .wa-menu-dropdown/.wa-menu-item classes
    // for styling but tracks a different thing (which UI, not which section)
    document.querySelectorAll('#waHeaderMenu .wa-menu-dropdown a').forEach((a) =>
      a.classList.toggle('active', this.currentPage === 'section' && a.dataset.group === this.activeGroup && a.dataset.section === this.activeSection));
    document.querySelectorAll('#waHeaderMenu .wa-menu-item').forEach((el) =>
      el.classList.toggle('current', this.currentPage === 'section' && el.dataset.group === this.activeGroup));
    const homeLink = document.getElementById('waHomeLink');
    if (homeLink) homeLink.classList.toggle('active', this.currentPage === 'home');
    const menuHome = document.getElementById('waMenuHome');
    if (menuHome) menuHome.classList.toggle('active', this.currentPage === 'home');
    const summaryLink = document.getElementById('waSummaryLink');
    if (summaryLink) summaryLink.classList.toggle('active', this.currentPage === 'summary');
    const menuSummary = document.getElementById('waMenuSummary');
    if (menuSummary) menuSummary.classList.toggle('active', this.currentPage === 'summary');
  },

  // ---------------- single-page routing: exactly one page visible at a time ----------------
  showHome() {
    this.currentPage = 'home';
    this.activeGroup = null;
    this.activeSection = null;
    this.syncNavActive();
    this.renderPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  showSummary() {
    this.currentPage = 'summary';
    this.activeGroup = null;
    this.activeSection = null;
    this.syncNavActive();
    this.renderPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  openSection(groupId, focusSection) {
    const group = this.groups.find((g) => g.id === groupId);
    if (!group) return;
    const sec = (focusSection && group.sections.includes(focusSection)) ? focusSection : group.sections[0];
    this.currentPage = 'section';
    this.activeGroup = groupId;
    this.activeSection = sec;
    this.syncNavActive();
    this.renderPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  renderPage() {
    const body = document.getElementById('contentBody');
    body.innerHTML = '';
    document.body.classList.toggle('wa-home-page', this.currentPage !== 'summary' && this.currentPage !== 'section');
    if (this.currentPage === 'summary') {
      document.getElementById('contentTitle').textContent = 'Project Summary';
      document.getElementById('contentHint').textContent = 'Completion, effort and key dates for the active project';
      this.renderSummaryPage(body);
      return;
    }
    if (this.currentPage !== 'section') {
      document.getElementById('contentTitle').textContent = 'Welcome';
      document.getElementById('contentHint').textContent = 'Pick a Key Section to get started';
      this.renderHome(body);
      return;
    }
    const sec = this.activeSection;
    document.getElementById('contentTitle').textContent = this.sectionTitles[sec] || '';
    document.getElementById('contentHint').textContent = this.sectionDescriptions[sec] || '';
    if (sec === 'artifacts') { this.renderArtifactCards(body); return; }
    this.renderSection(sec, body);
  },

  // Project Summary as its own single page (reachable from the Home link's
  // sibling "Project Summary" entry in the sidebar and header menu)
  renderSummaryPage(host) {
    const panel = document.createElement('div');
    panel.className = 'summary-card wa-summary-page';
    panel.innerHTML = this.summaryPanelHtml();
    host.appendChild(panel);
    this.wireSummaryRows(panel);
  },

  // ---------------- Home / welcome page ----------------
  renderHome(host) {
    // Project Summary is the first section on the Home page
    const summarySection = document.createElement('div');
    summarySection.className = 'wa-home-section';
    summarySection.innerHTML = `<h3 class="wa-home-section-title">&#128202; Project Summary</h3>`;
    const summaryPanel = document.createElement('div');
    summaryPanel.className = 'summary-card wa-summary-panel';
    summaryPanel.innerHTML = this.summaryPanelHtml();
    summarySection.appendChild(summaryPanel);
    host.appendChild(summarySection);
    this.wireSummaryRows(summaryPanel);

    const sectionsHeading = document.createElement('h3');
    sectionsHeading.className = 'wa-home-section-title';
    sectionsHeading.textContent = 'Key Sections';
    host.appendChild(sectionsHeading);

    const grid = document.createElement('div');
    grid.className = 'wa-home-grid';
    this.groups.forEach((g) => {
      const card = document.createElement('div');
      card.className = 'wa-home-card';
      let progressHtml = '<small>Preview &amp; download</small>';
      if (g.id !== 'art') {
        let filled = 0, total = 0;
        g.sections.forEach((sec) => {
          const sc = this.sectionCompletion(sec);
          if (sc) { filled += sc.filled; total += sc.total; }
        });
        const pct = total ? Math.round((filled / total) * 100) : 0;
        progressHtml = `<div class="progress-track"><span style="width:${Math.min(pct, 100)}%"></span></div><small>${pct}% complete</small>`;
      }
      card.innerHTML = `<div class="icon">${g.icon}</div><h4>${escHtml(g.title)}</h4>
        <p>${g.sections.length} section${g.sections.length === 1 ? '' : 's'}</p>
        ${progressHtml}`;
      card.onclick = () => this.openSection(g.id);
      grid.appendChild(card);
    });
    host.appendChild(grid);
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

  // ---------------- content: exactly one section rendered per page ----------------
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

  // Checks required/number-range rules declared on field defs (min/max/required).
  // Returns a list of human-readable error strings (empty when valid).
  validateObjectFields(fields, obj) {
    const errs = [];
    fields.forEach((f) => {
      const v = obj[f.key];
      const empty = v === null || v === undefined || String(v).trim() === '';
      if (f.required && empty) { errs.push(`${f.label} is required.`); return; }
      if (f.type === 'number' && !empty) {
        const n = Number(v);
        if (Number.isNaN(n)) { errs.push(`${f.label} must be a number.`); return; }
        if (f.min !== undefined && n < f.min) errs.push(f.hint || `${f.label} must be at least ${f.min}.`);
        if (f.max !== undefined && n > f.max) errs.push(f.hint || `${f.label} must be at most ${f.max}.`);
      }
    });
    return errs;
  },

  // object form (application / project)
  renderObjectForm(host, obj, fields, saver) {
    const errBox = document.createElement('div');
    errBox.className = 'form-errors';
    errBox.hidden = true;
    host.appendChild(errBox);

    const form = document.createElement('div');
    form.className = 'form-grid';
    fields.forEach((f) => {
      const label = document.createElement('label');
      label.className = 'editable-field' + ((f.full || f.type === 'textarea') ? ' full' : '');
      label.innerHTML = `<span>${escHtml(f.label)}${f.min !== undefined ? ` <i class="field-hint-inline">(min ${f.min})</i>` : ''}</span>`;
      const input = f.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
      if (f.type === 'textarea') input.rows = 3;
      else input.type = f.type || 'text';
      if (f.type === 'number' && f.min !== undefined) input.min = String(f.min);
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
      const errs = this.validateObjectFields(fields, obj);
      if (errs.length) {
        errBox.hidden = false;
        errBox.innerHTML = errs.map((e) => `<div>&#9888; ${escHtml(e)}</div>`).join('');
        // long forms can have the Save button well below the fold — without
        // this the alert renders off-screen and looks like nothing happened
        errBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      errBox.hidden = true;
      try {
        await saver();
        await this.reload();
        this.toast('Saved — computed values recalculated');
        this.refreshActiveView();
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
      await this.reload();
      this.refreshActiveView();
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
        await this.reload();
        this.refreshActiveView();
        this.toast('Row updated');
      });
      const del = document.createElement('button');
      del.className = 'act-btn danger';
      del.innerHTML = '&#128465;';
      del.title = 'Delete row';
      del.setAttribute('aria-label', 'Delete row');
      del.onclick = () => this.confirm('Delete this row?', async () => {
        await API.del(`${base}/${row.id}`);
        await this.reload();
        this.refreshActiveView();
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
        await this.reload(); this.refreshActiveView();
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
          await this.reload(); this.refreshActiveView();
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
      if (this.currentPage === 'section' && this.activeGroup === 'art') this.openSection('art');
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
