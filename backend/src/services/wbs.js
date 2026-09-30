// WBS generation - replicates the GenWBS2 macro (Module1.bas):
//  For every HR-plan row (role, IPN, %contribution), copy every task template
//  matching that role into "<ProjectKey>-WBS". Estimated hours are scaled by
//  the resource's %contribution EXCEPT for the meeting/facilitation tasks
//  ("Team Meetings", "Internal Status Meetings", "RAP Meetings", "QA Facilitation"),
//  exactly as the macro excluded them.

const db = require('../db');
const { computeProject } = require('./calc');

// An error the route returns as 400 with a message the user can act on.
class WbsError extends Error {
  constructor(message) { super(message); this.status = 400; }
}

// Standard role-wise team used when a project has no HR plan yet (e.g. one
// created from an SRS, which never names the team). Roles match the
// task_templates role acronyms so every role produces WBS tasks; people are
// placeholders to be assigned. % shares follow the sample workbook's plan.
const DEFAULT_TEAM = [
  ['PO', 'Project Owner', 30],
  ['ODO', 'Offshore Domain Owner', 15],
  ['TL', 'Technical Lead', 10],
  ['DEV', 'Developer1', 80],
  ['DEV', 'Developer2', 80],
  ['TSTL', 'Test Lead', 20],
  ['TSTE', 'Test Engineer', 70],
  ['PQAO', 'PQAO', 3]
];

