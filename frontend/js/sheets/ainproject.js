// "AIN-<ProjectName>" sheet - Project Initiation Note (the workbook renamed
// this sheet on activation:  Sheet11.Name = "AIN-" + ProjectName)
(function () {
  const findRole = (hr, role) => hr.find((h) => h.role_acronym === role) || {};

  const sheet = {
    id: 'ainproject',
    name: 'AIN-Project',
    render(host, data) {
      const { project, application, computed, hrplan, docs, modules } = data;
      const mod = modules[0] || {};
      let h = '';
      h += `<div class="slide-title">${escHtml(project.project_key)} Initiation Note</div>`;

      h += `<div class="section-sub">Project Overview</div><table class="grid">`;
      [['Project Name', project.project_key],
       ['Project ID', application.irn_no],
       ['Project Type', project.project_type],
       ['Brief Description of the Project', project.brief_desc],
       ['Scope of the Project', project.scope],
       ['Technology Involved', project.technology]
      ].forEach(([k, v]) => {
        h += `<tr><th style="width:240px">${escHtml(k)}</th><td style="min-width:460px;white-space:pre-wrap">${escHtml(v ?? '')}</td></tr>`;
      });
      h += `</table>`;

      h += `<div class="section-sub">Estimation</div><table class="grid">`;
      h += `<tr><th style="width:240px">Project Schedule</th><td>${fmtDate(project.start_date)}</td><td>to</td><td>${fmtDate(computed.endDate)}</td></tr>`;
      h += `<tr><th>Project Size (In FPs)</th><td colspan="3">${escHtml(project.fp_count)}</td></tr>`;
      h += `<tr><th>Project Effort (In Person days)</th><td colspan="3">${computed.totalEffMd}</td></tr>`;
      h += `</table>`;

      h += `<div class="section-sub">Key Contacts</div>`;
      h += `<table class="grid"><tr><th>ISDC contacts:</th><th>IPN</th><th>Phone</th></tr>`;
      ['PO', 'ODO', 'VO', 'DO'].forEach((role) => {
        const r = findRole(hrplan, role);
        if (r.resource_name) h += `<tr><td>${escHtml(r.resource_name)}</td><td>${escHtml(r.resource_ipn || '')}</td><td></td></tr>`;
      });
      h += `<tr><th>FO contacts:</th><th></th><th></th></tr>`;
      ['DSI AM', 'DSI DM'].forEach((role) => {
        const r = findRole(hrplan, role);
        if (r.resource_name) h += `<tr><td>${escHtml(r.resource_name)}</td><td>${escHtml(r.resource_ipn || '')}</td><td></td></tr>`;
      });
      h += `</table>`;

      h += `<div class="section-sub">Stakeholder Information</div>`;
      h += `<table class="grid"><tr><th>Stakeholder Name</th><th>Role</th><th>IPN</th><th>Phone</th></tr>`;
      ['PO', 'ODO', 'VO', 'DSI DM', 'DSI CM'].forEach((role) => {
        const r = findRole(hrplan, role);
        if (r.resource_name) h += `<tr><td>${escHtml(r.resource_name)}</td><td>${escHtml(role)}</td><td>${escHtml(r.resource_ipn || '')}</td><td></td></tr>`;
      });
      h += `</table>`;

      h += `<div class="section-sub">Milestone Information</div>`;
      h += `<table class="grid"><tr><th>Milestone</th><th>Start Date</th><th>End Date</th><th>Modules List</th></tr>`;
      computed.milestones.filter((m) => m.name !== 'Go - Live').forEach((m) => {
        h += `<tr><td>${escHtml(m.name)}</td><td>${fmtDate(m.start)}</td><td>${fmtDate(m.end)}</td><td>${escHtml(mod.name || project.project_key)}</td></tr>`;
      });
      h += `</table>`;

      h += `<div class="section-sub">Resource Requirement</div><table class="grid">`;
      h += `<tr><th style="width:240px">Software Requirements</th><td>${escHtml(project.software_req || '')}</td></tr>`;
      h += `<tr><th>Hardware Requirements</th><td>${escHtml(project.hardware_req || '')}</td></tr>`;
      h += `<tr><th>Profile/ Skill Required</th><td>${escHtml(mod.name || '')}</td></tr>`;
      if (mod.dev_res) h += `<tr><th></th><td>${escHtml(mod.dev_res)}</td></tr>`;
      if (mod.tl_res) h += `<tr><th></th><td>${escHtml(mod.tl_res)}</td></tr>`;
      if (mod.testers) h += `<tr><th></th><td>${escHtml(mod.testers)}</td></tr>`;
      h += `</table>`;

      h += `<div class="section-sub">Quality Objectives</div>`;
      h += `<div class="kv"><span class="v">${escHtml(project.quality_objective || '')}</span></div>`;

      h += `<div class="section-sub">Items handed over to Project Owner</div>`;
      h += `<table class="grid"><tr><th>Document/Item Name</th><th>Version No./Specifications</th><th>Hard copy/ Soft Copy</th></tr>`;
      docs.forEach((d) => {
        h += `<tr><td>${escHtml(d.name)}</td><td>${escHtml(d.version)}</td><td>${escHtml(d.copy_type)}</td></tr>`;
      });
      h += `</table>`;

      h += `<div class="section-sub">Other Information (if any)</div>`;
      h += `<div class="kv"><span class="v">${escHtml(project.other_info || '')}</span></div>`;
      host.innerHTML = h;
    }
  };

  App.registerSheet(sheet);
})();
