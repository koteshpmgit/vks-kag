// "WBS For JIRA" sheet - generated "<ProjectKey>-WBS" table in JIRA upload format.
// When the hosting app provides CRUD handlers (modern UI), rows get
// add/edit/delete controls; otherwise the table renders read-only (Excel UI).
(function () {
  const sheet = {
    id: 'wbsjira',
    name: 'WBS For JIRA',
    render(host, data, app) {
      const { project, wbs } = data;
      const canCrud = typeof app.editWbsRow === 'function';
      let h = '';
      h += `<div class="slide-title">${escHtml(project.project_key)}-WBS &nbsp;<small style="font-size:12px">(WBS for JIRA upload)</small></div>`;
      h += `<div style="margin:8px">
        <button class="addrow-btn" id="wbs-generate" title="Generate WBS from HR plan and task templates">&#128736; Generate WBS</button>
        <button class="addrow-btn" id="wbs-gen-timesheet" title="Generate day-wise timesheet entries from the WBS tasks">&#9200; Generate Timesheet</button>
        ${app.openTimesheetModal ? `<button class="addrow-btn" id="wbs-view-timesheet" title="View / edit the stored timesheet entries">&#128221; View/Edit Timesheet</button>` : ''}
        ${canCrud ? `<button class="addrow-btn dl-icon" id="wbs-add-task" title="Add WBS task" aria-label="Add WBS task">&#65291;</button>` : ''}
        <button class="addrow-btn dl-icon" id="wbs-export-xls" title="Download .xls" aria-label="Download .xls">&#128215;</button>
        <button class="addrow-btn dl-icon" id="wbs-export-csv" title="Download .csv" aria-label="Download .csv">&#128196;</button>
        <button class="addrow-btn dl-icon" id="wbs-template-xls" title="Blank Template .xls - empty WBS in the JIRA upload format" aria-label="Blank Template .xls">&#128203;</button>
        <button class="addrow-btn dl-icon" id="wbs-template-csv" title="Blank Template .csv - empty WBS in the JIRA upload format" aria-label="Blank Template .csv">&#128466;</button>
      </div>`;
      if (!wbs.length) {
        h += `<div class="note">No WBS generated yet. Click "Generate WBS" — every task template matching each HR-plan role will be copied per resource, with estimates scaled by % contribution (meetings excluded), exactly like the GenWBS2 macro.</div>`;
      } else {
        h += `<table class="grid"><tr><th>#Project Key</th><th>Assignee</th><th>Task Summary</th><th>Task Desc</th><th>Start Date<br>(yyyy-mm-dd)</th><th>End Date<br>(yyyy-mm-dd)</th><th>Phase</th><th>Task Type</th><th>Component Value</th><th>Estimated Task<br>(HH.MM) (in hours)</th>${canCrud ? '<th></th>' : ''}</tr>`;
        wbs.forEach((w, i) => {
          h += `<tr><td>${escHtml(w.project_key)}</td><td>${escHtml(w.assignee)}</td><td>${escHtml(w.summary)}</td><td>${escHtml(w.description)}</td><td>${isoDate(w.start_date)}</td><td>${isoDate(w.end_date)}</td><td>${escHtml(w.phase)}</td><td>${escHtml(w.task_type)}</td><td>${escHtml(w.component)}</td><td class="num">${w.est_hours ?? ''}</td>`;
          if (canCrud) {
            h += `<td style="white-space:nowrap">
              <button class="act-btn wbs-edit" data-i="${i}" title="Edit task" aria-label="Edit task">&#9998;</button>
              <button class="act-btn danger wbs-del" data-i="${i}" title="Delete task" aria-label="Delete task">&#128465;</button>
            </td>`;
          }
          h += `</tr>`;
        });
        h += `</table>`;
        const total = wbs.reduce((s, w) => s + Number(w.est_hours || 0), 0);
        h += `<div class="kv"><span class="k">Total tasks: ${wbs.length}</span><span class="v">Total estimated hours: ${Math.round(total * 100) / 100}</span></div>`;
      }
      host.innerHTML = h;
      host.querySelector('#wbs-generate').onclick = () => app.generateWbs();
      host.querySelector('#wbs-gen-timesheet').onclick = () => {
        if (app.generateTimesheet) app.generateTimesheet();
      };
      const viewTs = host.querySelector('#wbs-view-timesheet');
      if (viewTs) viewTs.onclick = () => app.openTimesheetModal();
      const addTask = host.querySelector('#wbs-add-task');
      if (addTask) addTask.onclick = () => app.addWbsRow();
      host.querySelectorAll('.wbs-edit').forEach((btn) => {
        btn.onclick = () => app.editWbsRow(wbs[Number(btn.dataset.i)]);
      });
      host.querySelectorAll('.wbs-del').forEach((btn) => {
        btn.onclick = () => app.deleteWbsRow(wbs[Number(btn.dataset.i)]);
      });
      host.querySelector('#wbs-export-xls').onclick = () => {
        window.location.href = `/api/projects/${app.projectId}/export/WBS%20For%20JIRA`;
      };
      host.querySelector('#wbs-export-csv').onclick = () => {
        window.location.href = `/api/projects/${app.projectId}/export/WBS%20For%20JIRA?format=csv`;
      };
      host.querySelector('#wbs-template-xls').onclick = () => {
        window.location.href = '/api/wbs-template';
      };
      host.querySelector('#wbs-template-csv').onclick = () => {
        window.location.href = '/api/wbs-template?format=csv';
      };
    }
  };

  App.registerSheet(sheet);
})();
