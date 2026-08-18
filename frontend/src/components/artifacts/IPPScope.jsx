import React from 'react';
import { SlideTitle, SectionSub, Kv, fmtDate } from './helpers.jsx';

export default function IPPScope({ data, onMenu }) {
  const { project, computed, lists, hrplan, training, milestones } = data;
  const byKind = (k) => lists.filter((l) => l.kind === k);
  const delFor = (name) => (milestones.find((m) => (m.name || '').trim() === name) || {}).deliverable || '';
  const sp = project.shared_folder_path || '';

  return (
    <div>
      <SlideTitle onMenu={onMenu}>{project.project_type}-{project.project_key}</SlideTitle>

      <SectionSub>1.Scope</SectionSub>
      <Kv v={project.scope || ''} />

      {[['2.Constraints', 'constraint', 'Constraints'], ['3.Dependencies', 'dependency', 'Dependencies'], ['4.Assumptions', 'assumption', 'Assumptions']].map(([title, kind, colLabel]) => (
        <React.Fragment key={kind}>
          <SectionSub>{title}</SectionSub>
          <table className="grid">
            <thead><tr><th>S.No</th><th>{colLabel}</th></tr></thead>
            <tbody>{byKind(kind).map((r) => <tr key={r.id}><td>{r.sno}</td><td>{r.description}</td></tr>)}</tbody>
          </table>
        </React.Fragment>
      ))}

      <SectionSub>5.Project phases, modules and deliverables</SectionSub>
      <table className="grid">
        <thead><tr><th>S.No</th><th>Project Modules/Phases</th><th>Deliverables</th><th>Planned Start date</th><th>Planned End date</th><th>Delivery date</th></tr></thead>
        <tbody>
          {computed.milestones.map((m, i) => (
            <tr key={m.name}><td>{i + 1}</td><td>{m.name}</td><td>{delFor(m.name)}</td><td>{fmtDate(m.start)}</td><td>{fmtDate(m.end)}</td><td>{fmtDate(m.end)}</td></tr>
          ))}
        </tbody>
      </table>

      <SectionSub>6.Human resource plan</SectionSub>
      <table className="grid">
        <thead><tr><th>S.No</th><th>Name of the Resource</th><th>Role</th><th>% Contribution</th><th>Start Date</th><th>End Date</th></tr></thead>
        <tbody>
          {hrplan.map((r, i) => (
            <tr key={r.id}><td>{i + 1}</td><td>{r.resource_name}</td><td>{r.role_acronym}</td><td className="num">{r.contribution_pct ?? 0}%</td><td>{fmtDate(r.start_date)}</td><td>{fmtDate(r.end_date)}</td></tr>
          ))}
        </tbody>
      </table>

      <SectionSub>7.Training Plan</SectionSub>
      <table className="grid">
        <thead><tr><th>S.No</th><th>Name of training</th><th>Type of training</th><th>Praticipants Name/Profile</th><th>Planned start date</th><th>Planned End date</th></tr></thead>
        <tbody>
          {training.map((t) => (
            <tr key={t.id}><td>{t.sno ?? ''}</td><td>{t.name}</td><td>{t.train_type}</td><td>{t.participants}</td><td>{fmtDate(t.start_date)}</td><td>{fmtDate(t.end_date)}</td></tr>
          ))}
        </tbody>
      </table>

      {[['8.WBS', '02.PLANS\\2.2 WBS'], ['9.Estimation report', '03.ESTIMATION\\3.1 Estimation Report'], ['10.Test plan', '09.TESTING\\9.1 TEST PLANS'], ['11.FDA', '02.PLANS\\2.7 FDA']].map(([title, sub]) => (
        <React.Fragment key={title}>
          <SectionSub>{title}</SectionSub>
          <Kv v={sp + sub} />
        </React.Fragment>
      ))}
    </div>
  );
}
