import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { GROUPS, SECTION_META } from '../../data/sections.jsx';
import SettingsPopover from './SettingsPopover.jsx';
import BackgroundPopover from './BackgroundPopover.jsx';
import SummaryPopover from '../Modern/SummaryPopover.jsx';

export default function Header({ page, onHome, onSummary, onOpenSection, onNewProject, onGenerateWbs }) {
  const { projects, projectId, switchProject, data } = useProjectData();
  const { sidebarHidden, setSidebarHidden } = useTheme();
  const [openPop, setOpenPop] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const navigate = useNavigate();

  const toggle = (name) => setOpenPop((p) => (p === name ? null : name));

  return (
    <header id="waHeader">
      <div className="wa-brand" onClick={onHome}>
        <span className="logo">KA</span>
        <div>
          <h1>Key Artifact Generator</h1>
          <small>Web App</small>
        </div>
      </div>

      <nav id="waHeaderMenu">
        <button className={`icon-btn${page === 'home' ? ' active' : ''}`} title="Home" onClick={onHome}>&#127968;</button>
        <button className={`icon-btn${page === 'summary' ? ' active' : ''}`} title="Project Summary" onClick={onSummary}>&#128202;</button>
        {GROUPS.map((g) => (
          <div key={g.id} className={`wa-menu-item${openMenu === g.id ? ' open' : ''}`}>
            <button className="icon-btn" title={g.label} onClick={() => setOpenMenu((m) => (m === g.id ? null : g.id))}>&#128193;</button>
            <div className="wa-menu-dropdown">
              {g.sections.map((sid) => (
                <a key={sid} onClick={() => { setOpenMenu(null); onOpenSection(g.id, sid); }}>{SECTION_META[sid].title}</a>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="header-actions">
        <label className="hdr-field">
          <span>Project</span>
          <select value={projectId ?? ''} onChange={(e) => switchProject(Number(e.target.value))}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.project_key}</option>)}
          </select>
        </label>
        <div className="settings-wrap">
          <button className="icon-btn" title="Project Summary" onClick={() => toggle('summary')}>&#128202;</button>
          <SummaryPopover hidden={openPop !== 'summary'} onOpenSection={(g, s) => { setOpenPop(null); onOpenSection(g, s); }} />
        </div>
        <div className="settings-wrap">
          <button className="icon-btn" title="Display settings" onClick={() => toggle('settings')}>&#9881;</button>
          <SettingsPopover hidden={openPop !== 'settings'} />
        </div>
        <div className="settings-wrap">
          <button className="icon-btn" title="Change background" onClick={() => toggle('bg')}>&#127912;</button>
          <BackgroundPopover hidden={openPop !== 'bg'} />
        </div>
        <button className="icon-btn" title="New Project" onClick={onNewProject}>&#65291;</button>
        <button className="icon-btn" title="Generate WBS (for JIRA upload)" onClick={onGenerateWbs}>&#128736;</button>
        <div className="wa-menu-item" id="layoutSwitchWrap">
          <button className="icon-btn" title="Switch layout" onClick={() => setOpenMenu((m) => (m === 'layout' ? null : 'layout'))}>&#128421;</button>
          <div className={`wa-menu-dropdown${openMenu === 'layout' ? '' : ''}`} style={{ display: openMenu === 'layout' ? 'block' : undefined }}>
            <a onClick={() => navigate('/')}>Modern UI</a>
            <a onClick={() => navigate('/excel')}>Excel UI</a>
            <a className="active" onClick={() => navigate('/webapp')}>Web App UI</a>
          </div>
        </div>
        <button className="icon-btn" title="Show / hide menu" onClick={() => setSidebarHidden((v) => !v)}>&#9776;</button>
      </div>
    </header>
  );
}
