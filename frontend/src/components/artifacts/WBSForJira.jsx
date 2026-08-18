import React from 'react';
import { isoDate } from '../../api/client.js';

// "WBS For JIRA" artifact. When add/edit/delete callbacks are supplied (Modern/WebApp)
// rows get CRUD controls; Excel UI omits them and renders read-only, matching the
// original canCrud = typeof app.editWbsRow === 'function' check.
export default function WBSForJira({
  data, projectId, onGenerateWbs, onGenerateTimesheet, onViewTimesheet,
  onAddTask, onEditTask, onDeleteTask
}) {
  const { project, wbs } = data;
  const canCrud = typeof onEditTask === 'function';
  const total = wbs.reduce((s, w) => s + Number(w.est_hours || 0), 0);

  return (
    <div>
      <div className="slide-title">{project.project_key}-WBS &nbsp;<small style={{ fontSize: 12 }}>(WBS for JIRA upload)</small></div>
      <div style={{ margin: 8 }}>
        <button className="addrow-btn" title="Generate WBS from HR plan and task templates" onClick={onGenerateWbs}>&#128736; Generate WBS</button>
        <button className="addrow-btn" title="Generate day-wise timesheet entries from the WBS tasks" onClick={onGenerateTimesheet}>&#9200; Generate Timesheet</button>
        {onViewTimesheet && (
          <button className="addrow-btn" title="View / edit the stored timesheet entries" onClick={onViewTimesheet}>&#128221; View/Edit Timesheet</button>
        )}
        {canCrud && (
          <button className="addrow-btn dl-icon" title="Add WBS task" aria-label="Add WBS task" onClick={onAddTask}>&#65291;</button>
        )}
        <button className="addrow-btn dl-icon" title="Download .xls" aria-label="Download .xls"
          onClick={() => { window.location.href = `/api/projects/${projectId}/export/WBS%20For%20JIRA`; }}>&#128215;</button>
        <button className="addrow-btn dl-icon" title="Download .csv" aria-label="Download .csv"
          onClick={() => { window.location.href = `/api/projects/${projectId}/export/WBS%20For%20JIRA?format=csv`; }}>&#128196;</button>
        <button className="addrow-btn dl-icon" title="Blank Template .xls" aria-label="Blank Template .xls"
          onClick={() => { window.location.href = '/api/wbs-template'; }}>&#128203;</button>
        <button className="addrow-btn dl-icon" title="Blank Template .csv" aria-label="Blank Template .csv"
          onClick={() => { window.location.href = '/api/wbs-template?format=csv'; }}>&#128466;</button>
      </div>
      {!wbs.length ? (
        <div className="note">No WBS generated yet. Click "Generate WBS" — every task template matching each HR-plan role will be copied per resource, with estimates scaled by % contribution (meetings excluded), exactly like the GenWBS2 macro.</div>
      ) : (
        <>
          <table className="grid">
            <thead>
              <tr>
                <th>#Project Key</th><th>Assignee</th><th>Task Summary</th><th>Task Desc</th>
                <th>Start Date<br />(yyyy-mm-dd)</th><th>End Date<br />(yyyy-mm-dd)</th>
                <th>Phase</th><th>Task Type</th><th>Component Value</th>
                <th>Estimated Task<br />(HH.MM) (in hours)</th>{canCrud && <th></th>}
              </tr>
            </thead>
            <tbody>
              {wbs.map((w) => (
                <tr key={w.id}>
                  <td>{w.project_key}</td><td>{w.assignee}</td><td>{w.summary}</td><td>{w.description}</td>
                  <td>{isoDate(w.start_date)}</td><td>{isoDate(w.end_date)}</td>
                  <td>{w.phase}</td><td>{w.task_type}</td><td>{w.component}</td>
                  <td className="num">{w.est_hours ?? ''}</td>
                  {canCrud && (
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="act-btn" title="Edit task" aria-label="Edit task" onClick={() => onEditTask(w)}>&#9998;</button>
                      <button className="act-btn danger" title="Delete task" aria-label="Delete task" onClick={() => onDeleteTask(w)}>&#128465;</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="kv"><span className="k">Total tasks: {wbs.length}</span><span className="v">Total estimated hours: {Math.round(total * 100) / 100}</span></div>
        </>
      )}
    </div>
  );
}
