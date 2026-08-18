// Unified field/section catalog shared by the Modern and WebApp layouts
// (the old modern/js/app.js and webapp/js/app.js copy-pasted this same catalog -
// this is the single, de-duplicated source of truth for both).
import React from 'react';
import API from '../api/client.js';
import { useProjectData } from '../context/ProjectDataContext.jsx';
import ObjectForm from '../components/common/ObjectForm.jsx';
import CrudTable from '../components/common/CrudTable.jsx';

export const GROUPS = [
  {
    id: 'app', label: 'Application-Data',
    hint: 'Application Details, Hardware, Software, Environments',
    sections: ['appDetails', 'hardware', 'software', 'environments', 'dar']
  },
  {
    id: 'proj', label: 'Project-Data',
    hint: 'Summary, Milestones, Effort, HR Plan, Risks',
    sections: ['projSummary', 'effort', 'milestones', 'docs', 'constraints', 'dependencies',
      'assumptions', 'risks', 'training', 'hrplan', 'modules', 'process', 'goals', 'agenda']
  },
  {
    id: 'res', label: 'Resource-Data',
    hint: 'IPN, Roles, Names',
    sections: ['resources']
  },
  {
    id: 'std', label: 'Standards-Data',
    hint: 'Roles & Responsibilities, Tools, Stakeholder Matrix',
    sections: ['stdRoles', 'stdTools', 'stdMatrix', 'stdFolders', 'stdTasks']
  }
];

export const COLLECTION_COLS = {
  hardware: [
    { key: 'sno', label: 'S.No' }, { key: 'description', label: 'Description' },
    { key: 'spec', label: 'Confg./Specification' }, { key: 'quantity', label: 'Quantity', type: 'number' },
    { key: 'start_date', label: 'Start Dt', type: 'date' }, { key: 'end_date', label: 'End Dt', type: 'date' }
  ],
  software: [
    { key: 'sno', label: 'S.No' }, { key: 'description', label: 'Description' },
    { key: 'version', label: 'Version' }, { key: 'installations', label: 'No. of Installations', type: 'number' },
    { key: 'start_date', label: 'Start Dt', type: 'date' }, { key: 'end_date', label: 'End Dt', type: 'date' }
  ],
  environments: [
    { key: 'env_name', label: 'Environment' }, { key: 'server_path', label: 'Server' }, { key: 'access_type', label: 'Access' }
  ],
  dar: [
    { key: 'sno', label: 'S.No' }, { key: 'task', label: 'Task/Phase', full: true }, { key: 'participants', label: 'Participants' }, { key: 'remarks', label: 'Remarks' }
  ],
  docs: [
    { key: 'name', label: 'Document/Item Name' }, { key: 'version', label: 'Version No./Specifications' }, { key: 'copy_type', label: 'Hard/Soft Copy' }
  ],
  training: [
    { key: 'sno', label: 'S.No' }, { key: 'name', label: 'Name of training' }, { key: 'train_type', label: 'Type of training' },
    { key: 'participants', label: 'Participants Name/Profile' }, { key: 'start_date', label: 'Planned start date', type: 'date' }, { key: 'end_date', label: 'Planned End date', type: 'date' }
  ],
  hrplan: [
    { key: 'sno', label: 'S.No' }, { key: 'role_acronym', label: 'Role Acronym' }, { key: 'role_name', label: 'Role' },
    { key: 'resource_name', label: 'Name of the Resource' }, { key: 'resource_ipn', label: 'Resource Ipn' },
    { key: 'contribution_pct', label: '% Contribution', type: 'number' },
    { key: 'start_date', label: 'Start Date', type: 'date' }, { key: 'end_date', label: 'End Date', type: 'date' }
  ],
  modules: [
    { key: 'sno', label: 'S.No' }, { key: 'name', label: 'Name' }, { key: 'description', label: 'Description', full: true },
    { key: 'dev_res', label: 'Dev Resources' }, { key: 'tl_res', label: 'TL Resources' }, { key: 'testers', label: 'Testers' }
  ],
  process: [
    { key: 'sno', label: 'S.No' }, { key: 'process_name', label: 'Process Name' },
    { key: 'applicable', label: 'Applicable (Yes/No)' }, { key: 'tailoring', label: 'Tailoring (if any)' }
  ],
  goals: [
    { key: 'sno', label: 'S.No' }, { key: 'metric_name', label: 'Metric Name' }, { key: 'frequency', label: 'Frequency' },
    { key: 'target', label: 'Target' }, { key: 'commitment', label: 'Commitment' }, { key: 'source', label: 'Source' }, { key: 'storage', label: 'Storage Location' }
  ],
  agenda: [
    { key: 'sno', label: 'S.No' }, { key: 'topic', label: 'Topic', full: true }
  ]
};

