// "AIN" sheet - Application Initiation Note
(function () {
  const findRole = (hr, role) => hr.find((h) => h.role_acronym === role) || {};

  const sheet = {
    id: 'ain',
    name: 'AIN',
    render(host, data) {
      const { application, project, computed, hrplan } = data;
      let h = '';
      h += `<div class="slide-title">Application Initiation Note</div>`;
      h += `<table class="grid">`;
      [['Application Name', application.app_name],
       ['Front Office', application.front_office],
       ['Domain', application.domain],
       ['Scope', application.scope],
       ['Application Size', application.app_size_fp],
       ['Technology', application.technology]
      ].forEach(([k, v]) => {
        h += `<tr><th style="width:200px">${escHtml(k)}</th><td style="min-width:420px;white-space:pre-wrap">${escHtml(v ?? '')}</td></tr>`;
      });
      h += `</table>`;

      h += `<div class="section-sub">Key contacts</div>`;
      h += `<table class="grid"><tr><th>Name</th><th>Role</th><th>IPN</th></tr>`;
      ['VO', 'ODO', 'PO', 'DSI DM', 'DSI CM'].forEach((role) => {
        const r = findRole(hrplan, role);
        h += `<tr><td>${escHtml(r.resource_name || '')}</td><td>${escHtml(role)}</td><td>${escHtml(r.resource_ipn || '')}</td></tr>`;
      });
      h += `</table>`;

      h += `<div class="section-sub">Application Details</div>`;
      h += `<table class="grid"><tr><th>S.No</th><th>Project details</th><th>ODO</th><th>Project Owner</th><th>Project Type</th><th>Start Date</th><th>End Date</th></tr>`;
      h += `<tr><td>1</td><td>${escHtml(project.project_key)}</td><td>${escHtml(findRole(hrplan, 'ODO').resource_name || '')}</td><td>${escHtml(findRole(hrplan, 'PO').resource_name || '')}</td><td>${escHtml(project.project_type)}</td><td>${fmtDate(project.start_date)}</td><td>${fmtDate(computed.endDate)}</td></tr>`;
      h += `</table>`;
      host.innerHTML = h;
    }
  };

  App.registerSheet(sheet);
})();
