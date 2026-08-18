import React, { useEffect, useState } from 'react';
import API, { fmtDate } from '../../api/client.js';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import { useDirty } from './DirtyContext.jsx';
import { SectionTitle, SubTitle, Note, KvTable, CollGrid, ListSection } from '../../components/common/ExcelPrimitives.jsx';

// "Data Sheet" - the master input sheet. 1:1 port of the old js/sheets/datasheet.js.
export default function DataSheet({ onAddListRow }) {
  const { data, projectId } = useProjectData();
  const { markDirty } = useDirty();
  const [taskTemplates, setTaskTemplates] = useState([]);

  useEffect(() => { API.get('/standards/task-templates').then(setTaskTemplates); }, []);

  const { application, project, computed, resources, hrplan, phases, milestones,
    hardware, software, lists, docs, goals, training, process, environments, dar,
    modules, stdRoles, stdTools, matrix, folders } = data;

  const saveApp = () => API.put(`/application/${application.id}`, application);
  const saveProj = () => API.put(`/projects/${projectId}`, project);

  return (
    <div>
      {/* ================= Application-Data ================= */}
      <SectionTitle id="sec-app-details">Application-Data — Application Details</SectionTitle>
      <KvTable
        obj={application}
        onFieldChange={(k, v) => { application[k] = v; }}
        saver={saveApp}
        fields={[
          ['app_name', 'Application Name'],
          ['irn_no', 'IRN No'],
          ['app_size_fp', 'Application Size in FP'],
          ['front_office', 'Front Office'],
          ['domain', 'Domain'],
          ['category', 'Category'],
          ['description', 'Application Description', 'multi'],
          ['acceptance_criteria', 'Acceptance Criteria', 'multi'],
          ['life_cycle', 'Life Cycle', 'multi'],
          ['dcv', 'DCV'],
          ['cvs', 'CVS'],
          ['technology', 'Technology'],
          ['scope', 'Scope', 'multi'],
          ['org_chart_link', 'Org. Chart'],
          ['quality_plan_link', 'Quality Plan'],
          ['corfou_link', 'CORFOU Link'],
          ['hr_plan_link', 'Human Resource Plan'],
          ['radar_link', 'Radar Link']
        ]}
      />

      <SectionTitle id="sec-app-hardware">Hardware</SectionTitle>
      <CollGrid coll="hardware" rows={hardware} cols={[
        { key: 'sno', label: 'S.No' },
        { key: 'description', label: 'Description' },
        { key: 'spec', label: 'Confg./Specification' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'start_date', label: 'Start Dt', type: 'date' },
        { key: 'end_date', label: 'End Dt', type: 'date' }
      ]} />

      <SectionTitle id="sec-app-software">Software</SectionTitle>
      <CollGrid coll="software" rows={software} cols={[
        { key: 'sno', label: 'S.No' },
        { key: 'description', label: 'Description' },
        { key: 'version', label: 'Version' },
        { key: 'installations', label: 'No. of Installations' },
        { key: 'start_date', label: 'Start Dt', type: 'date' },
        { key: 'end_date', label: 'End Dt', type: 'date' }
      ]} />

      <SectionTitle id="sec-app-env">Devolopment Environments</SectionTitle>
      <CollGrid coll="environments" rows={environments} cols={[
        { key: 'env_name', label: 'Environment' },
        { key: 'server_path', label: 'Server' },
        { key: 'access_type', label: 'Access' }
      ]} />

      <SectionTitle id="sec-app-dar">Decision Analysis and Resolution</SectionTitle>
      <CollGrid coll="dar" rows={dar} cols={[
        { key: 'sno', label: 'S.No' },
        { key: 'task', label: 'Tasks/Phase identified where formal evaluation shall be performed' },
        { key: 'participants', label: 'Participants' },
        { key: 'remarks', label: 'Remarks' }
      ]} />

      <SectionTitle id="sec-app-hrplan">Human Res Plan for Application</SectionTitle>
      <table className="grid"><tbody>
        <tr><th>S.No</th><th>Period / Resource</th><th>1st Qtr of the Year</th><th>2nd Qtr of the Year</th><th>3rd Qtr of the Year</th></tr>
        <tr><td>1</td><td>Offshore Domain Owner</td><td>1</td><td>1</td><td></td></tr>
        <tr><td>2</td><td>Project Owner</td><td>1</td><td>1</td><td></td></tr>
        <tr><td>3</td><td>Technical Team Member</td><td>3</td><td>3</td><td></td></tr>
      </tbody></table>

      {/* ================= Project-Data ================= */}
      <SectionTitle id="sec-proj-summary">Project-Data — Projects Summary</SectionTitle>
      <KvTable
        obj={project}
        onFieldChange={(k, v) => { project[k] = v; }}
        saver={saveProj}
        fields={[
          ['project_key', 'Project Key'],
          ['fp_count', 'FP Count'],
          ['productivity_factor', 'Productivity Factor'],
          ['project_type', 'Type'],
          ['technology', 'Tech'],
          ['brief_desc', 'Brief Desc', 'multi'],
          ['scope', 'Scope', 'multi'],
          ['start_date', 'Schedule — Start Date', 'date'],
          ['software_req', 'Software Req.'],
          ['hardware_req', 'Hardware Req.'],
          ['quality_objective', 'Quality Objective', 'multi'],
          ['life_cycle', 'Project Life Cycle', 'multi'],
          ['shared_folder_path', 'Shared folder path'],
          ['other_info', 'Other information'],
          ['avg_daily_res_pct', 'Average Daily Res %'],
          ['doc_owner_ipn', 'Doc Owner IPN']
        ]}
      />
      <table className="grid"><tbody>
        {[
          ['Total Effort(MD)', computed.totalEffMd],
          ['End Date :', fmtDate(computed.endDate)],
          ['Kick Off meeting -', fmtDate(computed.kickOffDate)],
          ['Proposed PAT Delivery Date', fmtDate(computed.proposedPatDate)],
          ['Average Resource/day', computed.avgResPerDay],
          ['Total FTE', computed.totalFte]
        ].map(([k, v]) => (
          <tr key={k}><th style={{ width: 220 }}>{k}</th><td className="calc">{v}</td></tr>
        ))}
      </tbody></table>
      <Note>Calculated: Total Effort = FP Count / Productivity Factor; End Date = Start + Effort/2 + 25; Kick Off = Start − 3.</Note>

      <SectionTitle id="sec-proj-effort">Estimated Effort</SectionTitle>
      <table className="grid">
        <thead><tr><th>Phase</th><th>%</th><th>MD</th><th>Hr</th></tr></thead>
        <tbody>
          {phases.map((p) => {
            const c = computed.phases.find((x) => x.phase === p.phase) || {};
            return (
              <tr key={p.id}>
                <td>{p.phase}</td>
                <td><input type="number" defaultValue={p.pct} onBlur={(e) => {
                  const v = Number(e.target.value) || 0;
                  if (v === p.pct) return;
                  p.pct = v;
                  markDirty(() => API.put(`/projects/${projectId}/phases/${p.id}`, p));
                }} /></td>
                <td className="calc num">{c.md}</td>
                <td className="calc num">{c.hr}</td>
              </tr>
            );
          })}
          <tr>
            <td className="calc">Total</td>
            <td className="calc num">{phases.reduce((s, p) => s + Number(p.pct || 0), 0)}%</td>
            <td className="calc num">{computed.totalEffMd}</td>
            <td className="calc num">{computed.totalEffHr}</td>
          </tr>
        </tbody>
      </table>
      <SubTitle>Estimated Effort-Consolidation</SubTitle>
      <table className="grid">
        <thead><tr><th>Phase</th><th>Total Effort Planned MD</th><th>%</th></tr></thead>
        <tbody>
          {computed.consolidation.map((r) => (
            <tr key={r.phase}><td>{r.phase}</td><td className="calc num">{r.md}</td><td className="calc num">{r.pct}%</td></tr>
          ))}
        </tbody>
      </table>

      <SectionTitle id="sec-proj-milestones">Milestone Dates</SectionTitle>
      <table className="grid">
        <thead><tr><th>Milestone</th><th>Start Date</th><th>End Date</th><th>Deliverable</th></tr></thead>
        <tbody>
          {computed.milestones.map((m) => {
            const stored = milestones.find((x) => (x.name || '').trim() === m.name) || {};
            return (
              <tr key={m.name}>
                <td>{m.name}</td>
                <td className="calc">{fmtDate(m.start)}</td>
                <td className="calc">{fmtDate(m.end)}</td>
                {stored.id
                  ? <td><input defaultValue={stored.deliverable ?? ''} onBlur={(e) => {
                      if (e.target.value === (stored.deliverable ?? '')) return;
                      stored.deliverable = e.target.value;
                      markDirty(() => API.put(`/projects/${projectId}/milestones/${stored.id}`, stored));
                    }} /></td>
                  : <td></td>}
              </tr>
            );
          })}
        </tbody>
      </table>
      <Note>Milestone dates are chained from the Start Date and phase efforts (as per the Data Sheet formulas). Saturdays/Sundays are not adjusted automatically.</Note>

      <SectionTitle id="sec-proj-docs">Items handed over to Project Owner</SectionTitle>
      <CollGrid coll="docs" rows={docs} cols={[
        { key: 'name', label: 'Document/Item Name' },
        { key: 'version', label: 'Version No./Specifications' },
        { key: 'copy_type', label: 'Hard copy/ Soft Copy' }
      ]} />

      <SectionTitle id="sec-proj-constraints">Constraints</SectionTitle>
      <ListSection kind="constraint" rows={lists.filter((l) => l.kind === 'constraint')} colLabel="Constraint" onAdd={() => onAddListRow('constraint')} />
      <SectionTitle id="sec-proj-dependencies">Dependencies</SectionTitle>
      <ListSection kind="dependency" rows={lists.filter((l) => l.kind === 'dependency')} colLabel="Dependencies" onAdd={() => onAddListRow('dependency')} />
      <SectionTitle id="sec-proj-assumptions">Assumptions</SectionTitle>
      <ListSection kind="assumption" rows={lists.filter((l) => l.kind === 'assumption')} colLabel="Assumption" onAdd={() => onAddListRow('assumption')} />
      <SectionTitle id="sec-proj-risks">Risks</SectionTitle>
      <ListSection kind="risk" rows={lists.filter((l) => l.kind === 'risk')} colLabel="Risk Description" onAdd={() => onAddListRow('risk')} />

      <SectionTitle id="sec-proj-training">Training Plan</SectionTitle>
      <CollGrid coll="training" rows={training} cols={[
        { key: 'sno', label: 'S.No' },
        { key: 'name', label: 'Name of training' },
        { key: 'train_type', label: 'Type of training' },
        { key: 'participants', label: 'Praticipants Name/Profile' },
        { key: 'start_date', label: 'Planned start date', type: 'date' },
        { key: 'end_date', label: 'Planned End date', type: 'date' }
      ]} />

      <SectionTitle id="sec-proj-hrplan">Human Resource plan — Detail Role-Wise</SectionTitle>
      <CollGrid coll="hrplan" rows={hrplan} cols={[
        { key: 'sno', label: 'S.No' },
        { key: 'role_acronym', label: 'Role Acronym' },
        { key: 'role_name', label: 'Role' },
        { key: 'resource_name', label: 'Name of the Resource' },
        { key: 'resource_ipn', label: 'Resource Ipn' },
        { key: 'contribution_pct', label: '% Contribution', type: 'number' },
        { key: 'start_date', label: 'Start Date', type: 'date' },
        { key: 'end_date', label: 'End Date', type: 'date' }
      ]} />
      <SubTitle>Total Resources (per Role)</SubTitle>
      <table className="grid">
        <thead><tr><th>Roles</th><th>No of Res</th><th>No of FTE</th></tr></thead>
        <tbody>
          {computed.roleSummary.map((r) => (
            <tr key={r.role}><td>{r.role}</td><td className="calc num">{r.count}</td><td className="calc num">{r.fte}</td></tr>
          ))}
        </tbody>
      </table>

      <SectionTitle id="sec-proj-modules">Module Details</SectionTitle>
      <CollGrid coll="modules" rows={modules} cols={[
        { key: 'sno', label: 'S.No' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'dev_res', label: 'Dev Resources' },
        { key: 'tl_res', label: 'TL Resources' },
        { key: 'testers', label: 'Testers' }
      ]} />

      <SectionTitle id="sec-proj-process">Process Planning</SectionTitle>
      <CollGrid coll="process" rows={process} cols={[
        { key: 'sno', label: 'S.No' },
        { key: 'process_name', label: 'Process Name' },
        { key: 'applicable', label: 'Applicable (Yes/NO)' },
        { key: 'tailoring', label: 'Applicable tailoring (if any)' }
      ]} />

      <SectionTitle id="sec-proj-goals">Project Goals (Metrics)</SectionTitle>
      <CollGrid coll="goals" rows={goals} cols={[
        { key: 'sno', label: 'S.No' },
        { key: 'metric_name', label: 'Metric Name' },
        { key: 'frequency', label: 'Frequency of collection' },
        { key: 'target', label: 'Target' },
        { key: 'commitment', label: 'Commitment' },
        { key: 'source', label: 'Source of Metrics' },
        { key: 'storage', label: 'Storage Location' }
      ]} />

      {/* ================= Resource-Data ================= */}
      <SectionTitle id="sec-res-data">Resource-Data</SectionTitle>
      <ResourcesTable resources={resources} />

      {/* ================= Standards-Data ================= */}
      <SectionTitle id="sec-std-roles">Standards-Data — Roles &amp; Responsibilities</SectionTitle>
      <table className="grid">
        <thead><tr><th>S.No</th><th>Role</th><th>Responsibility</th></tr></thead>
        <tbody>{stdRoles.map((r, i) => <tr key={r.id}><td>{i + 1}</td><td>{r.role_acronym}</td><td>{r.responsibility}</td></tr>)}</tbody>
      </table>

      <SectionTitle id="sec-std-tools">Tools, Methodologies and Techniques</SectionTitle>
      <table className="grid">
        <thead><tr><th>S.No</th><th>Activity</th><th>standards/Techniques</th><th>Tool(s) planned/templates</th><th>Version No</th></tr></thead>
        <tbody>{stdTools.map((t) => <tr key={t.id}><td>{t.sno}</td><td>{t.activity}</td><td>{t.standards}</td><td>{t.tools}</td><td>{t.version}</td></tr>)}</tbody>
      </table>

      <SectionTitle id="sec-std-matrix">Stakeholder Matrix (standard)</SectionTitle>
      <table className="grid">
        <thead><tr><th>Important Activities</th><th>VH</th><th>ODO</th><th>PO</th><th>QADO</th><th>QA</th><th>TDO</th><th>TO</th><th>Project team</th><th>DI</th><th>SEPG</th><th>FO</th><th>SSM</th></tr></thead>
        <tbody>
          {matrix.map((m) => (
            <tr key={m.id}>
              {[m.activity, m.vh, m.odo, m.po, m.qado, m.qa, m.tdo, m.tos, m.team, m.di, m.sepg, m.fo, m.ssm].map((c, i) => <td key={i}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>

      <SectionTitle id="sec-std-folders">Folder Structure (standard)</SectionTitle>
      <table className="grid">
        <thead><tr><th>Phase</th><th>Artifact Folder</th><th>Others</th></tr></thead>
        <tbody>{folders.map((f) => <tr key={f.id}><td>{f.phase}</td><td>{f.artifact_folder}</td><td>{f.others}</td></tr>)}</tbody>
      </table>

      <SectionTitle id="sec-std-tasks">Task Templates (WBS generation)</SectionTitle>
      <Note>Tasks copied per role when "Generate WBS" runs (Tasks_Backup sheet). Estimates scale with each resource's % contribution, except meetings/QA facilitation.</Note>
      <table className="grid">
        <thead><tr><th>Role</th><th>Task Summary</th><th>Task Desc</th><th>Phase</th><th>Task Type</th><th>Estimate rule</th><th>Fixed</th></tr></thead>
        <tbody>
          {taskTemplates.map((t) => (
            <tr key={t.id}><td>{t.role_acronym}</td><td>{t.summary}</td><td>{t.description}</td><td>{t.phase}</td><td>{t.task_type}</td><td>{t.est_expr}</td><td>{t.fixed_share ? 'Yes' : ''}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResourcesTable({ resources }) {
  const { markDirty } = useDirty();
  const { reload } = useProjectData();
  const delRow = async (r) => { await API.del(`/resources/${r.id}`); reload(); };
  const addRow = async () => {
    await API.post('/resources', { ipn: '', role: '', role_desc: '', first_name: '', last_name: '', phone: '' });
    reload();
  };
  return (
    <>
      <table className="grid">
        <thead>
          <tr><th></th><th>IPN</th><th>Role</th><th>Role Description</th><th>First Name</th><th>Last Name</th><th>Resource Full Name</th><th>Res Ipn</th><th>Phone</th></tr>
        </thead>
        <tbody>
          {resources.map((r) => {
            const saver = () => API.put(`/resources/${r.id}`, r);
            return (
              <tr key={r.id}>
                <td className="rowhead"><button className="del-btn" onClick={() => delRow(r)}>&times;</button></td>
                {['ipn', 'role', 'role_desc', 'first_name', 'last_name'].map((k) => (
                  <td key={k}><input defaultValue={r[k]} onBlur={(e) => {
                    if (e.target.value === (r[k] ?? '')) return;
                    r[k] = e.target.value;
                    markDirty(saver);
                  }} /></td>
                ))}
                <td className="calc">{`${r.last_name || ''} ${r.first_name || ''}`.trim()}</td>
                <td className="calc">{r.ipn}</td>
                <td><input defaultValue={r.phone} onBlur={(e) => {
                  if (e.target.value === (r.phone ?? '')) return;
                  r.phone = e.target.value;
                  markDirty(saver);
                }} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button className="addrow-btn" onClick={addRow}>+ Add resource</button>
    </>
  );
}
