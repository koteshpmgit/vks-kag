import React, { useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import { ARTIFACTS } from '../../components/artifacts/index.js';
import ArtifactModal from '../../components/common/ArtifactModal.jsx';
import SrsUploadStep from './SrsUploadStep.jsx';

const FEATURED_IDS = ['analysisdocument', 'designdocument'];

export default function DocumentsStep({ onSwitchProject }) {
  const { projectId, data, reload } = useProjectData();
  const [artifact, setArtifact] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const featured = ARTIFACTS.filter((a) => FEATURED_IDS.includes(a.id));
  const rest = ARTIFACTS.filter((a) => !FEATURED_IDS.includes(a.id));
  const hasAnalysis = !!(data?.analysis || data?.design);

  if (showUpload) {
    return (
      <SrsUploadStep
        projectId={projectId}
        onResult={async () => { await reload(); setShowUpload(false); }}
        onSkip={() => setShowUpload(false)}
        onBack={() => setShowUpload(false)}
      />
    );
  }

  return (
    <div className="ob-card ob-card-wide">
      <h2>Analysis &amp; Design</h2>
      <p className="ob-hint">{data?.project?.project_key} — generate, preview and download your project artifacts.</p>

      {!hasAnalysis && (
        <div className="ob-error">
          <p>No SRS (requirements) document has been analyzed for this project yet.</p>
          <p><button type="button" className="btn btn-accent btn-sm" onClick={() => setShowUpload(true)}>Upload Requirements Document</button></p>
        </div>
      )}

      <div className="ob-artifact-cards">
        {featured.map((a) => (
          <button key={a.id} type="button" className="ob-artifact-card" onClick={() => setArtifact(a)}>
            <h3>{a.name}</h3>
            <span>Preview & download →</span>
          </button>
        ))}
      </div>

      <button type="button" className="ob-more-toggle" onClick={() => setShowMore((v) => !v)}>
        {showMore ? 'Hide' : 'Show'} other artifacts ({rest.length})
      </button>
      {showMore && (
        <div className="ob-more-list">
          {rest.map((a) => (
            <a key={a.id} onClick={() => setArtifact(a)}>{a.name}</a>
          ))}
        </div>
      )}

      <div className="ob-actions">
        <button type="button" className="btn btn-light" onClick={onSwitchProject}>&larr; Switch Project</button>
      </div>

      {artifact && <ArtifactModal artifact={artifact} onClose={() => setArtifact(null)} />}
    </div>
  );
}
