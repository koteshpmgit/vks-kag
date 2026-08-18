import React, { useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import { GROUPS, SECTION_META } from '../../data/sections.jsx';
import { sectionCompletion, groupCompletion } from '../../data/completion.js';
import { ARTIFACTS } from '../../components/artifacts/index.js';

export default function Sidebar({ page, activeGroup, activeSection, onHome, onSummary, onSelect, onOpenArtifact }) {
  const { data } = useProjectData();
  const [openGroups, setOpenGroups] = useState(() => new Set([activeGroup]));

  const toggleGroup = (id) => setOpenGroups((s) => {
    const next = new Set(s);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <aside id="waSidebar">
      <div className="wa-welcome">
        <h3>Welcome<span id="waWelcomeName"></span></h3>
        <p>Pick a Key Section below — or from the menu above. Only one page is shown at a time.</p>
      </div>
      <a className={`wa-home-link${page === 'home' ? ' active' : ''}`} onClick={onHome}>&#127968;&nbsp; Home</a>
      <a className={`wa-home-link${page === 'summary' ? ' active' : ''}`} onClick={onSummary}>&#128202;&nbsp; Project Summary</a>

      <nav id="navAccordion">
        {GROUPS.map((g) => {
          const open = openGroups.has(g.id);
          const pct = data ? groupCompletion(g.id, data) : null;
          return (
            <div key={g.id} className={`nav-group${open ? ' open' : ''}`}>
              <div className="nav-head" onClick={() => toggleGroup(g.id)}>
                <span>{g.label}</span>
                <span className="nav-head-meta">
                  {pct !== null && <span className={`nav-pct group ${pct >= 100 ? 'ng' : pct > 0 ? 'nb' : 'na'}`}>{pct}%</span>}
                  <span className="chev">&#9656;</span>
                </span>
              </div>
              <div className="nav-items">
                {g.sections.map((sid) => {
                  const spct = data ? sectionCompletion(sid, data) : null;
                  return (
                    <a key={sid} className={page === 'section' && activeSection === sid ? 'active' : ''} onClick={() => onSelect(g.id, sid)}>
                      <span className="nav-item-name">{SECTION_META[sid].title}</span>
                      {spct !== null && <span className={`nav-pct ${spct >= 100 ? 'ng' : spct > 0 ? 'nb' : 'na'}`}>{spct}%</span>}
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className={`nav-group${openGroups.has('art') ? ' open' : ''}`}>
          <div className="nav-head" onClick={() => toggleGroup('art')}>
            <span>Artifacts</span>
            <span className="chev">&#9656;</span>
          </div>
          <div className="nav-items">
            {ARTIFACTS.map((a) => (
              <a key={a.id} onClick={() => onOpenArtifact(a)}><span className="nav-item-name">{a.name}</span></a>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
}
