// Assembles the rows of each artifact "sheet" for export
// (used by the "Copy Artifact To Desktop" button, like CopyArtifactToDesktop in VBA).

const db = require('../db');
const { computeProject } = require('./calc');

async function loadAll(pid) {
  const q = (sql, p = [pid]) => db.query(sql, p).then((r) => r.rows);
  const [project] = await q('SELECT * FROM projects WHERE id=$1');
  if (!project) throw new Error('Project not found');
  const [application] = project.application_id
    ? await q('SELECT * FROM applications WHERE id=$1', [project.application_id])
    : await q('SELECT * FROM applications ORDER BY id LIMIT 1', []);
  const [phases, hr, hardware, software, lists, docs, goals, training, process, envs, agenda, modules, stdRoles, stdTools, matrix, folders, wbs] =
    await Promise.all([
      q('SELECT * FROM phase_efforts WHERE project_id=$1 ORDER BY seq'),
      q('SELECT * FROM hr_plan WHERE project_id=$1 ORDER BY sno'),
      q('SELECT * FROM hardware_requirements WHERE project_id=$1 ORDER BY sno'),
      q('SELECT * FROM software_requirements WHERE project_id=$1 ORDER BY sno'),
      q('SELECT * FROM list_items WHERE project_id=$1 ORDER BY kind, sno'),
      q('SELECT * FROM docs_handed WHERE project_id=$1 ORDER BY id'),
      q('SELECT * FROM project_goals WHERE project_id=$1 ORDER BY sno'),
      q('SELECT * FROM training_plan WHERE project_id=$1 ORDER BY sno'),
      q('SELECT * FROM process_planning WHERE project_id=$1 ORDER BY sno'),
      q('SELECT * FROM dev_environments WHERE project_id=$1 ORDER BY id'),
      q('SELECT * FROM kickoff_agenda WHERE project_id=$1 ORDER BY sno'),
      q('SELECT * FROM modules WHERE project_id=$1 ORDER BY sno'),
      q('SELECT * FROM std_roles ORDER BY id', []),
      q('SELECT * FROM std_tools ORDER BY sno', []),
      q('SELECT * FROM stakeholder_matrix ORDER BY id', []),
      q('SELECT * FROM folder_structure ORDER BY id', []),
      q('SELECT * FROM wbs_tasks WHERE project_id=$1 ORDER BY id')
    ]);
  const calc = computeProject(project, phases, hr);
  return { project, application, phases, hr, hardware, software, lists, docs, goals, training, process, envs, agenda, modules, stdRoles, stdTools, matrix, folders, wbs, calc };
}

const T = (v) => ({ v, title: true, colspan: 6 });
const H = (v) => ({ v, header: true });
const B = (v) => ({ v, bold: true });
const fmtD = (d) => (d ? String(d).slice(0, 10) : '');
const byKind = (lists, kind) => lists.filter((l) => l.kind === kind);
const findRes = (hr, role) => hr.find((h) => h.role_acronym === role) || {};

