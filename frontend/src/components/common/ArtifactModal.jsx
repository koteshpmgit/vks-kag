import React from 'react';
import API from '../../api/client.js';
import { Modal, useDialogs } from './Dialogs.jsx';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import WbsPanel from './WbsPanel.jsx';

const FORMATS = [
  ['xls', 'Excel'], ['csv', 'CSV'], ['html', 'HTML'], ['doc', 'Word'], ['pdf', 'PDF']
];

export default function ArtifactModal({ artifact, onClose }) {
  const { data, projectId } = useProjectData();
  const isWbs = artifact.id === 'wbsjira';
  const { msgBox } = useDialogs();

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
                API.download(`/projects/${projectId}/export/${encodeURIComponent(artifact.name)}${q}`)
                  .catch((e) => msgBox(e.message, { title: 'Download failed' }));
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
