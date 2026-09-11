import React from 'react';

export default function ReviewStep({ data, onNext, onBack }) {
  const { project, analysis, design } = data || {};

  return (
    <div className="ob-card">
      <h2>Review</h2>
      <p className="ob-hint">Here's what was picked up for {project?.project_key}.</p>

      <div className="ob-review-grid">
        <div className="ob-review-field"><span>Brief Description</span><p>{project?.brief_desc || '—'}</p></div>
        <div className="ob-review-field"><span>Scope</span><p>{project?.scope || '—'}</p></div>
        <div className="ob-review-field"><span>Technology</span><p>{project?.technology || '—'}</p></div>
      </div>

      {analysis || design ? (
        <div className="ob-review-stats">
          <div><b>{analysis?.business_requirements?.length || 0}</b><span>Business Reqs</span></div>
          <div><b>{analysis?.functional_requirements?.length || 0}</b><span>Functional Reqs</span></div>
          <div><b>{analysis?.non_functional_requirements?.length || 0}</b><span>Non-Functional Reqs</span></div>
          <div><b>{analysis?.use_cases?.length || 0}</b><span>Use Cases</span></div>
          <div><b>{design?.components?.length || 0}</b><span>Components</span></div>
          <div><b>{design?.api_endpoints?.length || 0}</b><span>API Endpoints</span></div>
        </div>
      ) : (
        <div className="ob-error"><p>No SRS was analyzed for this project yet — the Analysis and Design artifacts will be empty until one is uploaded.</p></div>
      )}

      <div className="ob-actions">
        <button type="button" className="btn btn-light" onClick={onBack}>&larr; Back</button>
        <button type="button" className="btn btn-accent" onClick={onNext}>Continue to Analysis &amp; Design →</button>
      </div>
    </div>
  );
}
