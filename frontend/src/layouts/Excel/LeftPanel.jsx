import React from 'react';
import { useProjectData } from '../../context/ProjectDataContext.jsx';

const COMBOS = {
  comboAppData: [
    ['Select the Section...', ''],
    ['Application Details', 'sec-app-details'],
    ['Hardware', 'sec-app-hardware'],
    ['Software', 'sec-app-software'],
    ['Devolopment Environments', 'sec-app-env'],
    ['Decision Analysis and Resolution', 'sec-app-dar'],
    ['Human Res Plan for Application', 'sec-app-hrplan']
  ],
  comboProjData: [
    ['Select the Section...', ''],
    ['Projects Summary', 'sec-proj-summary'],
    ['Estimated Effort', 'sec-proj-effort'],
    ['Milestone Dates', 'sec-proj-milestones'],
    ['Items handed over', 'sec-proj-docs'],
    ['Constraints', 'sec-proj-constraints'],
    ['Dependencies', 'sec-proj-dependencies'],
    ['Assumptions', 'sec-proj-assumptions'],
    ['Risks', 'sec-proj-risks'],
    ['Training Plan', 'sec-proj-training'],
    ['Human Resource plan -Detail Role-Wise', 'sec-proj-hrplan'],
    ['Module Details', 'sec-proj-modules'],
    ['Process Planning', 'sec-proj-process'],
    ['Project Goals', 'sec-proj-goals']
  ],
  comboResData: [
    ['Select the Section...', ''],
    ['Resource-Data', 'sec-res-data']
  ],
  comboStdData: [
    ['Select the Section...', ''],
    ['Roles & Responsibilities', 'sec-std-roles'],
    ['Tools, Methodologies and Techniques', 'sec-std-tools'],
    ['Stakeholder Matrix', 'sec-std-matrix'],
    ['Folder Structure', 'sec-std-folders'],
    ['Task Templates (WBS)', 'sec-std-tasks']
  ]
};

export default function LeftPanel({
  sheetNames, artifact2, setArtifact2, onCopyArtifact, onGoToSection, protect, setProtect
}) {
  const { data } = useProjectData();

  const onCombo = (e) => {
    const v = e.target.value;
    if (v) onGoToSection(v);
    e.target.selectedIndex = 0;
  };

  return (
    <div id="leftpanel">
      <button className="lbl-project" onClick={() => onGoToSection('sec-app-details')}>{data.project.project_key}</button>

      <fieldset>
        <legend>Sheet Protection</legend>
        <div className="radio-row"><input type="radio" name="protect2" id="rbProtect2" checked={protect} onChange={() => setProtect(true)} /><label htmlFor="rbProtect2">Protect</label></div>
        <div className="radio-row"><input type="radio" name="protect2" id="rbUnprotect2" checked={!protect} onChange={() => setProtect(false)} /><label htmlFor="rbUnprotect2">Unprotect</label></div>
      </fieldset>

      <button className="datalabel" onClick={() => onGoToSection('sec-app-details')}>Application-Data<br /><small>Application Details, Hardware,<br />Software, Environments</small></button>
      <select defaultValue="" onChange={onCombo}>{COMBOS.comboAppData.map(([t, v]) => <option key={v} value={v}>{t}</option>)}</select>

      <button className="datalabel" onClick={() => onGoToSection('sec-proj-summary')}>Project-Data<br /><small>Summary, Milestones, Effort,<br />HR Plan, Risks</small></button>
      <select defaultValue="" onChange={onCombo}>{COMBOS.comboProjData.map(([t, v]) => <option key={v} value={v}>{t}</option>)}</select>

      <button className="datalabel" onClick={() => onGoToSection('sec-res-data')}>Resource-Data<br /><small>IPN, Roles, Names</small></button>
      <select defaultValue="" onChange={onCombo}>{COMBOS.comboResData.map(([t, v]) => <option key={v} value={v}>{t}</option>)}</select>

      <button className="datalabel" onClick={() => onGoToSection('sec-std-roles')}>Standards-Data<br /><small>Roles &amp; Responsibilities,<br />Tools, Stakeholder Matrix</small></button>
      <select defaultValue="" onChange={onCombo}>{COMBOS.comboStdData.map(([t, v]) => <option key={v} value={v}>{t}</option>)}</select>

      <div className="arti-box">
        <label style={{ fontSize: 10, fontWeight: 'bold' }}>Select Artifact to Copy</label>
        <select value={artifact2} onChange={(e) => setArtifact2(e.target.value)}>
          <option>Select Artifact to Copy</option>
          {sheetNames.map((n) => <option key={n}>{n}</option>)}
        </select>
        <button className="btn-desktop" onClick={() => onCopyArtifact(artifact2)}>Copy To Desktop</button>
      </div>

      <button className="cmd-menu" onClick={() => { document.getElementById('sheetarea').scrollTop = 0; }}>Menu</button>
    </div>
  );
}