// Adds DEFAULT_TEAM to a project with no HR plan rows. Returns true if added.
async function seedDefaultHrPlan(projectId) {
  const existing = await db.query('SELECT 1 FROM hr_plan WHERE project_id=$1 LIMIT 1', [projectId]);
  if (existing.rowCount) return false;
  const proj = (await db.query('SELECT * FROM projects WHERE id=$1', [projectId])).rows[0];
  const phases = (await db.query('SELECT * FROM phase_efforts WHERE project_id=$1 ORDER BY seq', [projectId])).rows;
  const calc = proj.start_date ? computeProject(proj, phases, []) : null;
  const perRole = {};
  for (const [i, [acr, name, pct]] of DEFAULT_TEAM.entries()) {
    perRole[acr] = (perRole[acr] || 0) + 1;
    await db.query(
      `INSERT INTO hr_plan (project_id, sno, role_acronym, role_name, resource_name, resource_ipn, contribution_pct, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [projectId, i + 1, acr, name, 'To be assigned', `TBD-${acr}${perRole[acr]}`, pct,
        proj.start_date || null, calc?.endDate || null]
    );
  }
  return true;
}

function evalEstExpr(expr, ctx) {
  // ctx: { analysisHr, designHr, ... totalHr } - evaluate the whitelisted arithmetic expression
  const safe = /^[a-zA-Z0-9_+\-*/(). ]+$/;
  if (!safe.test(expr)) return 0;
  try {
    const keys = Object.keys(ctx);
    const vals = keys.map((k) => ctx[k]);
    // eslint-disable-next-line no-new-func
    const fn = new Function(...keys, `return (${expr});`);
    const v = fn(...vals);
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

async function generateWbs(projectId) {
  const projRes = await db.query('SELECT * FROM projects WHERE id=$1', [projectId]);
  if (projRes.rowCount === 0) throw new Error('Project not found');
  const project = projRes.rows[0];

  // Check what the schedule/estimates need before changing anything.
  const missing = [];
  if (!project.start_date) missing.push('a Start Date (task dates come from the project schedule)');
  if (!(Number(project.fp_count) > 0)) missing.push('an FP Count above 0 (task estimates come from the effort calculation)');
  if (missing.length) {
    throw new WbsError(`Cannot generate the WBS yet - the project needs ${missing.join(' and ')}. ` +
      `Set ${missing.length > 1 ? 'them' : 'it'} in the New Project wizard (Create Project step) or the Data Sheet (Projects Summary).`);
  }
  const seededTeam = await seedDefaultHrPlan(projectId);

  const [phaseRows, hrRows, templates] = await Promise.all([
    db.query('SELECT * FROM phase_efforts WHERE project_id=$1 ORDER BY seq', [projectId]),
    db.query('SELECT * FROM hr_plan WHERE project_id=$1 ORDER BY sno', [projectId]),
    db.query('SELECT * FROM task_templates ORDER BY id')
  ]);

  const calc = computeProject(project, phaseRows.rows, hrRows.rows);

  // milestone date lookup for start/end rules
  const ms = {};
  for (const m of calc.milestones) {
    const key = {
      'Requirement Analysis': ['reqStart', 'reqEnd'],
      'Design': ['designStart', 'designEnd'],
      'Coding & UTC execution': ['cutStart', 'cutEnd'],
      'System test cycle 1': ['sit1Start', 'sit1End'],
      'System test cycle 2': ['sit2Start', 'sit2End'],
      'PAT Delivery': ['patDelStart', 'patDelEnd'],
      'PAT Support': ['patSupStart', 'patSupEnd'],
      'UAT Support': ['uatStart', 'uatEnd']
    }[m.name];
    if (key) { ms[key[0]] = m.start; ms[key[1]] = m.end; }
  }

  const hrCtx = {
    analysisHr: calc.phaseHr['Analysis'] || 0,
    designHr: calc.phaseHr['Design'] || 0,
    designRevHr: calc.phaseHr['Design Review'] || 0,
    codingHr: calc.phaseHr['Coding'] || 0,
    codeRevHr: calc.phaseHr['Code Review'] || 0,
    unitTestHr: calc.phaseHr['Unit Testing'] || 0,
    sysTestHr: calc.phaseHr['System Testing'] || 0,
    pmHr: calc.phaseHr['PM'] || 0,
    patUatHr: calc.phaseHr['PAT/UAT Support'] || 0,
    othersHr: calc.phaseHr['Other Efforts'] || 0,
    totalHr: calc.totalEffHr || 0
  };

  const moduleRes = await db.query('SELECT name FROM modules WHERE project_id=$1 ORDER BY sno LIMIT 1', [projectId]);
  const component = moduleRes.rowCount ? moduleRes.rows[0].name : project.project_key;

  const rows = [];
  for (const hr of hrRows.rows) {
    const share = Number(hr.contribution_pct) || 0;
    const matching = templates.rows.filter((t) => t.role_acronym === hr.role_acronym);
    for (const t of matching) {
      let est = evalEstExpr(t.est_expr, hrCtx);
      if (!t.fixed_share) est = est * share / 100;   // GenWBS2: TaskEst * RolePer / 100
      est = Math.round(est * 100) / 100;
      rows.push({
        project_key: project.project_key,
        assignee: hr.resource_ipn,
        summary: t.summary,
        description: t.description,
        start_date: ms[t.start_rule] || calc.milestones[0]?.start || null,
        end_date: ms[t.end_rule] || calc.milestones[calc.milestones.length - 1]?.end || null,
        phase: t.phase,
        task_type: t.task_type,
        component,
        est_hours: est
      });
    }
  }

  if (!rows.length) {
    const roles = [...new Set(hrRows.rows.map((h) => h.role_acronym).filter(Boolean))];
    const templateRoles = [...new Set(templates.rows.map((t) => t.role_acronym))];
    throw new WbsError(`No WBS tasks were generated: none of the HR plan roles (${roles.join(', ') || 'none'}) ` +
      `has task templates. Roles with templates: ${templateRoles.join(', ')}. Add at least one of these to the HR plan.`);
  }

  // regenerate (macro asked "Are you sure you want to Re-Generate WBS" then wiped the sheet);
  // only after the new rows are known, so a failed generation keeps the old WBS
  await db.query('DELETE FROM wbs_tasks WHERE project_id=$1', [projectId]);

  for (const r of rows) {
    await db.query(
      `INSERT INTO wbs_tasks (project_id, project_key, assignee, summary, description,
         start_date, end_date, phase, task_type, component, est_hours)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [projectId, r.project_key, r.assignee, r.summary, r.description,
        r.start_date, r.end_date, r.phase, r.task_type, r.component, r.est_hours]
    );
  }

  return { generated: rows.length, projectKey: project.project_key, seededTeam };
}

module.exports = { generateWbs, seedDefaultHrPlan, WbsError };
