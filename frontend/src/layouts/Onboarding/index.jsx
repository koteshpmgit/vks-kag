import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Wizard from '../WebApp/Wizard.jsx';
import StartStep from './StartStep.jsx';
import SrsUploadStep from './SrsUploadStep.jsx';
import ReviewStep from './ReviewStep.jsx';
import DocumentsStep from './DocumentsStep.jsx';

// Phases:
//  start     - first screen after login: upload an SRS to create a new
//              project from it, or open an existing project
//  wizard    - the full step-by-step "New Project" wizard - only for
//              creating a project manually ("Create manually instead")
//  srs       - upload the requirements doc for an already-created project
//              (after the wizard, or "Back" from review)
//  review    - summary of what the SRS extraction picked up, with a button
//              to open the wizard pre-filled from it (wizardEdit)
//  documents - Analysis & Design artifacts; the ongoing "home" for a
//              project, reached directly from the start screen on every later
//              visit (no wizard, no SRS/review re-run)
const SRS_REVIEW_STEPS = [
  { id: 'srs', label: 'Upload Requirements' },
  { id: 'review', label: 'Review' }
];

export default function OnboardingLayout() {
  const { projectId, data, reload, switchProject, reloadProjects } = useProjectData();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('start');

  // project created from the start screen's SRS upload
  const afterStart = async (id, extracted) => {
    await reloadProjects();
    await switchProject(id);
    setPhase(extracted ? 'review' : 'documents');
  };

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
        {phase === 'start' && (
          <StartStep
            onCreated={afterStart}
            onSelect={async (id) => { await switchProject(id); setPhase('documents'); }}
            onManual={() => setPhase('wizard')}
          />
        )}
        {phase === 'srs' && projectId && (
          <SrsUploadStep projectId={projectId} onResult={afterSrs} onSkip={() => setPhase('review')} onBack={() => setPhase('start')} />
        )}
        {phase === 'review' && data && (
          <ReviewStep
            data={data}
            onNext={() => setPhase('documents')}
            onBack={() => setPhase('srs')}
            onOpenWizard={() => setPhase('wizardEdit')}
          />
        )}
        {phase === 'documents' && <DocumentsStep onSwitchProject={() => setPhase('start')} />}
      </main>

      {phase === 'wizard' && (
        // Closing without finishing goes back to the start screen (never
        // re-opens itself).
        <Wizard onClose={() => setPhase('start')} onCreated={() => setPhase('srs')} />
      )}
      {phase === 'wizardEdit' && data && (
        // Same wizard, opened on the project just created from the SRS and
        // pre-filled with what was extracted from it; saves in place.
        <Wizard projectId={data.project.id} onClose={() => setPhase('review')} onCreated={() => setPhase('documents')} />
      )}
    </div>
  );
}