function kickoffRows(d) {
  const { project, application, hr, calc, agenda, goals, hardware, software, lists } = d;
  const po = findRes(hr, 'PO');
  const rows = [];
  rows.push([T(`Kick Off Presentation – ${project.project_key}`)]);
  rows.push([B('Prepared By :'), po.resource_name || '']);
  rows.push([B('Date :'), fmtD(calc.kickOffDate)]);
  rows.push([]);
  rows.push([B('Agenda')]);
  agenda.forEach((a) => rows.push([a.sno, a.topic]));
  rows.push([]);
  rows.push([B('Project Details')]);
  rows.push(['Project Name :', project.project_key]);
  rows.push(['Type of project :', project.project_type]);
  rows.push(['Domain Name :', project ? (application?.domain || '') : '']);
  rows.push(['Off Shore Domain Owner :', findRes(hr, 'ODO').resource_name || '']);
  rows.push(['Vertical Owner :', findRes(hr, 'VO').resource_name || '']);
  rows.push(['FO Vertical Owner :', findRes(hr, 'DSI DM').resource_name || '']);
  rows.push(['Description of the project :', project.brief_desc]);
  rows.push([]);
  rows.push(['Project Scope :', project.scope]);
  rows.push(['Project Duration :', `Project Size: ${calc.totalEffMd} MD  ${project.fp_count} FP`]);
  rows.push(['Project Schedule:', `${fmtD(project.start_date)} to ${fmtD(calc.endDate)}`]);
  rows.push(['Technologies used :', project.technology]);
  rows.push(['Tailoring Profile :', 'Please refer IPP']);
  rows.push(['Project Life Cycle :', project.life_cycle]);
  rows.push([]);
  rows.push([B('Project Goals :')]);
  rows.push([H('S.No'), H('Metric Name'), H('Frequency of collection'), H('Target'), H('Commitment'), H('Source of Metrics'), H('Storage Location')]);
  goals.forEach((g) => rows.push([g.sno, g.metric_name, g.frequency, g.target, g.commitment, g.source, g.storage]));
  rows.push([]);
  rows.push([B('Milestones & Deliverables')]);
  rows.push([H('S.No'), H('Milestone'), H('Start Date'), H('End Date'), H('Deliverable')]);
  d.calc.milestones.forEach((m, i) => {
    const del = d.projectMilestones?.find((x) => x.name.trim() === m.name)?.deliverable
      ?? d.milestoneDeliverables?.[m.name] ?? '';
    rows.push([i + 1, m.name, m.start, m.end, del]);
  });
  rows.push([]);
  rows.push([B('Hardware Requirements:')]);
  rows.push([H('S.No'), H('Hardware Description'), H('Configuration/Specification'), H('Quantity Required'), H('Start Date'), H('End date')]);
  hardware.forEach((h) => rows.push([h.sno, h.description, h.spec, h.quantity, fmtD(h.start_date), fmtD(h.end_date)]));
  rows.push([]);
  rows.push([B('Software Requirements:')]);
  rows.push([H('S.No'), H('Software Description'), H('Version'), H('No. of Installations'), H('Start Date'), H('End Date')]);
  software.forEach((s) => rows.push([s.sno, s.description, s.version, s.installations, fmtD(s.start_date), fmtD(s.end_date)]));
  rows.push([]);
  rows.push([B('Risks and Issues:')]);
  byKind(lists, 'risk').forEach((r) => rows.push([r.sno, r.description]));
  rows.push([B('Dependencies:')]);
  byKind(lists, 'dependency').forEach((r) => rows.push([r.sno, r.description]));
  rows.push([B('Constraints:')]);
  byKind(lists, 'constraint').forEach((r) => rows.push([r.sno, r.description]));
  rows.push([B('Assumptions:')]);
  byKind(lists, 'assumption').forEach((r) => rows.push([r.sno, r.description]));
  rows.push([]);
  rows.push([B("Stakeholder's Involvement")]);
  rows.push([H('S.No'), H('Stakeholders'), H('Role'), H('Type of Involvement'), H('Frequency')]);
  hr.forEach((h, i) => rows.push([i + 1, h.resource_name, h.role_acronym, '', '']));
  return rows;
}

function ainRows(d) {
  const { project, application, hr } = d;
  const rows = [];
  rows.push([T('Application Initiation Note')]);
  rows.push([]);
  rows.push([H('Application Name'), application.app_name]);
  rows.push([H('Front Office'), application.front_office]);
  rows.push([H('Domain'), application.domain]);
  rows.push([H('Scope'), application.scope]);
  rows.push([H('Application Size'), application.app_size_fp]);
  rows.push([H('Technology'), application.technology]);
  rows.push([]);
  rows.push([B('Key contacts')]);
  rows.push([H('Name'), H('Role'), H('IPN')]);
  ['VO', 'ODO', 'PO', 'DSI DM', 'DSI CM'].forEach((role) => {
    const r = findRes(hr, role);
    rows.push([r.resource_name || '', role, r.resource_ipn || '']);
  });
  rows.push([]);
  rows.push([B('Application Details')]);
  rows.push([H('S.No'), H('Project details'), H('ODO'), H('Project Owner'), H('Project Type'), H('Start Date'), H('End Date')]);
  rows.push([1, project.project_key, findRes(hr, 'ODO').resource_name || '', findRes(hr, 'PO').resource_name || '',
    project.project_type, fmtD(project.start_date), fmtD(d.calc.endDate)]);
  return rows;
}

