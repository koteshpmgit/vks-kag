import React from 'react';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import { useDirty } from './DirtyContext.jsx';

export default function Toolbar({
  sheetNames, artifact, setArtifact, onCopyArtifact, onGenerateWbs, protect, setProtect
}) {
  const { projects, projectId, switchProject } = useProjectData();
  const { saveAll, count } = useDirty();

  return (
    <div id="toolbar">
      <label>Project:</label>
      <select value={projectId ?? ''} onChange={(e) => switchProject(Number(e.target.value))}>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.project_key}</option>)}
      </select>
      <span className="sep"></span>
      <button title="Save all edits" onClick={saveAll}>&#128190; Save{count ? ` (${count})` : ''}</button>
      <button title="Generate WBS (GenWBS2)" onClick={onGenerateWbs}>&#9881; Generate WBS</button>
      <span className="sep"></span>
      <label>Select Artifact to Copy:</label>
      <select value={artifact} onChange={(e) => setArtifact(e.target.value)}>
        <option>Select Artifact to Copy</option>
        {sheetNames.map((n) => <option key={n}>{n}</option>)}
      </select>
      <button title="Copy artifact to Desktop (download)" onClick={() => onCopyArtifact(artifact)}>Copy To Desktop</button>
      <span className="sep"></span>
      <span id="protectBox">
        <label><input type="radio" name="protect" id="rbProtect" checked={protect} onChange={() => setProtect(true)} /> Protect</label>
        <label><input type="radio" name="protect" id="rbUnprotect" checked={!protect} onChange={() => setProtect(false)} /> Unprotect</label>
      </span>
    </div>
  );
}