const APP_FIELDS = [
  ['app_name', 'Application Name'], ['irn_no', 'IRN No'], ['app_size_fp', 'Application Size in FP'],
  ['front_office', 'Front Office'], ['domain', 'Domain'], ['category', 'Category'],
  ['description', 'Application Description', 'multi'], ['acceptance_criteria', 'Acceptance Criteria', 'multi'],
  ['life_cycle', 'Life Cycle', 'multi'], ['dcv', 'DCV'], ['cvs', 'CVS'], ['technology', 'Technology'],
  ['scope', 'Scope', 'multi'], ['org_chart_link', 'Org. Chart'], ['quality_plan_link', 'Quality Plan'],
  ['corfou_link', 'CORFOU Link'], ['hr_plan_link', 'Human Resource Plan'], ['radar_link', 'Radar Link']
];

export const PROJ_FIELDS_CREATE = [
  ['project_key', 'Project Key'], ['project_type', 'Type'],
  ['fp_count', 'FP Count', 'number', { min: 10, hint: 'min 10' }], ['productivity_factor', 'Productivity Factor', 'number'],
  ['start_date', 'Start Date', 'date'], ['technology', 'Technology'],
  ['brief_desc', 'Brief Description', 'multi'], ['scope', 'Scope', 'multi']
];

export const LIST_KIND_MAP = { constraints: 'constraint', dependencies: 'dependency', assumptions: 'assumption', risks: 'risk' };

const PROJ_FIELDS = [
  ['project_key', 'Project Key'], ['fp_count', 'FP Count', 'number', { min: 10, hint: 'min 10' }],
  ['productivity_factor', 'Productivity Factor', 'number'], ['project_type', 'Type'], ['technology', 'Tech'],
  ['brief_desc', 'Brief Description', 'multi'], ['scope', 'Scope', 'multi'], ['start_date', 'Start Date', 'date'],
  ['software_req', 'Software Req.'], ['hardware_req', 'Hardware Req.'], ['quality_objective', 'Quality Objective', 'multi'],
  ['life_cycle', 'Project Life Cycle', 'multi'], ['shared_folder_path', 'Shared folder path'], ['other_info', 'Other information'],
  ['avg_daily_res_pct', 'Average Daily Res %', 'number'], ['doc_owner_ipn', 'Doc Owner IPN']
];

export const SECTION_META = {
  appDetails: { title: 'Application Details', group: 'app' },
  hardware: { title: 'Hardware', group: 'app' },
  software: { title: 'Software', group: 'app' },
  environments: { title: 'Development Environments', group: 'app' },
  dar: { title: 'Decision Analysis and Resolution', group: 'app' },
  projSummary: { title: 'Projects Summary', group: 'proj' },
  effort: { title: 'Estimated Effort', group: 'proj' },
  milestones: { title: 'Milestone Dates', group: 'proj' },
  docs: { title: 'Items handed over', group: 'proj' },
  constraints: { title: 'Constraints', group: 'proj' },
  dependencies: { title: 'Dependencies', group: 'proj' },
  assumptions: { title: 'Assumptions', group: 'proj' },
  risks: { title: 'Risks', group: 'proj' },
  training: { title: 'Training Plan', group: 'proj' },
  hrplan: { title: 'Human Resource plan — Detail Role-Wise', group: 'proj' },
  modules: { title: 'Module Details', group: 'proj' },
  process: { title: 'Process Planning', group: 'proj' },
  goals: { title: 'Project Goals (Metrics)', group: 'proj' },
  agenda: { title: 'Kick-Off Agenda', group: 'proj' },
  resources: { title: 'Resource-Data', group: 'res' },
  stdRoles: { title: 'Roles & Responsibilities', group: 'std' },
  stdTools: { title: 'Tools, Methodologies and Techniques', group: 'std' },
  stdMatrix: { title: 'Stakeholder Matrix', group: 'std' },
  stdFolders: { title: 'Folder Structure', group: 'std' },
  stdTasks: { title: 'Task Templates (WBS)', group: 'std' }
};