function ainProjectRows(d) {
  const { project, application, hr, calc, docs, modules } = d;
  const rows = [];
  rows.push([T(`${project.project_key} Initiation Note`)]);
  rows.push([B('Project Overview')]);
  rows.push([H('Project Name'), project.project_key]);
  rows.push([H('Project ID'), application.irn_no]);
  rows.push([H('Project Type'), project.project_type]);
  rows.push([H('Brief Description of the Project'), project.brief_desc]);
  rows.push([H('Scope of the Project'), project.scope]);
  rows.push([H('Technology Involved'), project.technology]);
  rows.push([]);
  rows.push([B('Estimation')]);
  rows.push([H('Project Schedule'), fmtD(project.start_date), fmtD(calc.endDate)]);
  rows.push([H('Project Size (In FPs)'), project.fp_count]);
  rows.push([H('Project Effort (In Person days)'), calc.totalEffMd]);
  rows.push([]);
  rows.push([B('Key Contacts')]);
  rows.push([H('ISDC contacts:'), H('IPN'), H('Phone')]);
  ['PO', 'ODO', 'VO', 'DO'].forEach((role) => {
    const r = findRes(hr, role);
    rows.push([r.resource_name || '', r.resource_ipn || '', '']);
  });
  rows.push([H('FO contacts:'), '', '']);
  ['DSI AM', 'DSI DM'].forEach((role) => {
    const r = findRes(hr, role);
    rows.push([r.resource_name || '', r.resource_ipn || '', '']);
  });
  rows.push([]);
  rows.push([B('Milestone Information')]);
  rows.push([H('Milestone'), H('Start Date'), H('End Date'), H('Modules List')]);
  calc.milestones.filter((m) => m.name !== 'Go - Live').forEach((m) =>
    rows.push([m.name, m.start, m.end, modules[0]?.name || project.project_key]));
  rows.push([]);
  rows.push([B('Resource Requirement')]);
  rows.push([H('Software Requirements'), project.software_req]);
  rows.push([H('Hardware Requirements'), project.hardware_req]);
  rows.push([H('Profile/ Skill Required'), modules[0]?.name || '']);
  if (modules[0]) {
    rows.push(['', modules[0].dev_res]);
    rows.push(['', modules[0].tl_res]);
    rows.push(['', modules[0].testers]);
  }
  rows.push([]);
  rows.push([B('Quality Objectives')]);
  rows.push([project.quality_objective]);
  rows.push([]);
  rows.push([B('Items handed over to Project Owner')]);
  rows.push([H('Document/Item Name'), H('Version No./Specifications'), H('Hard copy/ Soft Copy')]);
  docs.forEach((doc) => rows.push([doc.name, doc.version, doc.copy_type]));
  rows.push([]);
  rows.push([B('Other Information (if any)')]);
  rows.push([project.other_info]);
  return rows;
}

function ippAppInfoRows(d) {
  const { application, hr, envs, stdTools, stdRoles, hardware, software } = d;
  const rows = [];
  rows.push([T('Application Plan')]);
  rows.push([H('Application Name:'), application.app_name, H('IRN'), application.irn_no]);
  rows.push([H('Front Office'), application.front_office, H('Domain'), application.domain]);
  rows.push([B('1.1 Application description')]);
  rows.push([application.description]);
  rows.push([B('1.2 Acceptance Criteria')]);
  rows.push([application.acceptance_criteria]);
  rows.push([B('1.3 Life Cycle')]);
  rows.push([application.life_cycle]);
  rows.push([B('1.4 DCV')]);
  rows.push([application.dcv]);
  rows.push([B('1.5 CVS')]);
  rows.push([application.cvs]);
  rows.push([B('1.6 Project Environment')]);
  rows.push([H('S.No'), H('Environment'), H('Server'), H('Access')]);
  envs.forEach((e, i) => rows.push([i + 1, e.env_name, e.server_path, e.access_type]));
  rows.push([B('1.7 Tools, Methodologies and Techniques')]);
  rows.push([H('S.No'), H('Activity'), H('standards/Techniques'), H('Tool(s) planned/templates'), H('Version No')]);
  stdTools.forEach((t) => rows.push([t.sno, t.activity, t.standards, t.tools, t.version]));
  rows.push([B('1.8 Project Organization')]);
  rows.push([application.org_chart_link]);
  rows.push([B('1.9 Roles & Responsibilites')]);
  rows.push([H('S.No'), H('Role'), H('Responsibility'), H('Team')]);
  stdRoles.forEach((r, i) => {
    const team = hr.filter((h) => h.role_acronym === r.role_acronym ||
      (r.role_acronym === 'Developers' && h.role_acronym === 'DEV') ||
      (r.role_acronym === 'Testers' && h.role_acronym === 'TSTE'))
      .map((h) => h.resource_name).join(', ');
    rows.push([i + 1, r.role_acronym, r.responsibility, team]);
  });
  rows.push([B('1.10 Resouce Plan')]);
  rows.push([B('1.10.1 Hardware')]);
  rows.push([H('S.No'), H('Hardware Description'), H('Configuration/Specification'), H('Quantity Required'), H('Start Date'), H('End date')]);
  hardware.forEach((h) => rows.push([h.sno, h.description, h.spec, h.quantity, fmtD(h.start_date), fmtD(h.end_date)]));
  rows.push([B('1.10.2 Software')]);
  rows.push([H('S.No'), H('Software Description'), H('Version'), H('No. of Installations'), H('Start Date'), H('End Date')]);
  software.forEach((s) => rows.push([s.sno, s.description, s.version, s.installations, fmtD(s.start_date), fmtD(s.end_date)]));
  return rows;
}

