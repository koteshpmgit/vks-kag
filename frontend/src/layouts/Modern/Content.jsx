import React from 'react';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import { GROUPS, SECTION_META, SectionBody } from '../../data/sections.jsx';
import { sectionCompletion } from '../../data/completion.js';

export default function Content({ activeGroup, activeSection, layoutMode, onSelectSection }) {
  const { data } = useProjectData();
  const group = GROUPS.find((g) => g.id === activeGroup);
  if (!group || !data) return null;

  if (layoutMode === 'tabs') {
    return (
      <div>
        <div className="tabbar">
          {group.sections.map((sid) => (
            <div key={sid} className={`tab${sid === activeSection ? ' active' : ''}`}
              onClick={() => onSelectSection?.(activeGroup, sid)}>
              {SECTION_META[sid].title}
            </div>
          ))}
        </div>
        <div className="tab-panel">
          <SectionBody sectionId={activeSection} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {group.sections.map((sid) => {
        const open = sid === activeSection;
        const pct = sectionCompletion(sid, data);
        return (
          <AccordionItem key={sid} id={sid} title={SECTION_META[sid].title} pct={pct} defaultOpen={open} />
        );
      })}
    </div>
  );
}

function AccordionItem({ id, title, pct, defaultOpen }) {
  const [open, setOpen] = React.useState(defaultOpen);
  React.useEffect(() => { if (defaultOpen) setOpen(true); }, [defaultOpen]);
  return (
    <div className={`acc-item${open ? ' open' : ''}`} id={`section-${id}`}>
      <div className="acc-head" onClick={() => setOpen((o) => !o)}>
        <div className="acc-title">
          <div className="acc-icon">&#128196;</div>
          <div><h4>{title}</h4></div>
        </div>
        <div className="acc-meta">
          {pct !== null && <span className={`badge${pct === 0 ? ' muted' : ''}`}>{pct}%</span>}
          <span className="chev">&#9656;</span>
        </div>
      </div>
      {open && <div className="acc-body"><SectionBody sectionId={id} /></div>}
    </div>
  );
}
