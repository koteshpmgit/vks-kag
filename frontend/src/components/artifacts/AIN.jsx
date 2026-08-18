import React from 'react';
import { SlideTitle, SectionSub, fmtDate, findRole } from './helpers.jsx';

export default function AIN({ data, onMenu }) {
  const { application, project, computed, hrplan } = data;
  return (
    <div>
      <SlideTitle onMenu={onMenu}>Application Initiation Note</SlideTitle>
      <table className="grid"><tbody>
        {[
          ['Application Name', application.app_name],
          ['Front Office', application.front_office],
          ['Domain', application.domain],
          ['Scope', application.scope],
          ['Application Size', application.app_size_fp],
          ['Technology', application.technology]
        ].map(([k, v]) => (
          <tr key={k}><th style={{ width: 200 }}>{k}</th><td style={{ minWidth: 420, whiteSpace: 'pre-wrap' }}>{v ?? ''}</td></tr>
        ))}
      </tbody></table>

      <SectionSub>Key contacts</SectionSub>
      <table className="grid">
        <thead><tr><th>Name</th><th>Role</th><th>IPN</th></tr></thead>
        <tbody>
          {['VO', 'ODO', 'PO', 'DSI DM', 'DSI CM'].map((role) => {
            const r = findRole(hrplan, role);
            return <tr key={role}><td>{r.resource_name || ''}</td><td>{role}</td><td>{r.resource_ipn || ''}</td></tr>;
          })}
        </tbody>
      </table>

      <SectionSub>Application Details</SectionSub>
      <table className="grid">
        <thead><tr><th>S.No</th><th>Project details</th><th>ODO</th><th>Project Owner</th><th>Project Type</th><th>Start Date</th><th>End Date</th></tr></thead>
        <tbody>
          <tr>
            <td>1</td><td>{project.project_key}</td>
            <td>{findRole(hrplan, 'ODO').resource_name || ''}</td>
            <td>{findRole(hrplan, 'PO').resource_name || ''}</td>
            <td>{project.project_type}</td><td>{fmtDate(project.start_date)}</td><td>{fmtDate(computed.endDate)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
