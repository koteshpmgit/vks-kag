import React from 'react';
import { SlideTitle, SectionSub, Kv, fmtDate, findRole } from './helpers.jsx';

export default function KickOff({ data, onMenu }) {
  const { project, application, computed, hrplan, agenda, goals, hardware, software, lists, milestones } = data;
  const po = findRole(hrplan, 'PO');
  const byKind = (k) => lists.filter((l) => l.kind === k);
  const delFor = (name) => (milestones.find((m) => (m.name || '').trim() === name) || {}).deliverable || '';

  return (
    <div>
      <SlideTitle onMenu={onMenu}>Kick Off Presentation – {project.project_key}</SlideTitle>
      <Kv k="Prepared By :" v={po.resource_name || ''} />
      <Kv k="Date             :" v={fmtDate(computed.kickOffDate)} />

      <SlideTitle onMenu={onMenu}>Agenda</SlideTitle>
      <table className="grid"><tbody>
        {agenda.map((a) => <tr key={a.id}><td className="rowhead">{a.sno}</td><td>{a.topic}</td></tr>)}
      </tbody></table>

      <SlideTitle onMenu={onMenu}>Project Details</SlideTitle>
      <Kv k="Project Name                    :" v={project.project_key} />
      <Kv k="Type of project                  :" v={project.project_type} />
      <Kv k="Domain Name                   :" v={application.domain} />
      <Kv k="Off Shore Domain Owner :" v={findRole(hrplan, 'ODO').resource_name} />
      <Kv k="Vertical Owner                  :" v={findRole(hrplan, 'VO').resource_name} />
      <Kv k="FO Vertical Owner            :" v={findRole(hrplan, 'DSI DM').resource_name} />
      <Kv k="Description of the project :" v={project.brief_desc} />

      <SlideTitle onMenu={onMenu}>Project Details - Continued..</SlideTitle>
      <Kv k="Project Scope                    :" v={project.scope} />
      <Kv k="Project Duration                :" v={<>Project Size: {computed.totalEffMd} MD&nbsp;&nbsp;&nbsp;{project.fp_count} FP</>} />
      <Kv k="Project Schedule:" v={<>{fmtDate(project.start_date)} &nbsp;to&nbsp; {fmtDate(computed.endDate)}</>} />
      <Kv k="Technologies used            :" v={project.technology} />
      <Kv k="Tailoring Profile               :" v="Please refer IPP" />

      <SlideTitle onMenu={onMenu}>Project Details - Continued..</SlideTitle>
      <Kv k="Project Life Cycle             :" v={project.life_cycle} />
      <Kv k="Project Goals                     :" v="" />
      <table className="grid">
        <thead><tr><th>S.No</th><th>Metric Name</th><th>Frequency of collection</th><th>Target</th><th>Commitment</th><th>Source of Metrics</th><th>Storage Location</th></tr></thead>
        <tbody>
          {goals.map((g) => (
            <tr key={g.id}><td>{g.sno ?? ''}</td><td>{g.metric_name}</td><td>{g.frequency}</td><td>{g.target}</td><td>{g.commitment}</td><td>{g.source}</td><td>{g.storage}</td></tr>
          ))}
        </tbody>
      </table>

      <SlideTitle onMenu={onMenu}>Milestones &amp; Deliverables</SlideTitle>
      <table className="grid">
        <thead><tr><th>S.No</th><th>Milestone</th><th>Start Date</th><th>End Date</th><th>Deliverable</th></tr></thead>
        <tbody>
          {computed.milestones.map((m, i) => (
            <tr key={m.name}><td>{i + 1}</td><td>{m.name}</td><td>{fmtDate(m.start)}</td><td>{fmtDate(m.end)}</td><td>{delFor(m.name)}</td></tr>
          ))}
        </tbody>
      </table>

      <SlideTitle onMenu={onMenu}>Resource Requirements</SlideTitle>
      <SectionSub>Hardware Requirements:</SectionSub>
      <table className="grid">
        <thead><tr><th>S.No</th><th>Hardware Description</th><th>Configuration/Specification</th><th>Quantity Required</th><th>Start Date</th><th>End date</th></tr></thead>
        <tbody>
          {hardware.map((r) => (
            <tr key={r.id}><td>{r.sno ?? ''}</td><td>{r.description}</td><td>{r.spec}</td><td className="num">{r.quantity ?? ''}</td><td>{fmtDate(r.start_date)}</td><td>{fmtDate(r.end_date)}</td></tr>
          ))}
        </tbody>
      </table>
      <SectionSub>Software Requirements:</SectionSub>
      <table className="grid">
        <thead><tr><th>S.No</th><th>Software Description</th><th>Version</th><th>No. of Installations</th><th>Start Date</th><th>End Date</th></tr></thead>
        <tbody>
          {software.map((r) => (
            <tr key={r.id}><td>{r.sno ?? ''}</td><td>{r.description}</td><td>{r.version}</td><td className="num">{r.installations ?? ''}</td><td>{fmtDate(r.start_date)}</td><td>{fmtDate(r.end_date)}</td></tr>
          ))}
        </tbody>
      </table>
      <SectionSub>Human Resource Requirements:</SectionSub>
      <div className="note">Refer to the Organisation chart</div>

      <SlideTitle onMenu={onMenu}>Organisation Chart</SlideTitle>
      <div className="note">{application.org_chart_link || ''}</div>

      <SlideTitle onMenu={onMenu}>Risks/Issues &amp; Dependencies</SlideTitle>
      {[['Risks and Issues:', 'risk'], ['Dependencies:', 'dependency'], ['Constraints:', 'constraint'], ['Assumptions:', 'assumption']].map(([title, kind]) => (
        <React.Fragment key={kind}>
          <SectionSub>{title}</SectionSub>
          <table className="grid"><tbody>
            {byKind(kind).map((r) => <tr key={r.id}><td className="rowhead">{r.sno}</td><td>{r.description}</td></tr>)}
          </tbody></table>
        </React.Fragment>
      ))}

      <SlideTitle onMenu={onMenu}>Stakeholder's Involvement</SlideTitle>
      <table className="grid">
        <thead><tr><th>S.No</th><th>Stakeholders</th><th>Role</th><th>Type of Involvement (Review/Approval/Sharing Information)</th><th>Frequency</th></tr></thead>
        <tbody>
          {hrplan.map((s, i) => <tr key={s.id}><td>{i + 1}</td><td>{s.resource_name}</td><td>{s.role_acronym}</td><td></td><td></td></tr>)}
        </tbody>
      </table>

      <SlideTitle onMenu={onMenu}>Others</SlideTitle>
      <Kv k="" v={project.other_info || ''} />
      <div className="slide-title">Questions</div>
      <div className="note">Thank You!</div>
    </div>
  );
}