const LIST_KINDS = LIST_KIND_MAP;

export function SectionBody({ sectionId }) {
  const { data, projectId, reload } = useProjectData();

  if (sectionId === 'appDetails') {
    return <ObjectForm obj={data.application} fields={APP_FIELDS} onSave={async (draft) => { await API.put(`/application/${data.application.id}`, draft); reload(); }} />;
  }
  if (sectionId === 'projSummary') {
    return (
      <div>
        <ObjectForm
          obj={data.project} fields={PROJ_FIELDS}
          validate={(d) => {
            const errs = [];
            if (!d.project_key) errs.push('Project Key is required.');
            if (!d.start_date) errs.push('Start Date is required.');
            if (Number(d.fp_count) < 10) errs.push('FP Count must be at least 10.');
            return errs;
          }}
          onSave={async (draft) => { await API.put(`/projects/${projectId}`, draft); reload(); }}
        />
        <ComputedFacts computed={data.computed} />
      </div>
    );
  }
  if (sectionId === 'effort') return <EffortSection />;
  if (sectionId === 'milestones') return <MilestonesSection />;
  if (sectionId === 'resources') {
    return (
      <CrudTable
        basePath="/resources"
        rows={data.resources}
        onChanged={reload}
        columns={[
          { key: 'ipn', label: 'IPN' }, { key: 'role', label: 'Role' }, { key: 'role_desc', label: 'Role Description' },
          { key: 'first_name', label: 'First Name' }, { key: 'last_name', label: 'Last Name' },
          { key: 'full_name', label: 'Full Name', readonly: true }, { key: 'phone', label: 'Phone' }
        ]}
      />
    );
  }
  if (sectionId.startsWith('std')) {
    const map = { stdRoles: ['roles', data.stdRoles, [{ key: 'role_acronym', label: 'Role' }, { key: 'responsibility', label: 'Responsibility', full: true }]],
      stdTools: ['tools', data.stdTools, [{ key: 'sno', label: 'S.No' }, { key: 'activity', label: 'Activity' }, { key: 'standards', label: 'Standards/Techniques' }, { key: 'tools', label: 'Tools/Templates' }, { key: 'version', label: 'Version' }]],
      stdMatrix: ['stakeholder-matrix', data.matrix, [{ key: 'activity', label: 'Activity' }, { key: 'vh', label: 'VH' }, { key: 'odo', label: 'ODO' }, { key: 'po', label: 'PO' }, { key: 'qado', label: 'QADO' }, { key: 'qa', label: 'QA' }, { key: 'tdo', label: 'TDO' }, { key: 'tos', label: 'TO' }, { key: 'team', label: 'Team' }, { key: 'di', label: 'DI' }, { key: 'sepg', label: 'SEPG' }, { key: 'fo', label: 'FO' }, { key: 'ssm', label: 'SSM' }, { key: 'remarks', label: 'Remarks' }]],
      stdFolders: ['folder-structure', data.folders, [{ key: 'phase', label: 'Phase' }, { key: 'artifact_folder', label: 'Artifact Folder' }, { key: 'others', label: 'Others' }]] };
    if (sectionId === 'stdTasks') return <TaskTemplatesSection />;
    const [coll, rows, columns] = map[sectionId];
    return <CrudTable basePath={`/standards/${coll}`} rows={rows} columns={columns} onChanged={reload} readOnly />;
  }
  if (LIST_KINDS[sectionId]) {
    const kind = LIST_KINDS[sectionId];
    const rows = data.lists.filter((l) => l.kind === kind);
    return (
      <CrudTable
        basePath={`/projects/${projectId}/lists`}
        rows={rows}
        onChanged={reload}
        extraDefaults={{ kind, sno: rows.length + 1 }}
        columns={[{ key: 'sno', label: 'S.No' }, { key: 'description', label: 'Description', full: true }]}
      />
    );
  }
  if (COLLECTION_COLS[sectionId]) {
    return (
      <CrudTable
        basePath={`/projects/${projectId}/${sectionId}`}
        rows={data[sectionId]}
        columns={COLLECTION_COLS[sectionId]}
        onChanged={reload}
        extraDefaults={{ sno: (data[sectionId]?.length || 0) + 1 }}
      />
    );
  }
  return <div className="note">Unknown section.</div>;
}

