// WBS generation - replicates the GenWBS2 macro (Module1.bas):
//  For every HR-plan row (role, IPN, %contribution), copy every task template
//  matching that role into "<ProjectKey>-WBS". Estimated hours are scaled by
//  the resource's %contribution EXCEPT for the meeting/facilitation tasks
//  ("Team Meetings", "Internal Status Meetings", "RAP Meetings", "QA Facilitation"),
//  exactly as the macro excluded them.

const db = require('../db');
const { computeProject } = require('./calc');

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

  // regenerate (macro asked "Are you sure you want to Re-Generate WBS" then wiped the sheet)
  await db.query('DELETE FROM wbs_tasks WHERE project_id=$1', [projectId]);

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

  for (const r of rows) {
    await db.query(
      `INSERT INTO wbs_tasks (project_id, project_key, assignee, summary, description,
         start_date, end_date, phase, task_type, component, est_hours)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [projectId, r.project_key, r.assignee, r.summary, r.description,
        r.start_date, r.end_date, r.phase, r.task_type, r.component, r.est_hours]
    );
  }

  return { generated: rows.length, projectKey: project.project_key };
}

module.exports = { generateWbs };
