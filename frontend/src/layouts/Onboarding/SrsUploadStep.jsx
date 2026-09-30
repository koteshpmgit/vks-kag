import React, { useState } from 'react';
import API from '../../api/client.js';

const MAX_MB = 10; // matches the backend's SRS upload limit

export default function SrsUploadStep({ projectId, onResult, onSkip, onBack }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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
      const result = await API.upload(`/projects/${projectId}/srs`, formData);
      if (!result.extracted) {
        setError(result.error || 'AI extraction failed.');
        return;
      }
      onResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ob-card">
      <h2>Upload Requirements Document</h2>
      <p className="ob-hint">Upload your SRS (Software Requirements Specification) — a .txt, .md or .pdf file up to {MAX_MB} MB. Claude will read it and auto-fill the project's Analysis and Design artifacts.</p>

      <label className="ob-dropzone">
        <input type="file" accept=".txt,.md,.pdf" onChange={(e) => { setFile(e.target.files[0] || null); setError(''); }} />
        <span>{file ? file.name : 'Choose a file…'}</span>
      </label>

      {error && (
        <div className="ob-error">
          <p>{error}</p>
          <p className="ob-hint">You can continue without AI extraction and fill in project details manually later.</p>
        </div>
      )}

      <div className="ob-actions">
        <button type="button" className="btn btn-light" onClick={onBack} disabled={busy}>&larr; Back</button>
        <button type="button" className="btn btn-light" onClick={onSkip} disabled={busy}>Skip, continue manually →</button>
        <button type="button" className="btn btn-accent" onClick={upload} disabled={busy || !file}>{busy ? 'Analyzing…' : 'Upload & Analyze →'}</button>
      </div>
    </div>
  );
}
