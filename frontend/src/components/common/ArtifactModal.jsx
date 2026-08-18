import React from 'react';
import { Modal } from './Dialogs.jsx';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import WbsPanel from './WbsPanel.jsx';

const FORMATS = [
  ['xls', 'Excel'], ['csv', 'CSV'], ['html', 'HTML'], ['doc', 'Word'], ['pdf', 'PDF']
];

export default function ArtifactModal({ artifact, onClose }) {
  const { data, projectId } = useProjectData();
  const isWbs = artifact.id === 'wbsjira';

  return (
    <Modal
      title={artifact.name}
      lg
      onClose={onClose}
      footer={!isWbs && (
        <>
          {FORMATS.map(([fmt, label]) => (
            <button
              key={fmt}
              className="btn btn-light btn-sm"
              onClick={() => {
                const q = fmt === 'xls' ? '' : `?format=${fmt}`;
                window.location.href = `/api/projects/${projectId}/export/${encodeURIComponent(artifact.name)}${q}`;
              }}
            >{label}</button>
          ))}
        </>
      )}
    >
      <div className="artifact-host">
        {isWbs ? <WbsPanel /> : <artifact.Component data={data} />}
      </div>
    </Modal>
  );
}