function ComputedFacts({ computed }) {
  return (
    <div className="summary-facts" style={{ marginTop: 14 }}>
      {[
        ['Total Effort (MD)', computed.totalEffMd],
        ['End Date', computed.endDate?.slice(0, 10)],
        ['Kick Off meeting', computed.kickOffDate?.slice(0, 10)],
        ['Proposed PAT Delivery Date', computed.proposedPatDate?.slice(0, 10)],
        ['Average Resource/day', computed.avgResPerDay],
        ['Total FTE', computed.totalFte]
      ].map(([k, v]) => <div className="srow" key={k}><span>{k}</span><b>{v}</b></div>)}
    </div>
  );
}

function EffortSection() {
  const { data, projectId, reload } = useProjectData();
  const { phases, computed } = data;
  return (
    <div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Phase</th><th>%</th><th>MD</th><th>Hr</th></tr></thead>
          <tbody>
            {phases.map((p) => {
              const c = computed.phases.find((x) => x.phase === p.phase) || {};
              return (
                <tr key={p.id}>
                  <td>{p.phase}</td>
                  <td className="editable-cell num">
                    <input type="number" defaultValue={p.pct} style={{ width: 70 }}
                      onBlur={async (e) => {
                        const v = Number(e.target.value) || 0;
                        if (v === p.pct) return;
                        await API.put(`/projects/${projectId}/phases/${p.id}`, { ...p, pct: v });
                        reload();
                      }} />
                  </td>
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
      </div>
      <h4 style={{ margin: '14px 0 6px' }}>Estimated Effort - Consolidation</h4>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Phase</th><th>Total Effort Planned MD</th><th>%</th></tr></thead>
          <tbody>
            {computed.consolidation.map((r) => (
              <tr key={r.phase}><td>{r.phase}</td><td className="calc num">{r.md}</td><td className="calc num">{r.pct}%</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MilestonesSection() {
  const { data, projectId, reload } = useProjectData();
  const { milestones, computed } = data;
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><th>Milestone</th><th>Start Date</th><th>End Date</th><th>Deliverable</th></tr></thead>
        <tbody>
          {computed.milestones.map((m) => {
            const stored = milestones.find((x) => (x.name || '').trim() === m.name) || {};
            return (
              <tr key={m.name}>
                <td>{m.name}</td>
                <td className="calc">{m.start?.slice(0, 10)}</td>
                <td className="calc">{m.end?.slice(0, 10)}</td>
                <td className="editable-cell">
                  {stored.id ? (
                    <input defaultValue={stored.deliverable ?? ''} onBlur={async (e) => {
                      if (e.target.value === (stored.deliverable ?? '')) return;
                      await API.put(`/projects/${projectId}/milestones/${stored.id}`, { ...stored, deliverable: e.target.value });
                      reload();
                    }} />
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TaskTemplatesSection() {
  const [rows, setRows] = React.useState([]);
  React.useEffect(() => { API.get('/standards/task-templates').then(setRows); }, []);
  return (
    <div>
      <p className="tp-desc">Tasks copied per role when "Generate WBS" runs. Estimates scale with each resource's % contribution, except meetings/QA facilitation.</p>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Role</th><th>Task Summary</th><th>Task Desc</th><th>Phase</th><th>Task Type</th><th>Estimate rule</th><th>Fixed</th></tr></thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}><td>{t.role_acronym}</td><td>{t.summary}</td><td>{t.description}</td><td>{t.phase}</td><td>{t.task_type}</td><td>{t.est_expr}</td><td>{t.fixed_share ? 'Yes' : ''}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
