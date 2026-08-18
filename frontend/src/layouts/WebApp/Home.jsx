import React from 'react';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import { GROUPS, SECTION_META } from '../../data/sections.jsx';
import { sectionCompletion, overallCompletion } from '../../data/completion.js';

export default function Home({ onOpenSection }) {
  const { data } = useProjectData();
  if (!data) return null;
  const { project, computed, wbs } = data;
  const overall = overallCompletion(data);

  return (
    <div className="wa-summary-panel">
      <div className="wa-hero">
        <h2>Welcome back, {project.project_key}</h2>
        <p>Pick a section below to keep filling in the Data Sheet, or open an artifact from the sidebar to preview and download it.</p>
        <div className="wa-hero-stats">
          <div><b>{overall}%</b><span>Complete</span></div>
          <div><b>{computed.totalEffMd}</b><span>Effort MD</span></div>
          <div><b>{computed.totalFte}</b><span>Team FTE</span></div>
          <div><b>{wbs.length}</b><span>WBS Tasks</span></div>
        </div>
      </div>

      {GROUPS.map((g) => (
        <div key={g.id} className="wa-home-section">
          <div className="wa-home-section-title">{g.label}</div>
          <div className="wa-home-grid">
            {g.sections.map((sid) => {
              const pct = sectionCompletion(sid, data) ?? 0;
              return (
                <div key={sid} className="wa-home-card" onClick={() => onOpenSection(g.id, sid)}>
                  <div className="icon">&#128196;</div>
                  <h4>{SECTION_META[sid].title}</h4>
                  <div className="progress-track"><span style={{ width: `${pct}%` }} /></div>
                  <small>{pct}% complete</small>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
