import React, { useState } from 'react';
import API from '../../api/client.js';
import { Modal } from '../../components/common/Dialogs.jsx';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import { useDialogs } from '../../components/common/Dialogs.jsx';

const FIELDS = [
  ['project_key', 'Project Key', 'text'], ['project_type', 'Type', 'text'],
  ['fp_count', 'FP Count', 'number'], ['productivity_factor', 'Productivity Factor', 'number'],
  ['start_date', 'Start Date', 'date'], ['technology', 'Technology', 'text'],
  ['brief_desc', 'Brief Description', 'multi'], ['scope', 'Scope', 'multi']
];

export default function NewProjectModal({ onClose }) {
  const [draft, setDraft] = useState({});
  const { reloadProjects, switchProject } = useProjectData();
  const { toast } = useDialogs();

  const submit = async () => {
    try {
      const p = await API.post('/projects', draft);
      await reloadProjects();
      await switchProject(p.id);
      toast('Project created');
      onClose();
    } catch (e) {
      toast('Create failed: ' + e.message, true);
    }
  };

  return (
    <Modal
      title="New Project"
      onClose={onClose}
      footer={<>
        <button className="btn btn-light" onClick={onClose}>Cancel</button>
        <button className="btn btn-accent" onClick={submit}>Create</button>
      </>}
    >
      <div className="form-grid">
        {FIELDS.map(([key, label, type]) => (
          <label key={key} className={type === 'multi' ? 'full editable-field' : 'editable-field'}>
            <span>{label}</span>
            {type === 'multi'
              ? <textarea rows={3} onBlur={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))} />
              : <input type={type} onBlur={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))} />}
          </label>
        ))}
      </div>
    </Modal>
  );
}
