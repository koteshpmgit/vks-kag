import React from 'react';
import { useProjectData } from '../../context/ProjectDataContext.jsx';

export default function PickerStep({ onSelect, onNewProject }) {
  const { projects } = useProjectData();

  return (
    <div className="ob-card">
      <h2>Projects</h2>
      <p className="ob-hint">Pick a project to open, or start a new one.</p>

      {projects.length > 0 && (
        <div className="ob-project-list">
          {projects.map((p) => (
            <button key={p.id} type="button" className="ob-project-card" onClick={() => onSelect(p.id)}>
              <span className="ob-project-key">{p.project_key}</span>
              <span className="ob-project-type">{p.project_type || 'Project'}</span>
            </button>
          ))}
        </div>
      )}

      <button type="button" className="btn btn-accent" onClick={onNewProject}>+ New Project</button>
    </div>
  );
}
