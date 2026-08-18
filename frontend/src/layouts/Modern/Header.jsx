import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import SettingsPopover from './SettingsPopover.jsx';
import SummaryPopover from './SummaryPopover.jsx';

export default function Header({ onNewProject, onGenerateWbs, onOpenSection }) {
  const { projects, projectId, switchProject } = useProjectData();
  const { sidebarHidden, setSidebarHidden } = useTheme();
  const [openPop, setOpenPop] = useState(null); // 'summary' | 'settings' | null
  const navigate = useNavigate();

  const toggle = (name) => setOpenPop((p) => (p === name ? null : name));

  return (
    <header id="appHeader">
      <div className="brand">
        <button id="btnBurger" className="icon-btn" title="Show / hide menu" onClick={() => setSidebarHidden((v) => !v)}>&#9776;</button>
        <span className="logo">KA</span>
        <div>
          <h1>Key Artifact Generator</h1>
          <small>Project key artifacts — Kick-Off · AIN · IPP · WBS for JIRA</small>
        </div>
      </div>
      <div className="header-actions">
        <label className="hdr-field">
          <span>Project</span>
          <select value={projectId ?? ''} onChange={(e) => switchProject(Number(e.target.value))}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.project_key}</option>)}
          </select>
        </label>
        <div className="settings-wrap">
          <button className="icon-btn" title="Project Summary" aria-expanded={openPop === 'summary'} onClick={() => toggle('summary')}>&#128202;</button>
          <SummaryPopover hidden={openPop !== 'summary'} onOpenSection={(g, s) => { setOpenPop(null); onOpenSection?.(g, s); }} />
        </div>
        <div className="settings-wrap">
          <button className="icon-btn" title="Display settings" aria-expanded={openPop === 'settings'} onClick={() => toggle('settings')}>&#9881;</button>
          <SettingsPopover hidden={openPop !== 'settings'} />
        </div>
        <button className="icon-btn" title="New Project" onClick={onNewProject}>&#65291;</button>
        <button className="icon-btn" title="Generate WBS (for JIRA upload)" onClick={onGenerateWbs}>&#128736;</button>
        <label className="hdr-field layout-switch">
          <span>Layout</span>
          <select value="/" onChange={(e) => navigate(e.target.value)}>
            <option value="/">Modern UI</option>
            <option value="/excel">Excel UI</option>
            <option value="/webapp">Web App UI</option>
          </select>
        </label>
      </div>
    </header>
  );
}
