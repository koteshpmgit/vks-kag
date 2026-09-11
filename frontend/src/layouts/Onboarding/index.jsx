import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Wizard from '../WebApp/Wizard.jsx';
import PickerStep from './PickerStep.jsx';
import SrsUploadStep from './SrsUploadStep.jsx';
import ReviewStep from './ReviewStep.jsx';
import DocumentsStep from './DocumentsStep.jsx';

// Phases:
//  picker    - choose an existing project, or start a new one (skipped
//              entirely when the user has no projects yet)
//  wizard    - the full step-by-step "New Project" wizard - only shown while
//              *creating* a project, never again afterwards
//  srs       - upload the requirements doc for the project just created
//  review    - summary of what the SRS extraction picked up
//  documents - Analysis & Design artifacts; the ongoing "home" for a
//              project, reached directly from the picker on every later
//              visit (no wizard, no SRS/review re-run)
const SRS_REVIEW_STEPS = [
  { id: 'srs', label: 'Upload Requirements' },
  { id: 'review', label: 'Review' }
];

export default function OnboardingLayout() {
  const { projects, projectId, data, reload, switchProject } = useProjectData();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState(() => (projects.length === 0 ? 'wizard' : 'picker'));

  const afterSrs = async () => {
    await reload();
    setPhase('review');
  };

  const srsReviewIdx = SRS_REVIEW_STEPS.findIndex((s) => s.id === phase);
  const showProgress = srsReviewIdx !== -1;
  const progress = showProgress ? Math.round(((srsReviewIdx + 1) / SRS_REVIEW_STEPS.length) * 100) : 0;

  return (
    <div className="ob-page">
      <header className="ob-header">
        <div className="ob-brand"><span className="logo">KA</span><h1>Key Artifact Generator</h1></div>
        <div className="ob-header-actions">
          <button type="button" className="btn btn-light btn-sm" onClick={() => navigate('/classic')}>Advanced / Full Editor</button>
          <span className="ob-user">{user?.name || user?.email}</span>
          <button type="button" className="btn btn-light btn-sm" onClick={logout}>Logout</button>
        </div>
      </header>

      {showProgress && (
        <div className="ob-progress">
          <div className="ob-progress-track"><span style={{ width: `${progress}%` }} /></div>
          <div className="ob-steps">
            {SRS_REVIEW_STEPS.map((s, i) => (
              <span key={s.id} className={`ob-step${i === srsReviewIdx ? ' current' : ''}${i < srsReviewIdx ? ' done' : ''}`}>{s.label}</span>
            ))}
          </div>
        </div>
      )}

      <main className="ob-content">
        {phase === 'picker' && (
          <PickerStep
            onSelect={async (id) => { await switchProject(id); setPhase('documents'); }}
            onNewProject={() => setPhase('wizard')}
          />
        )}
        {phase === 'srs' && projectId && (
          <SrsUploadStep projectId={projectId} onResult={afterSrs} onSkip={() => setPhase('review')} onBack={() => setPhase('picker')} />
        )}
        {phase === 'review' && data && <ReviewStep data={data} onNext={() => setPhase('documents')} onBack={() => setPhase('srs')} />}
        {phase === 'documents' && <DocumentsStep onSwitchProject={() => setPhase('picker')} />}
      </main>

      {phase === 'wizard' && (
        // Closing without finishing always lands on the picker (never
        // re-opens itself) - even with zero projects it still shows a
        // working "+ New Project" button to try again.
        <Wizard onClose={() => setPhase('picker')} onCreated={() => setPhase('srs')} />
      )}
    </div>
  );
}
