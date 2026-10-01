import React, { useState } from 'react';
import API from '../../api/client.js';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import { useDialogs } from '../../components/common/Dialogs.jsx';

const MAX_MB = 10; // matches the backend's SRS upload limit

const keyFromFilename = (name) => name.replace(/\.[^.]+$/, '').slice(0, 40);

// First screen after login: upload an SRS to start a new project (the backend
// creates the project and fills it from the document), or open an existing one.
export default function StartStep({ onCreated, onSelect, onManual }) {
  const { projects, restoreProject, deleteProject } = useProjectData();
  const { confirmDialog, msgBox, toast } = useDialogs();
  const [archived, setArchived] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const loadArchived = () => API.get('/projects?archived=1').then(setArchived).catch(() => setArchived([]));
  React.useEffect(() => { loadArchived(); }, [projects.length]);

  const restore = async (p) => {
    try {
      await restoreProject(p.id);
      toast(`${p.project_key} restored`);
      loadArchived();
    } catch (e) { await msgBox(e.message, { title: 'Restore failed' }); }
  };
  const removeArchived = async (p) => {
    const ans = await confirmDialog(`Permanently delete ${p.project_key}?\n\nThe project and all its data are removed. This cannot be undone.`,
      { title: 'Delete project', buttons: ['Delete permanently', 'Cancel'] });
    if (ans !== 'Delete permanently') return;
    try {
      await deleteProject(p.id);
      toast(`${p.project_key} deleted`);
      loadArchived();
    } catch (e) { await msgBox(e.message, { title: 'Delete failed' }); }
  };
  const [file, setFile] = useState(null);
  const [projectKey, setProjectKey] = useState('');
  const [keyEdited, setKeyEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // set when the project was created but AI extraction failed - retries then
  // upload to that project instead of creating another one
  const [createdId, setCreatedId] = useState(null);

  const pickFile = (f) => {
    setFile(f);
    setError('');
    if (f && !keyEdited && !createdId) setProjectKey(keyFromFilename(f.name));
  };

  const upload = async () => {
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB) - the maximum is ${MAX_MB} MB.`);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      let result;
      if (createdId) {
        result = await API.upload(`/projects/${createdId}/srs`, formData);
      } else {
        formData.append('project_key', projectKey.trim());
        result = await API.upload('/srs', formData);
      }
      if (result.extracted) {
        await onCreated(result.project.id, true);
        return;
      }
      setCreatedId(result.project?.id ?? createdId);
      setError(result.error || 'AI extraction failed.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ob-card">
      <h2>Upload Requirements Document</h2>
      <p className="ob-hint">
        Start a new project from your SRS (Software Requirements Specification) — a .txt, .md or .pdf file up to {MAX_MB} MB.
        Claude will read it and fill in the project details and its Analysis and Design documents.
      </p>

      <label className="ob-dropzone">
        <input type="file" accept=".txt,.md,.pdf" onChange={(e) => pickFile(e.target.files[0] || null)} />
        <span>{file ? file.name : 'Choose a file…'}</span>
      </label>

      {!createdId && (
        <label className="auth-field ob-key-field">
          Project Key
          <input
            value={projectKey}
            placeholder="Defaults to the file name"
            maxLength={40}
            onChange={(e) => { setProjectKey(e.target.value); setKeyEdited(true); }}
          />
        </label>
      )}

      {error && (
        <div className="ob-error">
          <p>{error}</p>
          {createdId && <p className="ob-hint">The project was created. You can try again, or continue without AI extraction and fill in the details manually.</p>}
        </div>
      )}

      <div className="ob-actions">
        {createdId
          ? <button type="button" className="btn btn-light" onClick={() => onCreated(createdId, false)} disabled={busy}>Continue without AI →</button>
          : <button type="button" className="btn btn-light" onClick={onManual} disabled={busy}>Create manually instead</button>}
        <button type="button" className="btn btn-accent" onClick={upload} disabled={busy || !file}>
          {busy ? 'Analyzing…' : createdId ? 'Try Again' : 'Upload & Analyze →'}
        </button>
      </div>

      {projects.length > 0 && !createdId && (
        <>
          <h3 className="ob-section-title">Or open an existing project</h3>
          <div className="ob-project-list">
            {projects.map((p) => (
              <button key={p.id} type="button" className="ob-project-card" onClick={() => onSelect(p.id)} disabled={busy}>
                <span className="ob-project-key">{p.project_key}</span>
                <span className="ob-project-type">{p.project_type || 'Project'}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {archived.length > 0 && !createdId && (
        <div className="ob-archived">
          <button type="button" className="ob-more-toggle" onClick={() => setShowArchived((v) => !v)} aria-expanded={showArchived}>
            {showArchived ? 'Hide' : 'Show'} archived projects ({archived.length})
          </button>
          {showArchived && (
            <ul className="ob-archived-list">
              {archived.map((p) => (
                <li key={p.id}>
                  <span><b>{p.project_key}</b><small>archived {String(p.archived_at).slice(0, 10)}</small></span>
                  <button type="button" className="btn btn-light btn-sm" onClick={() => restore(p)}>Restore</button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeArchived(p)}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
