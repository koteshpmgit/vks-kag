import React, { useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import { ARTIFACTS } from '../../components/artifacts/index.js';
import ArtifactModal from '../../components/common/ArtifactModal.jsx';
import SrsUploadStep from './SrsUploadStep.jsx';
import ProjectMessages from '../../components/common/ProjectMessages.jsx';
import { useDialogs } from '../../components/common/Dialogs.jsx';

const FEATURED_IDS = ['analysisdocument', 'designdocument'];

export default function DocumentsStep({ onSwitchProject, onOpenWizard }) {
  const { projectId, data, reload, archiveProject, deleteProject } = useProjectData();
  const { confirmDialog, msgBox, toast } = useDialogs();
  const [busy, setBusy] = useState(false);
  const key = data?.project?.project_key;

  // Both leave this project, so they return to the start screen afterwards.
  const archive = async () => {
    const ans = await confirmDialog(
      `Archive ${key}?\n\nIt is hidden from your project lists, but all its data is kept - restore it any time from "Archived projects" on the start screen.`,
      { title: 'Archive project', buttons: ['Archive', 'Cancel'] });
    if (ans !== 'Archive') return;
    setBusy(true);
    try {
      await archiveProject(projectId);
      toast(`${key} archived`);
      onSwitchProject();
    } catch (e) {
      await msgBox(e.message, { title: 'Archive failed' });
    } finally { setBusy(false); }
  };
  const remove = async () => {
    const ans = await confirmDialog(
      `Permanently delete ${key}?\n\nThis removes the project and everything in it - the uploaded SRS, Analysis & Design, ` +
      'Data Sheet sections, HR plan, WBS and timesheet. It cannot be undone.\n\nTo keep the data but hide the project, archive it instead.',
      { title: 'Delete project', buttons: ['Delete permanently', 'Archive instead', 'Cancel'] });
    if (ans === 'Archive instead') { await archive(); return; }
    if (ans !== 'Delete permanently') return;
    setBusy(true);
    try {
      await deleteProject(projectId);
      toast(`${key} deleted`);
      onSwitchProject();
    } catch (e) {
      await msgBox(e.message, { title: 'Delete failed' });
    } finally { setBusy(false); }
  };
  const [artifact, setArtifact] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const featured = ARTIFACTS.filter((a) => FEATURED_IDS.includes(a.id));
  const rest = ARTIFACTS.filter((a) => !FEATURED_IDS.includes(a.id));

  // Messages panel fixes: SRS upload and the WBS open here; data sections open
  // the pre-filled wizard on that step (project fields live on its first step).
  const fixMessage = (target) => {
    if (target === 'srs') setShowUpload(true);
    else if (target === 'wbs') setArtifact(ARTIFACTS.find((a) => a.id === 'wbsjira'));
    else onOpenWizard?.(target === 'projSummary' ? '__create__' : target);
  };

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

      <ProjectMessages data={data} onFix={fixMessage} canFix={(t) => t === 'srs' || t === 'wbs' || !!onOpenWizard} />

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
        <button type="button" className="btn btn-light" onClick={archive} disabled={busy} title="Hide this project from your lists; restore it any time">&#128451; Archive project</button>
        <button type="button" className="btn btn-danger" onClick={remove} disabled={busy} title="Permanently delete this project and all its data">&#128465; Delete project</button>
        <button type="button" className="btn btn-light" onClick={onSwitchProject} disabled={busy}>&larr; Switch Project</button>
      </div>

      {artifact && <ArtifactModal artifact={artifact} onClose={() => setArtifact(null)} />}
    </div>
  );
}
