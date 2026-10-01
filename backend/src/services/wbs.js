// WBS generation - replicates the GenWBS2 macro (Module1.bas):
//  For every HR-plan row (role, IPN, %contribution), copy every task template
//  matching that role into "<ProjectKey>-WBS". Estimated hours are scaled by
//  the resource's %contribution EXCEPT for the meeting/facilitation tasks
//  ("Team Meetings", "Internal Status Meetings", "RAP Meetings", "QA Facilitation"),
//  exactly as the macro excluded them.

const db = require('../db');
const { computeProject } = require('./calc');

// Role acronyms are matched case- and whitespace-insensitively ("dev" = "DEV").
const roleKey = (r) => String(r || '').trim().toUpperCase();

// An error the route returns as 400 with a message the user can act on.
class WbsError extends Error {
  constructor(message, { status = 400, code, details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Standard role-wise team used when a project has no HR plan yet (e.g. one
// created from an SRS, which never names the team). Roles match the
// task_templates role acronyms so every role produces WBS tasks; people are
// placeholders to be assigned. % shares follow the sample workbook's plan.
const DEFAULT_TEAM = [
  ['PO', 'Project Owner', 30],
  ['ODO', 'Offshore Domain Owner', 15],
  ['TL', 'Technical Lead', 20],
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

// The schedule and estimates need both of these; returns what's missing.
function missingBasics(project) {
  const missing = [];
  if (!project.start_date) missing.push('a Start Date (task dates come from the project schedule)');
  if (!(Number(project.fp_count) > 0)) missing.push('an FP Count above 0 (task estimates come from the effort calculation)');
  return missing;
}

// Computes the WBS rows GenWBS2 would create - without writing anything - so
// resource loading can be checked against exactly what Generate would produce.
async function planWbs(projectId) {
  const project = (await db.query('SELECT * FROM projects WHERE id=$1', [projectId])).rows[0];
  if (!project) throw new Error('Project not found');

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
    const matching = templates.rows.filter((t) => roleKey(t.role_acronym) === roleKey(hr.role_acronym));
    for (const t of matching) {
      let est = evalEstExpr(t.est_expr, hrCtx);
      if (!t.fixed_share) est = est * share / 100;   // GenWBS2: TaskEst * RolePer / 100
      est = Math.round(est * 100) / 100;
      rows.push({
        hrId: hr.id,
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
  return { project, calc, hrRows: hrRows.rows, templates: templates.rows, rows };
}

// ---------------- Resource loading ----------------
// For each person in the HR plan: their total % allocation across roles, their
// full-time working hours in their date window (working days x 8h), the hours
// their % books them for, and the WBS hours they would be assigned.
//  - load = WBS hours / full-time hours. GenWBS2 gives each person
//    "role task hours x their %", so comparing against the %-booked hours
//    would cancel the % out; full-time hours is the real limit. Over 100%
//    means their tasks cannot fit even working full-time.
// Problems that make the WBS wrong are errors (Generate WBS refuses); ones
// worth a second look are warnings (Generate asks for confirmation); the rest
// are info.
const HOURS_PER_DAY = 8;
const UNDERLOAD_PCT = 50;   // WBS hours below this % of their booked hours -> info

const iso = (d) => (d ? String(d).slice(0, 10) : null);
function countWorkingDays(start, end) {
  if (!start || !end) return 0;
  const a = new Date(iso(start) + 'T00:00:00Z');
  const b = new Date(iso(end) + 'T00:00:00Z');
  if (b < a) return 0;
  const days = Math.round((b - a) / 86400000) + 1;
  const weeks = Math.floor(days / 7);
  let n = weeks * 5;
  for (let i = 0, dow = a.getUTCDay(); i < days % 7; i++, dow = (dow + 1) % 7) {
    if (dow !== 0 && dow !== 6) n++;
  }
  return n;
}
const isPlaceholder = (h) => /^TBD-/i.test(h.resource_ipn || '') || /^to be assigned$/i.test(String(h.resource_name || '').trim());

function checkResourceLoading({ project, calc, hrRows, templates, rows }) {
  const projStart = iso(project.start_date);
  const projEnd = calc.endDate;
  const templateRoles = new Set(templates.map((t) => roleKey(t.role_acronym)));
  const errors = []; const warnings = []; const info = [];
  const hoursByHr = {};
  for (const r of rows) hoursByHr[r.hrId] = (hoursByHr[r.hrId] || 0) + Number(r.est_hours || 0);

  // row-level checks
  for (const h of hrRows) {
    const who = String(h.resource_name || '').trim() || h.resource_ipn || `HR plan row ${h.sno ?? ''}`.trim();
    const role = String(h.role_acronym || '').trim() || '(no role)';
    const pct = Number(h.contribution_pct);
    if (templateRoles.has(roleKey(h.role_acronym)) && !(pct > 0 && pct <= 100)) {
      errors.push({ code: 'invalid-share', member: who, message: `${who} (${role}) has a ${h.contribution_pct ?? 'blank'}% contribution - it must be between 1 and 100, otherwise their WBS task hours are ${pct > 100 ? 'inflated' : 'zero'}.` });
    }
    if (h.start_date && h.end_date && iso(h.end_date) < iso(h.start_date)) {
      errors.push({ code: 'dates-reversed', member: who, message: `${who} (${role}) ends (${iso(h.end_date)}) before they start (${iso(h.start_date)}).` });
    }
  }

  // person-level loading (one person can hold several roles; grouped by IPN, else name)
  const people = new Map();
  for (const h of hrRows) {
    const key = isPlaceholder(h) ? `row:${h.id}` : (String(h.resource_ipn || '').trim().toLowerCase() || String(h.resource_name || '').trim().toLowerCase() || `row:${h.id}`);
    if (!people.has(key)) people.set(key, []);
    people.get(key).push(h);
  }
  const members = [];
  for (const rowsOfPerson of people.values()) {
    const first = rowsOfPerson[0];
    const ipn = String(first.resource_ipn || '').trim();
    const placeholder = rowsOfPerson.every(isPlaceholder);
    const name = placeholder
      ? `${String(first.role_name || first.role_acronym || 'Role').trim()} (to be assigned)`
      : String(first.resource_name || '').trim() || ipn || 'Unnamed';
    const roles = rowsOfPerson.map((h) => `${String(h.role_acronym || '').trim() || '?'} ${Number(h.contribution_pct) || 0}%`);
    const allocationPct = rowsOfPerson.reduce((s, h) => s + (Number(h.contribution_pct) || 0), 0);
    const start = rowsOfPerson.map((h) => iso(h.start_date) || projStart).filter(Boolean).sort()[0] || projStart;
    const end = rowsOfPerson.map((h) => iso(h.end_date) || projEnd).filter(Boolean).sort().pop() || projEnd;
    const workingDays = countWorkingDays(start, end);
    const capacityHrs = workingDays * HOURS_PER_DAY;
    // hours their % books them for: each row's % over that row's own window
    const allocatedHrs = Math.round(rowsOfPerson.reduce((s, h) =>
      s + countWorkingDays(iso(h.start_date) || projStart, iso(h.end_date) || projEnd) * HOURS_PER_DAY * (Number(h.contribution_pct) || 0) / 100, 0));
    const assignedHrs = Math.round(rowsOfPerson.reduce((s, h) => s + (hoursByHr[h.id] || 0), 0) * 10) / 10;
    const loadingPct = capacityHrs > 0 ? Math.round((assignedHrs / capacityHrs) * 100) : (assignedHrs > 0 ? null : 0);
    const bookedUsePct = allocatedHrs > 0 ? Math.round((assignedHrs / allocatedHrs) * 100) : null;

    let status = 'ok';
    if (allocationPct > 100) {
      status = 'over-allocated';
      errors.push({ code: 'over-allocated', member: name, message: `${name}${ipn ? ` (${ipn})` : ''} is allocated ${allocationPct}% across ${roles.join(' + ')} - one person cannot exceed 100%. Lower the shares or move a role to someone else.` });
    } else if (assignedHrs > 0 && workingDays === 0) {
      status = 'no-time';
      errors.push({ code: 'no-working-days', member: name, message: `${name} has ${assignedHrs}h of WBS tasks but no working days in their date window (${start || '?'} - ${end || '?'}).` });
    } else if (assignedHrs > capacityHrs) {
      status = 'overloaded';
      // task hours scale with %, so the % that would just fit their full-time hours:
      const maxPct = Math.floor(allocationPct * capacityHrs / assignedHrs);
      warnings.push({ code: 'overloaded', member: name, message: `${name} would get ${assignedHrs}h of WBS tasks but has only ${capacityHrs}h of working time (${workingDays} working days, ${start} - ${end}, full-time) - ${loadingPct}% loaded. Lower their ${allocationPct}% to at most ${maxPct}% and give the rest of the role to another person, or extend their dates.` });
    } else if (assignedHrs > 0 && bookedUsePct !== null && bookedUsePct < UNDERLOAD_PCT) {
      status = 'underloaded';
      info.push({ code: 'underloaded', member: name, message: `${name}'s WBS tasks (${assignedHrs}h) fill only ${bookedUsePct}% of the ${allocatedHrs}h their ${allocationPct}% books them for - their % could be lowered.` });
    } else if (!assignedHrs) {
      status = 'no-tasks';
    }

    if (!ipn && assignedHrs > 0) {
      warnings.push({ code: 'no-ipn', member: name, message: `${name} has no Resource IPN - their WBS tasks would have a blank JIRA assignee.` });
    }
    if (!placeholder && projStart && projEnd && (start < projStart || end > projEnd)) {
      warnings.push({ code: 'outside-schedule', member: name, message: `${name}'s dates (${start} - ${end}) fall outside the project schedule (${projStart} - ${projEnd}).` });
    }
    members.push({ name, ipn, roles, allocationPct, start, end, workingDays, capacityHrs, allocatedHrs, assignedHrs, loadingPct, bookedUsePct, status, placeholder });
  }

  const totalAssigned = Math.round(members.reduce((s, m) => s + m.assignedHrs, 0));
  const totalAllocated = Math.round(members.reduce((s, m) => s + m.allocatedHrs, 0));
  return {
    ready: true,
    members, errors, warnings, info,
    totals: { assignedHrs: totalAssigned, allocatedHrs: totalAllocated, effortHrs: calc.totalEffHr, projectStart: projStart, projectEnd: projEnd, tasks: rows.length }
  };
}

// Resource loading for the UI (Messages panel, WBS panel) - read-only.
async function resourceLoading(projectId) {
  const project = (await db.query('SELECT * FROM projects WHERE id=$1', [projectId])).rows[0];
  if (!project) throw new Error('Project not found');
  const missing = missingBasics(project);
  if (missing.length) return { ready: false, missing, members: [], errors: [], warnings: [], info: [] };
  const plan = await planWbs(projectId);
  if (!plan.hrRows.length) return { ready: true, noTeam: true, members: [], errors: [], warnings: [], info: [] };
  return checkResourceLoading(plan);
}

const bullets = (items) => items.map((x) => `\n - ${x.message}`).join('');

// force: generate despite resource-loading warnings (the user confirmed them).
async function generateWbs(projectId, { force = false } = {}) {
  const projRes = await db.query('SELECT * FROM projects WHERE id=$1', [projectId]);
  if (projRes.rowCount === 0) throw new Error('Project not found');

  // Check what the schedule/estimates need before changing anything.
  const missing = missingBasics(projRes.rows[0]);
  if (missing.length) {
    throw new WbsError(`Cannot generate the WBS yet - the project needs ${missing.join(' and ')}. ` +
      `Set ${missing.length > 1 ? 'them' : 'it'} in the New Project wizard (Create Project step) or the Data Sheet (Projects Summary).`);
  }
  const seededTeam = await seedDefaultHrPlan(projectId);
  const plan = await planWbs(projectId);
  const { project, hrRows, templates, rows } = plan;

  if (!rows.length) {
    const roles = [...new Set(hrRows.map((h) => String(h.role_acronym || '').trim()).filter(Boolean))];
    const templateRoles = [...new Set(templates.map((t) => t.role_acronym))];
    throw new WbsError(`No WBS tasks were generated: none of the HR plan roles (${roles.join(', ') || 'none'}) ` +
      `has task templates. Roles with templates: ${templateRoles.join(', ')}. Add at least one of these to the HR plan.`);
  }

  const loading = checkResourceLoading(plan);
  if (loading.errors.length) {
    throw new WbsError(`Cannot generate the WBS - fix the resource loading in the HR plan first:${bullets(loading.errors)}`,
      { code: 'RESOURCE_ERRORS', details: loading });
  }
  if (loading.warnings.length && !force) {
    throw new WbsError(`Resource loading needs a look before generating the WBS:${bullets(loading.warnings)}`,
      { status: 409, code: 'RESOURCE_WARNINGS', details: loading });
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

  return { generated: rows.length, projectKey: project.project_key, seededTeam, warningsAccepted: force ? loading.warnings.length : 0 };
}

module.exports = { generateWbs, seedDefaultHrPlan, resourceLoading, countWorkingDays, WbsError, roleKey };
