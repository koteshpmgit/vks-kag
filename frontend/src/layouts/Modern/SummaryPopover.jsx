import React from 'react';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import { overallCompletion, groupCompletion, pctClass } from '../../data/completion.js';
import { GROUPS } from '../../data/sections.jsx';

export default function SummaryPopover({ hidden, onOpenSection, inline }) {
  const { data } = useProjectData();
  if (!data) return null;
  const { project, computed, wbs } = data;
  const overall = overallCompletion(data);

  return (
    <div
      className="settings-popover summary-popover"
      hidden={hidden}
      style={inline ? { position: 'static', width: 'auto', maxWidth: 480, boxShadow: 'none' } : undefined}
    >
      <h4>Project Summary <span className="sum-key">{project.project_key}</span></h4>
      <div className="summary-hero">
        <div>
          <div className="summary-key">{project.project_key}</div>
          <div className="summary-type">{project.project_type}</div>
        </div>
      </div>
      <div className={`overall-comp ${pctClass(overall)}`}>
        <div className="progress-row"><span>Overall completion</span><b>{overall}%</b></div>
        <div className="progress-track big"><span style={{ width: `${overall}%` }} /></div>
      </div>
      <div className="summary-widgets">
        <div className="dash-widget calc"><span>Effort</span><strong>{computed.totalEffMd}</strong><small>MD</small></div>
        <div className="dash-widget time"><span>Hours</span><strong>{computed.totalEffHr}</strong><small>total</small></div>
        <div className="dash-widget people"><span>Team</span><strong>{computed.totalFte}</strong><small>FTE</small></div>
        <div className="dash-widget tasks"><span>WBS</span><strong>{wbs.length}</strong><small>tasks</small></div>
      </div>
      <div className="summary-progress">
        {GROUPS.map((g) => {
          const pct = groupCompletion(g.id, data) ?? 0;
          return (
            <div key={g.id} className="sec-comp-row" onClick={() => onOpenSection?.(g.id, g.sections[0])}>
              <span className="scr-name">{g.label}</span>
              <div className="scr-bar"><i className={pct >= 100 ? 'g' : pct >= 50 ? 'b' : 'a'} style={{ width: `${pct}%` }} /></div>
              <b>{pct}%</b>
            </div>
          );
        })}
      </div>
      <div className="summary-facts">
        <div className="srow"><span>End Date</span><b>{String(computed.endDate || '').slice(0, 10)}</b></div>
        <div className="srow"><span>Kick Off</span><b>{String(computed.kickOffDate || '').slice(0, 10)}</b></div>
        <div className="srow"><span>PAT Delivery</span><b>{String(computed.proposedPatDate || '').slice(0, 10)}</b></div>
      </div>
    </div>
  );
}
