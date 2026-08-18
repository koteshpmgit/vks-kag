import React from 'react';
import { SlideTitle, SectionSub, Kv } from './helpers.jsx';

export default function IPPAppInfo({ data, onMenu }) {
  const { application, hrplan, environments, stdTools, stdRoles, hardware, software } = data;
  return (
    <div>
      <SlideTitle onMenu={onMenu}>Application Plan</SlideTitle>
      <table className="grid"><tbody>
        <tr><th style={{ width: 180 }}>Application Name:</th><td>{application.app_name}</td><th>IRN</th><td>{application.irn_no}</td></tr>
        <tr><th>Front Office</th><td>{application.front_office}</td><th>Domain</th><td>{application.domain}</td></tr>
      </tbody></table>

      <SectionSub>1.1 Application description</SectionSub><Kv v={application.description} />
      <SectionSub>1.2 Acceptance Criteria</SectionSub><Kv v={application.acceptance_criteria} />
      <SectionSub>1.3 Life Cycle</SectionSub><Kv v={application.life_cycle} />
      <SectionSub>1.4 DCV</SectionSub><Kv v={application.dcv} />
      <SectionSub>1.5 CVS</SectionSub><Kv v={application.cvs} />

      <SectionSub>1.6 Project Environment</SectionSub>
      <table className="grid">
        <thead><tr><th>S.No</th><th>Environment</th><th>Server</th><th>Access</th></tr></thead>
        <tbody>
          {environments.map((e, i) => <tr key={e.id}><td>{i + 1}</td><td>{e.env_name}</td><td>{e.server_path}</td><td>{e.access_type}</td></tr>)}
        </tbody>
      </table>

      <SectionSub>1.7 Tools, Methodologies and Techniques</SectionSub>
      <table className="grid">
        <thead><tr><th>S.No</th><th>Activity</th><th>standards/Techniques</th><th>Tool(s) planned/templates</th><th>Version No</th></tr></thead>
        <tbody>
          {stdTools.map((t) => <tr key={t.id}><td>{t.sno ?? ''}</td><td>{t.activity}</td><td>{t.standards}</td><td>{t.tools}</td><td>{t.version}</td></tr>)}
        </tbody>
      </table>

      <SectionSub>1.8 Project Organization</SectionSub><Kv v={application.org_chart_link || ''} />

      <SectionSub>1.9 Roles &amp; Responsibilites</SectionSub>
      <table className="grid">
        <thead><tr><th>S.No</th><th>Role</th><th>Responsibility</th><th>Team</th></tr></thead>
        <tbody>
          {stdRoles.map((r, i) => {
            const team = hrplan.filter((x) => x.role_acronym === r.role_acronym ||
              (r.role_acronym === 'Developers' && x.role_acronym === 'DEV') ||
              (r.role_acronym === 'Testers' && x.role_acronym === 'TSTE') ||
              (r.role_acronym === 'QAF' && x.role_acronym === 'PQAO'))
              .map((x) => x.resource_name).join(', ');
            return <tr key={r.id}><td>{i + 1}</td><td>{r.role_acronym}</td><td>{r.responsibility}</td><td>{team}</td></tr>;
          })}
        </tbody>
      </table>

      <SectionSub>1.10 Resouce Plan</SectionSub>
      <SectionSub style={{ background: '#6b93c4' }}>1.10.1 Hardware</SectionSub>
      <table className="grid">
        <thead><tr><th>S.No</th><th>Hardware Description</th><th>Configuration/Specification</th><th>Quantity Required</th><th>Start Date</th><th>End date</th></tr></thead>
        <tbody>
          {hardware.map((r) => <tr key={r.id}><td>{r.sno ?? ''}</td><td>{r.description}</td><td>{r.spec}</td><td className="num">{r.quantity ?? ''}</td><td>{r.start_date}</td><td>{r.end_date}</td></tr>)}
        </tbody>
      </table>
      <SectionSub style={{ background: '#6b93c4' }}>1.10.2 Software</SectionSub>
      <table className="grid">
        <thead><tr><th>S.No</th><th>Software Description</th><th>Version</th><th>No. of Installations</th><th>Start Date</th><th>End Date</th></tr></thead>
        <tbody>
          {software.map((r) => <tr key={r.id}><td>{r.sno ?? ''}</td><td>{r.description}</td><td>{r.version}</td><td className="num">{r.installations ?? ''}</td><td>{r.start_date}</td><td>{r.end_date}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
