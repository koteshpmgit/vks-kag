// "Kick-Off" sheet - kick-off presentation generated from the Data Sheet
(function () {
  const findRole = (hr, role) => hr.find((h) => h.role_acronym === role) || {};

  function menuLink() {
    return `<span class="menu-link" onclick="App.goToSection('sec-app-details')">Menu</span>`;
  }

  const sheet = {
    id: 'kickoff',
    name: 'Kick-Off',
    render(host, data) {
      const { project, application, computed, hrplan, agenda, goals, hardware, software, lists, milestones } = data;
      const po = findRole(hrplan, 'PO');
      const byKind = (k) => lists.filter((l) => l.kind === k);
      const delFor = (name) => (milestones.find((m) => (m.name || '').trim() === name) || {}).deliverable || '';

      let h = '';
      h += `<div class="slide-title">Kick Off Presentation – ${escHtml(project.project_key)} ${menuLink()}</div>`;
      h += `<div class="kv"><span class="k">Prepared By :</span><span class="v">${escHtml(po.resource_name || '')}</span></div>`;
      h += `<div class="kv"><span class="k">Date             :</span><span class="v">${fmtDate(computed.kickOffDate)}</span></div>`;

      h += `<div class="slide-title">Agenda ${menuLink()}</div><table class="grid">`;
      agenda.forEach((a) => { h += `<tr><td class="rowhead">${a.sno}</td><td>${escHtml(a.topic)}</td></tr>`; });
      h += `</table>`;

      h += `<div class="slide-title">Project Details ${menuLink()}</div>`;
      [['Project Name                    :', project.project_key],
       ['Type of project                  :', project.project_type],
       ['Domain Name                   :', application.domain],
       ['Off Shore Domain Owner :', findRole(hrplan, 'ODO').resource_name],
       ['Vertical Owner                  :', findRole(hrplan, 'VO').resource_name],
       ['FO Vertical Owner            :', findRole(hrplan, 'DSI DM').resource_name]
      ].forEach(([k, v]) => { h += `<div class="kv"><span class="k">${escHtml(k)}</span><span class="v">${escHtml(v || '')}</span></div>`; });
      h += `<div class="kv"><span class="k">Description of the project :</span><span class="v">${escHtml(project.brief_desc || '')}</span></div>`;

      h += `<div class="slide-title">Project Details - Continued.. ${menuLink()}</div>`;
      h += `<div class="kv"><span class="k">Project Scope                    :</span><span class="v">${escHtml(project.scope || '')}</span></div>`;
      h += `<div class="kv"><span class="k">Project Duration                :</span><span class="v">Project Size: ${computed.totalEffMd} MD&nbsp;&nbsp;&nbsp;${escHtml(project.fp_count)} FP</span></div>`;
      h += `<div class="kv"><span class="k">Project Schedule:</span><span class="v">${fmtDate(project.start_date)} &nbsp;to&nbsp; ${fmtDate(computed.endDate)}</span></div>`;
      h += `<div class="kv"><span class="k">Technologies used            :</span><span class="v">${escHtml(project.technology || '')}</span></div>`;
      h += `<div class="kv"><span class="k">Tailoring Profile               :</span><span class="v">Please refer IPP</span></div>`;

      h += `<div class="slide-title">Project Details - Continued.. ${menuLink()}</div>`;
      h += `<div class="kv"><span class="k">Project Life Cycle             :</span><span class="v">${escHtml(project.life_cycle || '')}</span></div>`;
      h += `<div class="kv"><span class="k">Project Goals                     :</span></div>`;
      h += `<table class="grid"><tr><th>S.No</th><th>Metric Name</th><th>Frequency of collection</th><th>Target</th><th>Commitment</th><th>Source of Metrics</th><th>Storage Location</th></tr>`;
      goals.forEach((g) => {
        h += `<tr><td>${g.sno ?? ''}</td><td>${escHtml(g.metric_name)}</td><td>${escHtml(g.frequency)}</td><td>${escHtml(g.target)}</td><td>${escHtml(g.commitment)}</td><td>${escHtml(g.source)}</td><td>${escHtml(g.storage)}</td></tr>`;
      });
      h += `</table>`;

      h += `<div class="slide-title">Milestones &amp; Deliverables ${menuLink()}</div>`;
      h += `<table class="grid"><tr><th>S.No</th><th>Milestone</th><th>Start Date</th><th>End Date</th><th>Deliverable</th></tr>`;
      computed.milestones.forEach((m, i) => {
        h += `<tr><td>${i + 1}</td><td>${escHtml(m.name)}</td><td>${fmtDate(m.start)}</td><td>${fmtDate(m.end)}</td><td>${escHtml(delFor(m.name))}</td></tr>`;
      });
      h += `</table>`;

      h += `<div class="slide-title">Resource Requirements ${menuLink()}</div>`;
      h += `<div class="section-sub">Hardware Requirements:</div>`;
      h += `<table class="grid"><tr><th>S.No</th><th>Hardware Description</th><th>Configuration/Specification</th><th>Quantity Required</th><th>Start Date</th><th>End date</th></tr>`;
      hardware.forEach((r) => {
        h += `<tr><td>${r.sno ?? ''}</td><td>${escHtml(r.description)}</td><td>${escHtml(r.spec)}</td><td class="num">${r.quantity ?? ''}</td><td>${fmtDate(r.start_date)}</td><td>${fmtDate(r.end_date)}</td></tr>`;
      });
      h += `</table>`;
      h += `<div class="section-sub">Software Requirements:</div>`;
      h += `<table class="grid"><tr><th>S.No</th><th>Software Description</th><th>Version</th><th>No. of Installations</th><th>Start Date</th><th>End Date</th></tr>`;
      software.forEach((r) => {
        h += `<tr><td>${r.sno ?? ''}</td><td>${escHtml(r.description)}</td><td>${escHtml(r.version)}</td><td class="num">${r.installations ?? ''}</td><td>${fmtDate(r.start_date)}</td><td>${fmtDate(r.end_date)}</td></tr>`;
      });
      h += `</table>`;
      h += `<div class="section-sub">Human Resource Requirements:</div>`;
      h += `<div class="note">Refer to the Organisation chart</div>`;

      h += `<div class="slide-title">Organisation Chart ${menuLink()}</div>`;
      h += `<div class="note">${escHtml(application.org_chart_link || '')}</div>`;

      h += `<div class="slide-title">Risks/Issues &amp; Dependencies ${menuLink()}</div>`;
      const listBlock = (title, kind) => {
        h += `<div class="section-sub">${title}</div><table class="grid">`;
        byKind(kind).forEach((r) => { h += `<tr><td class="rowhead">${r.sno}</td><td>${escHtml(r.description)}</td></tr>`; });
        h += `</table>`;
      };
      listBlock('Risks and Issues:', 'risk');
      listBlock('Dependencies:', 'dependency');
      listBlock('Constraints:', 'constraint');
      listBlock('Assumptions:', 'assumption');

      h += `<div class="slide-title">Stakeholder's Involvement ${menuLink()}</div>`;
      h += `<table class="grid"><tr><th>S.No</th><th>Stakeholders</th><th>Role</th><th>Type of Involvement (Review/Approval/Sharing Information)</th><th>Frequency</th></tr>`;
      hrplan.forEach((s, i) => {
        h += `<tr><td>${i + 1}</td><td>${escHtml(s.resource_name)}</td><td>${escHtml(s.role_acronym)}</td><td></td><td></td></tr>`;
      });
      h += `</table>`;

      h += `<div class="slide-title">Others ${menuLink()}</div>`;
      h += `<div class="kv"><span class="v">${escHtml(project.other_info || '')}</span></div>`;
      h += `<div class="slide-title">Questions</div>`;
      h += `<div class="note">Thank You!</div>`;

      host.innerHTML = h;
    }
  };

  App.registerSheet(sheet);
})();
