import React, { useState } from 'react';
import API from '../../api/client.js';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import { useDialogs } from './Dialogs.jsx';
import { Modal } from './Dialogs.jsx';
import WBSForJira from '../artifacts/WBSForJira.jsx';
import CrudTable from './CrudTable.jsx';

const TASK_COLS = [
  { key: 'assignee', label: 'Assignee' }, { key: 'summary', label: 'Task Summary' },
  { key: 'description', label: 'Task Description', full: true },
  { key: 'start_date', label: 'Start Date', type: 'date' }, { key: 'end_date', label: 'End Date', type: 'date' },
  { key: 'phase', label: 'Phase' }, { key: 'task_type', label: 'Task Type' },
  { key: 'component', label: 'Component' }, { key: 'est_hours', label: 'Estimated Hours', type: 'number' }
];

// Wraps the read-only WBSForJira artifact with generate/CRUD/timesheet actions -
// shared by the Modern and WebApp layouts (Excel uses the artifact directly, read-only).
export default function WbsPanel() {
  const { data, projectId, reload } = useProjectData();
  const { msgBox, confirmDialog, toast } = useDialogs();
  const [editingTask, setEditingTask] = useState(null);
  const [showTimesheet, setShowTimesheet] = useState(false);

  const generateWbs = async () => {
    if (data.wbs.length) {
      const ans = await confirmDialog('Re-generate the WBS? Existing tasks will be replaced.', { title: 'Confirm WBS re-generation', buttons: ['Re-generate', 'Cancel'] });
      if (ans !== 'Re-generate') return;
    }
    const r = await API.post(`/projects/${projectId}/wbs/generate`);
    await reload();
    toast(`WBS generated (${r.generated} tasks)`);
  };

  const generateTimesheet = async () => {
    if (!data.wbs.length) { await msgBox('Generate the WBS first - the timesheet is built from the WBS tasks'); return; }
    await API.post(`/projects/${projectId}/timesheet/generate`);
    await reload();
    toast('Timesheet generated');
    setShowTimesheet(true);
  };

  const saveTask = async (task) => {
    if (task.id) await API.put(`/projects/${projectId}/wbs/${task.id}`, task);
    else await API.post(`/projects/${projectId}/wbs`, { ...task, project_key: data.project.project_key });
    setEditingTask(null);
    reload();
  };

  const deleteTask = async (task) => {
    const ans = await confirmDialog('Delete this WBS task?', { title: 'Confirm delete', buttons: ['Delete', 'Cancel'] });
    if (ans !== 'Delete') return;
    await API.del(`/projects/${projectId}/wbs/${task.id}`);
    reload();
  };

  return (
    <div>
      <WBSForJira
        data={data} projectId={projectId}
        onGenerateWbs={generateWbs}
        onGenerateTimesheet={generateTimesheet}
        onViewTimesheet={() => setShowTimesheet(true)}
        onAddTask={() => setEditingTask({ summary: '', assignee: '', description: '', phase: '', task_type: '', component: '', est_hours: 0 })}
        onEditTask={(t) => setEditingTask({ ...t })}
        onDeleteTask={deleteTask}
      />

      {editingTask && (
        <Modal
          title={editingTask.id ? 'Edit WBS task' : 'Add WBS task'}
          onClose={() => setEditingTask(null)}
          footer={<>
            <button className="btn btn-light" onClick={() => setEditingTask(null)}>Cancel</button>
            <button className="btn btn-accent" onClick={() => saveTask(editingTask)}>Save</button>
          </>}
        >
          <div className="form-grid">
            {TASK_COLS.map((c) => (
              <label key={c.key} className={c.full ? 'full editable-field' : 'editable-field'}>
                <span>{c.label}</span>
                <input
                  type={c.type === 'date' ? 'date' : (c.type === 'number' ? 'number' : 'text')}
                  defaultValue={c.type === 'date' ? String(editingTask[c.key] || '').slice(0, 10) : (editingTask[c.key] ?? '')}
                  onBlur={(e) => { editingTask[c.key] = e.target.value; }}
                />
              </label>
            ))}
          </div>
        </Modal>
      )}

      {showTimesheet && <TimesheetModal onClose={() => setShowTimesheet(false)} />}
    </div>
  );
}

function TimesheetModal({ onClose }) {
  const { projectId } = useProjectData();
  const [ts, setTs] = useState(null);

  React.useEffect(() => { API.get(`/projects/${projectId}/timesheet`).then(setTs); }, [projectId]);

  return (
    <Modal
      title="Timesheet"
      lg
      onClose={onClose}
      footer={<>
        <button className="btn btn-light" onClick={() => { window.location.href = `/api/projects/${projectId}/timesheet/export?format=csv`; }}>Download CSV</button>
        <button className="btn btn-accent" onClick={() => { window.location.href = `/api/projects/${projectId}/timesheet/export`; }}>Download Excel</button>
      </>}
    >
      {!ts ? <p>Loading…</p> : (
        <>
          <div className="ts-summary">
            <span className="badge">{ts.entries.length} entries</span>
            <span className="badge">{ts.totalHours} total hours</span>
            <span className="badge">{ts.resources} resources</span>
            <span className="badge">{ts.daysCovered} days</span>
          </div>
          <div className="ts-table">
            <CrudTable
              basePath={`/projects/${projectId}/timesheet`}
              rows={ts.entries}
              onChanged={() => API.get(`/projects/${projectId}/timesheet`).then(setTs)}
              columns={[
                { key: 'date', label: 'Date', type: 'date' }, { key: 'day', label: 'Day', readonly: true },
                { key: 'assignee', label: 'Assignee' }, { key: 'summary', label: 'Task' },
                { key: 'phase', label: 'Phase' }, { key: 'task_type', label: 'Type' },
                { key: 'hours', label: 'Hours', type: 'number' }
              ]}
            />
          </div>
        </>
      )}
    </Modal>
  );
}