function ippScopeRows(d) {
  const { project, lists, calc, hr, training } = d;
  const rows = [];
  rows.push([T(`${project.project_type}-${project.project_key}`)]);
  rows.push([B('1.Scope')]);
  rows.push([project.scope]);
  rows.push([B('2.Constraints')]);
  rows.push([H('S.No'), H('Constraints')]);
  byKind(lists, 'constraint').forEach((l) => rows.push([l.sno, l.description]));
  rows.push([B('3.Dependencies')]);
  rows.push([H('S.No'), H('Dependencies')]);
  byKind(lists, 'dependency').forEach((l) => rows.push([l.sno, l.description]));
  rows.push([B('4.Assumptions')]);
  rows.push([H('S.No'), H('Assumptions')]);
  byKind(lists, 'assumption').forEach((l) => rows.push([l.sno, l.description]));
  rows.push([B('5.Project phases, modules and deliverables')]);
  rows.push([H('S.No'), H('Project Modules/Phases'), H('Deliverables'), H('Planned Start date'), H('Planned End date'), H('Delivery date')]);
  calc.milestones.forEach((m, i) => {
    const del = d.milestoneDeliverables?.[m.name] || '';
    rows.push([i + 1, m.name, del, m.start, m.end, m.end]);
  });
  rows.push([B('6.Human resource plan')]);
  rows.push([H('S.No'), H('Name of the Resource'), H('Role'), H('% Contribution'), H('Start Date'), H('End Date')]);
  hr.forEach((h, i) => rows.push([i + 1, h.resource_name, h.role_acronym, `${h.contribution_pct}%`, fmtD(h.start_date), fmtD(h.end_date)]));
  rows.push([B('7.Training Plan')]);
  rows.push([H('S.No'), H('Name of training'), H('Type of training'), H('Praticipants Name/Profile'), H('Planned start date'), H('Planned End date')]);
  training.forEach((t) => rows.push([t.sno, t.name, t.train_type, t.participants, fmtD(t.start_date), fmtD(t.end_date)]));
  rows.push([B('8.WBS')]);
  rows.push([`${project.shared_folder_path || ''}02.PLANS\\2.2 WBS`]);
  rows.push([B('9.Estimation report')]);
  rows.push([`${project.shared_folder_path || ''}03.ESTIMATION\\3.1 Estimation Report`]);
  rows.push([B('10.Test plan')]);
  rows.push([`${project.shared_folder_path || ''}09.TESTING\\9.1 TEST PLANS`]);
  rows.push([B('11.FDA')]);
  rows.push([`${project.shared_folder_path || ''}02.PLANS\\2.7 FDA`]);
  return rows;
}

function ippStakeholderRows(d) {
  const rows = [];
  rows.push([T('Stakeholder Matrix')]);
  rows.push(['Please alter the stakeholder Involvement, if it differs in your project']);
  rows.push([H('Important Activities'), H('VH'), H('ODO'), H('PO'), H('QADO'), H('QA'), H('TDO'), H('TO'), H('Project team'), H('DI'), H('SEPG'), H('FO'), H('SSM'), H('Remarks')]);
  d.matrix.forEach((m) => rows.push([m.activity, m.vh, m.odo, m.po, m.qado, m.qa, m.tdo, m.tos, m.team, m.di, m.sepg, m.fo, m.ssm, m.remarks]));
  rows.push([]);
  rows.push(['E - Execution']);
  rows.push(['P - Participate']);
  rows.push(['O - Overview']);
  rows.push(['EC - Escalation']);
  rows.push(['SSM - Shared Services Managers.  The Services are tracked on periodical basis by ISDC, however based on the need it can be escalated to Shared Services Managers.']);
  return rows;
}

function ippConfigRows(d) {
  const { project, hr } = d;
  const rows = [];
  rows.push([T('4.1 Configuration Management')]);
  rows.push([H('Configuration Management plan'), `${project.shared_folder_path || ''}02.PLANS\\2.6 CMP`]);
  rows.push([H('Development Intergrator'), findRes(hr, 'DI').resource_name || '']);
  rows.push([H('Naming convention'), project.naming_convention]);
  return rows;
}

