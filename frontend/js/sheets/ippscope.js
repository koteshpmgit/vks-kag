// "IPP-Scope Management" sheet
(function () {
  const sheet = {
    id: 'ippscope',
    name: 'IPP-Scope Management',
    render(host, data) {
      const { project, computed, lists, hrplan, training, milestones } = data;
      const byKind = (k) => lists.filter((l) => l.kind === k);
      const delFor = (name) => (milestones.find((m) => (m.name || '').trim() === name) || {}).deliverable || '';
      let h = '';
      h += `<div class="slide-title">${escHtml(project.project_type)}-${escHtml(project.project_key)}</div>`;

      h += `<div class="section-sub">1.Scope</div>`;
      h += `<div class="kv"><span class="v">${escHtml(project.scope || '')}</span></div>`;

      const listBlock = (title, kind, colLabel) => {
        h += `<div class="section-sub">${title}</div>`;
        h += `<table class="grid"><tr><th>S.No</th><th>${colLabel}</th></tr>`;
        byKind(kind).forEach((r) => { h += `<tr><td>${r.sno}</td><td>${escHtml(r.description)}</td></tr>`; });
        h += `</table>`;
      };
      listBlock('2.Constraints', 'constraint', 'Constraints');
      listBlock('3.Dependencies', 'dependency', 'Dependencies');
      listBlock('4.Assumptions', 'assumption', 'Assumptions');

      h += `<div class="section-sub">5.Project phases, modules and deliverables</div>`;
      h += `<table class="grid"><tr><th>S.No</th><th>Project Modules/Phases</th><th>Deliverables</th><th>Planned Start date</th><th>Planned End date</th><th>Delivery date</th></tr>`;
      computed.milestones.forEach((m, i) => {
        h += `<tr><td>${i + 1}</td><td>${escHtml(m.name)}</td><td>${escHtml(delFor(m.name))}</td><td>${fmtDate(m.start)}</td><td>${fmtDate(m.end)}</td><td>${fmtDate(m.end)}</td></tr>`;
      });
      h += `</table>`;

      h += `<div class="section-sub">6.Human resource plan</div>`;
      h += `<table class="grid"><tr><th>S.No</th><th>Name of the Resource</th><th>Role</th><th>% Contribution</th><th>Start Date</th><th>End Date</th></tr>`;
      hrplan.forEach((r, i) => {
        h += `<tr><td>${i + 1}</td><td>${escHtml(r.resource_name)}</td><td>${escHtml(r.role_acronym)}</td><td class="num">${r.contribution_pct ?? 0}%</td><td>${fmtDate(r.start_date)}</td><td>${fmtDate(r.end_date)}</td></tr>`;
      });
      h += `</table>`;

      h += `<div class="section-sub">7.Training Plan</div>`;
      h += `<table class="grid"><tr><th>S.No</th><th>Name of training</th><th>Type of training</th><th>Praticipants Name/Profile</th><th>Planned start date</th><th>Planned End date</th></tr>`;
      training.forEach((t) => {
        h += `<tr><td>${t.sno ?? ''}</td><td>${escHtml(t.name)}</td><td>${escHtml(t.train_type)}</td><td>${escHtml(t.participants)}</td><td>${fmtDate(t.start_date)}</td><td>${fmtDate(t.end_date)}</td></tr>`;
      });
      h += `</table>`;

      const sp = project.shared_folder_path || '';
      const pathBlock = (title, sub) => {
        h += `<div class="section-sub">${title}</div>`;
        h += `<div class="kv"><span class="v">${escHtml(sp + sub)}</span></div>`;
      };
      pathBlock('8.WBS', '02.PLANS\\2.2 WBS');
      pathBlock('9.Estimation report', '03.ESTIMATION\\3.1 Estimation Report');
      pathBlock('10.Test plan', '09.TESTING\\9.1 TEST PLANS');
      pathBlock('11.FDA', '02.PLANS\\2.7 FDA');
      host.innerHTML = h;
    }
  };

  App.registerSheet(sheet);
})();
