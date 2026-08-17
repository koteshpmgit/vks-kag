// "IPP-Application Information" sheet - Application Plan section of the Internal Project Plan
(function () {
  const sheet = {
    id: 'ippappinfo',
    name: 'IPP-Application Information',
    render(host, data) {
      const { application, hrplan, environments, stdTools, stdRoles, hardware, software } = data;
      let h = '';
      h += `<div class="slide-title">Application Plan</div>`;
      h += `<table class="grid">`;
      h += `<tr><th style="width:180px">Application Name:</th><td>${escHtml(application.app_name)}</td><th>IRN</th><td>${escHtml(application.irn_no)}</td></tr>`;
      h += `<tr><th>Front Office</th><td>${escHtml(application.front_office)}</td><th>Domain</th><td>${escHtml(application.domain)}</td></tr>`;
      h += `</table>`;

      const block = (title, body) => {
        h += `<div class="section-sub">${title}</div>`;
        h += `<div class="kv"><span class="v">${escHtml(body || '')}</span></div>`;
      };
      block('1.1 Application description', application.description);
      block('1.2 Acceptance Criteria', application.acceptance_criteria);
      block('1.3 Life Cycle', application.life_cycle);
      block('1.4 DCV', application.dcv);
      block('1.5 CVS', application.cvs);

      h += `<div class="section-sub">1.6 Project Environment</div>`;
      h += `<table class="grid"><tr><th>S.No</th><th>Environment</th><th>Server</th><th>Access</th></tr>`;
      environments.forEach((e, i) => {
        h += `<tr><td>${i + 1}</td><td>${escHtml(e.env_name)}</td><td>${escHtml(e.server_path)}</td><td>${escHtml(e.access_type)}</td></tr>`;
      });
      h += `</table>`;

      h += `<div class="section-sub">1.7 Tools, Methodologies and Techniques</div>`;
      h += `<table class="grid"><tr><th>S.No</th><th>Activity</th><th>standards/Techniques</th><th>Tool(s) planned/templates</th><th>Version No</th></tr>`;
      stdTools.forEach((t) => {
        h += `<tr><td>${t.sno ?? ''}</td><td>${escHtml(t.activity)}</td><td>${escHtml(t.standards)}</td><td>${escHtml(t.tools)}</td><td>${escHtml(t.version)}</td></tr>`;
      });
      h += `</table>`;

      h += `<div class="section-sub">1.8 Project Organization</div>`;
      h += `<div class="kv"><span class="v">${escHtml(application.org_chart_link || '')}</span></div>`;

      h += `<div class="section-sub">1.9 Roles &amp; Responsibilites</div>`;
      h += `<table class="grid"><tr><th>S.No</th><th>Role</th><th>Responsibility</th><th>Team</th></tr>`;
      stdRoles.forEach((r, i) => {
        const team = hrplan.filter((x) => x.role_acronym === r.role_acronym ||
          (r.role_acronym === 'Developers' && x.role_acronym === 'DEV') ||
          (r.role_acronym === 'Testers' && x.role_acronym === 'TSTE') ||
          (r.role_acronym === 'QAF' && x.role_acronym === 'PQAO'))
          .map((x) => x.resource_name).join(', ');
        h += `<tr><td>${i + 1}</td><td>${escHtml(r.role_acronym)}</td><td>${escHtml(r.responsibility)}</td><td>${escHtml(team)}</td></tr>`;
      });
      h += `</table>`;

      h += `<div class="section-sub">1.10 Resouce Plan</div>`;
      h += `<div class="section-sub" style="background:#6b93c4">1.10.1 Hardware</div>`;
      h += `<table class="grid"><tr><th>S.No</th><th>Hardware Description</th><th>Configuration/Specification</th><th>Quantity Required</th><th>Start Date</th><th>End date</th></tr>`;
      hardware.forEach((r) => {
        h += `<tr><td>${r.sno ?? ''}</td><td>${escHtml(r.description)}</td><td>${escHtml(r.spec)}</td><td class="num">${r.quantity ?? ''}</td><td>${fmtDate(r.start_date)}</td><td>${fmtDate(r.end_date)}</td></tr>`;
      });
      h += `</table>`;
      h += `<div class="section-sub" style="background:#6b93c4">1.10.2 Software</div>`;
      h += `<table class="grid"><tr><th>S.No</th><th>Software Description</th><th>Version</th><th>No. of Installations</th><th>Start Date</th><th>End Date</th></tr>`;
      software.forEach((r) => {
        h += `<tr><td>${r.sno ?? ''}</td><td>${escHtml(r.description)}</td><td>${escHtml(r.version)}</td><td class="num">${r.installations ?? ''}</td><td>${fmtDate(r.start_date)}</td><td>${fmtDate(r.end_date)}</td></tr>`;
      });
      h += `</table>`;
      host.innerHTML = h;
    }
  };

  App.registerSheet(sheet);
})();
