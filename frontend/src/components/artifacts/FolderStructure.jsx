import React from 'react';
import { SlideTitle, SectionSub } from './helpers.jsx';

export default function FolderStructure({ data, onMenu }) {
  const { project, folders } = data;
  const phases = [...new Set(folders.map((f) => f.phase))].sort();
  return (
    <div>
      <SlideTitle onMenu={onMenu}>Folder Structure</SlideTitle>
      <div className="kv"><span className="k">Server Path</span><span className="v">{project.shared_folder_path || ''}</span></div>
      <table className="grid">
        <thead><tr><th>Project Name</th><th>Phase</th><th>Artifact Folder</th><th>Others</th></tr></thead>
        <tbody>
          {folders.map((f) => (
            <tr key={f.id}><td>{' ' + project.project_key}</td><td>{f.phase}</td><td>{f.artifact_folder || ''}</td><td>{f.others || ''}</td></tr>
          ))}
        </tbody>
      </table>

      <SectionSub>Preview</SectionSub>
      <div style={{ margin: 8, fontFamily: 'Consolas,monospace', fontSize: 12 }}>
        &#128193; {project.project_key}<br />
        {phases.map((p) => (
          <React.Fragment key={p}>
            &nbsp;&nbsp;&#128193; {p}<br />
            {folders.filter((f) => f.phase === p && f.artifact_folder).map((f) => (
              <React.Fragment key={f.id}>
                &nbsp;&nbsp;&nbsp;&nbsp;&#128193; {f.artifact_folder}{f.others ? ' / ' + f.others : ''}<br />
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
