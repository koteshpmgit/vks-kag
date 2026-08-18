import React from 'react';
import { SlideTitle, SectionSub, Kv, fmtDate, findRole } from './helpers.jsx';

export default function AINProject({ data, onMenu }) {
  const { project, application, computed, hrplan, docs, modules } = data;
  const mod = modules[0] || {};
  return (
    <div>
      <SlideTitle onMenu={onMenu}>{project.project_key} Initiation Note</SlideTitle>

      <SectionSub>Project Overview</SectionSub>
      <table className="grid"><tbody>
        {[
          ['Project Name', project.project_key],
          ['Project ID', application.irn_no],
          ['Project Type', project.project_type],
          ['Brief Description of the Project', project.brief_desc],
          ['Scope of the Project', project.scope],
          ['Technology Involved', project.technology]
        ].map(([k, v]) => (
          <tr key={k}><th style={{ width: 240 }}>{k}</th><td style={{ minWidth: 460, whiteSpace: 'pre-wrap' }}>{v ?? ''}</td></tr>
        ))}
      </tbody></table>

      <SectionSub>Estimation</SectionSub>
      <table className="grid"><tbody>
        <tr><th style={{ width: 240 }}>Project Schedule</th><td>{fmtDate(project.start_date)}</td><td>to</td><td>{fmtDate(computed.endDate)}</td></tr>
        <tr><th>Project Size (In FPs)</th><td colSpan={3}>{project.fp_count}</td></tr>
        <tr><th>Project Effort (In Person days)</th><td colSpan={3}>{computed.totalEffMd}</td></tr>
      </tbody></table>

      <SectionSub>Key Contacts</SectionSub>
      <table className="grid"><tbody>
        <tr><th>ISDC contacts:</th><th>IPN</th><th>Phone</th></tr>
        {['PO', 'ODO', 'VO', 'DO'].map((role) => {
          const r = findRole(hrplan, role);
          return r.resource_name ? <tr key={role}><td>{r.resource_name}</td><td>{r.resource_ipn || ''}</td><td></td></tr> : null;
        })}
        <tr><th>FO contacts:</th><th></th><th></th></tr>
        {['DSI AM', 'DSI DM'].map((role) => {
          const r = findRole(hrplan, role);
          return r.resource_name ? <tr key={role}><td>{r.resource_name}</td><td>{r.resource_ipn || ''}</td><td></td></tr> : null;
        })}
      </tbody></table>

      <SectionSub>Stakeholder Information</SectionSub>
      <table className="grid"><tbody>
        <tr><th>Stakeholder Name</th><th>Role</th><th>IPN</th><th>Phone</th></tr>
        {['PO', 'ODO', 'VO', 'DSI DM', 'DSI CM'].map((role) => {
          const r = findRole(hrplan, role);
          return r.resource_name ? <tr key={role}><td>{r.resource_name}</td><td>{role}</td><td>{r.resource_ipn || ''}</td><td></td></tr> : null;
        })}
      </tbody></table>

      <SectionSub>Milestone Information</SectionSub>
      <table className="grid">
        <thead><tr><th>Milestone</th><th>Start Date</th><th>End Date</th><th>Modules List</th></tr></thead>
        <tbody>
          {computed.milestones.filter((m) => m.name !== 'Go - Live').map((m) => (
            <tr key={m.name}><td>{m.name}</td><td>{fmtDate(m.start)}</td><td>{fmtDate(m.end)}</td><td>{mod.name || project.project_key}</td></tr>
          ))}
        </tbody>
      </table>

      <SectionSub>Resource Requirement</SectionSub>
      <table className="grid"><tbody>
        <tr><th style={{ width: 240 }}>Software Requirements</th><td>{project.software_req || ''}</td></tr>
        <tr><th>Hardware Requirements</th><td>{project.hardware_req || ''}</td></tr>
        <tr><th>Profile/ Skill Required</th><td>{mod.name || ''}</td></tr>
        {mod.dev_res && <tr><th></th><td>{mod.dev_res}</td></tr>}
        {mod.tl_res && <tr><th></th><td>{mod.tl_res}</td></tr>}
        {mod.testers && <tr><th></th><td>{mod.testers}</td></tr>}
      </tbody></table>

      <SectionSub>Quality Objectives</SectionSub>
      <Kv v={project.quality_objective || ''} />

      <SectionSub>Items handed over to Project Owner</SectionSub>
      <table className="grid">
        <thead><tr><th>Document/Item Name</th><th>Version No./Specifications</th><th>Hard copy/ Soft Copy</th></tr></thead>
        <tbody>
          {docs.map((d) => <tr key={d.id}><td>{d.name}</td><td>{d.version}</td><td>{d.copy_type}</td></tr>)}
        </tbody>
      </table>

      <SectionSub>Other Information (if any)</SectionSub>
      <Kv v={project.other_info || ''} />
    </div>
  );
}