function ippProcessRows(d) {
  const rows = [];
  rows.push([T('Process Planning')]);
  rows.push([H('S.No'), H('Process Name'), H('Applicable'), H('Applicable tailoring (if any)')]);
  d.process.forEach((p) => rows.push([p.sno, p.process_name, p.applicable, p.tailoring]));
  return rows;
}

function wbsRows(d) {
  const rows = [];
  rows.push([H('#Project Key'), H('Assignee'), H('Task Summary'), H('Task Desc'),
    H('Start Date\n(yyyy-mm-dd)'), H('End Date\n(yyyy-mm-dd)'), H('Phase'), H('Task Type'),
    H('Component Value'), H('Estimated Task\n(HH.MM) (in hours)')]);
  d.wbs.forEach((w) => rows.push([w.project_key, w.assignee, w.summary, w.description,
    fmtD(w.start_date), fmtD(w.end_date), w.phase, w.task_type, w.component, w.est_hours]));
  return rows;
}

function folderRows(d) {
  const rows = [];
  rows.push([H('Project Name'), H('Phase'), H('Artifact Folder'), H('Others')]);
  d.folders.forEach((f) => rows.push([` ${d.project.project_key}`, f.phase, f.artifact_folder, f.others]));
  return rows;
}

function dataSheetRows(d) {
  const { application, project, calc, hr } = d;
  const rows = [];
  rows.push([T('Data Sheet')]);
  rows.push([B('Application Details')]);
  Object.entries({
    'Application Name': application.app_name, 'IRN No': application.irn_no,
    'Application Size in FP': application.app_size_fp, 'Front Office': application.front_office,
    'Domain': application.domain, 'Category': application.category,
    'Application Description': application.description, 'Acceptance Criteria': application.acceptance_criteria,
    'Life Cycle': application.life_cycle, 'Technology': application.technology, 'Scope': application.scope
  }).forEach(([k, v]) => rows.push([H(k), v]));
  rows.push([]);
  rows.push([B('Projects Summary')]);
  Object.entries({
    'Project Key': project.project_key, 'FP Count': project.fp_count,
    'Productivity Factor': project.productivity_factor, 'Total Effort(MD)': calc.totalEffMd,
    'Type': project.project_type, 'Tech': project.technology,
    'Start Date': fmtD(project.start_date), 'End Date': fmtD(calc.endDate)
  }).forEach(([k, v]) => rows.push([H(k), v]));
  rows.push([]);
  rows.push([B('Estimated Effort')]);
  rows.push([H('Phase'), H('%'), H('MD'), H('Hr')]);
  calc.phases.forEach((p) => rows.push([p.phase, `${p.pct}%`, p.md, p.hr]));
  rows.push([]);
  rows.push([B('Human Resource plan -Detail Role-Wise')]);
  rows.push([H('S.No'), H('Role Acronym'), H('Role'), H('Name of the Resource'), H('Resource Ipn'), H('% Contribution'), H('Start Date'), H('End Date')]);
  hr.forEach((h) => rows.push([h.sno, h.role_acronym, h.role_name, h.resource_name, h.resource_ipn, `${h.contribution_pct}%`, fmtD(h.start_date), fmtD(h.end_date)]));
  return rows;
}

async function buildArtifactRows(projectId, artifact) {
  const d = await loadAll(projectId);
  // map milestone name -> deliverable (from stored milestones table)
  const msRows = await db.query('SELECT * FROM milestones WHERE project_id=$1 ORDER BY seq', [projectId]);
  d.milestoneDeliverables = {};
  msRows.rows.forEach((m) => { d.milestoneDeliverables[m.name.trim()] = m.deliverable; });

  const builders = {
    'Data Sheet': dataSheetRows,
    'Kick-Off': kickoffRows,
    'AIN': ainRows,
    'AIN-Project': ainProjectRows,
    'IPP-Application Information': ippAppInfoRows,
    'IPP-Scope Management': ippScopeRows,
    'IPP-Stakeholder plan': ippStakeholderRows,
    'IPP-Configuration Mgmt.': ippConfigRows,
    'IPP-Process Planning': ippProcessRows,
    'WBS For JIRA': wbsRows,
    'Folder Structure': folderRows
  };
  const build = builders[artifact];
  if (!build) throw new Error(`Unknown artifact: ${artifact}`);
  return { projectKey: d.project.project_key, rows: build(d) };
}

module.exports = { buildArtifactRows };
