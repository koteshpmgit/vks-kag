// Timesheet generation - explodes each generated WBS task into day-wise
// timesheet entries: the task's estimated hours are spread evenly across the
// working days (Mon-Fri) between its start and end dates, with the rounding
// remainder corrected on the last day so the total always matches the estimate.
//
// Generation PERSISTS the rows in timesheet_entries (like GenWBS2 persists the
// WBS), so entries can be edited/added/deleted afterwards via the CRUD API.

const db = require('../db');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MS_DAY = 24 * 3600 * 1000;

function toUtc(d) {
  return new Date(String(d).slice(0, 10) + 'T00:00:00Z');
}

function dayNameFor(date) {
  if (!date) return '';
  return DAY_NAMES[toUtc(date).getUTCDay()];
}

function workingDays(start, end) {
  const days = [];
  if (!start) return days;
  let cur = toUtc(start);
  const last = end ? toUtc(end) : cur;
  // hard cap to keep pathological ranges sane
  for (let i = 0; cur <= last && i < 400; i++, cur = new Date(cur.getTime() + MS_DAY)) {
    const dow = cur.getUTCDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(cur));
  }
  return days;
}

// day-wise entries computed from the stored WBS tasks (not persisted here)
async function computeEntries(projectId) {
  const wbsRes = await db.query(
    'SELECT * FROM wbs_tasks WHERE project_id=$1 ORDER BY assignee, start_date, id', [projectId]);

  const entries = [];
  for (const task of wbsRes.rows) {
    const est = Number(task.est_hours) || 0;
    if (est <= 0) continue;
    let days = workingDays(task.start_date, task.end_date);
    if (!days.length && task.start_date) days = [toUtc(task.start_date)];
    if (!days.length) continue;

    const perDay = Math.floor((est / days.length) * 100) / 100;
    days.forEach((d, i) => {
      // last day absorbs the rounding remainder so the sum equals the estimate
      const hours = i === days.length - 1
        ? Math.round((est - perDay * (days.length - 1)) * 100) / 100
        : perDay;
      if (hours <= 0) return;
      entries.push({
        date: d.toISOString().slice(0, 10),
        day: DAY_NAMES[d.getUTCDay()],
        assignee: task.assignee,
        project_key: task.project_key,
        summary: task.summary,
        phase: task.phase,
        task_type: task.task_type,
        hours
      });
    });
  }
  return { entries, fromTasks: wbsRes.rowCount };
}

function summarize(projectKey, entries, fromTasks) {
  const totalHours = Math.round(entries.reduce((s, e) => s + (Number(e.hours) || 0), 0) * 100) / 100;
  return {
    projectKey,
    generatedFromTasks: fromTasks,
    entries,
    totalHours,
    resources: new Set(entries.map((e) => e.assignee)).size,
    daysCovered: new Set(entries.map((e) => e.date)).size
  };
}

async function projectKeyOf(projectId) {
  const r = await db.query('SELECT project_key FROM projects WHERE id=$1', [projectId]);
  if (!r.rowCount) throw new Error('Project not found');
  return r.rows[0].project_key;
}

// Generate & persist (replaces any previously stored entries)
async function generateTimesheet(projectId) {
  const projectKey = await projectKeyOf(projectId);
  const { entries, fromTasks } = await computeEntries(projectId);

  await db.query('DELETE FROM timesheet_entries WHERE project_id=$1', [projectId]);
  for (const e of entries) {
    await db.query(
      `INSERT INTO timesheet_entries (project_id, entry_date, day_name, assignee, project_key,
         summary, phase, task_type, hours)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [projectId, e.date, e.day, e.assignee, e.project_key, e.summary, e.phase, e.task_type, e.hours]);
  }
  return { generated: entries.length, fromTasks, projectKey };
}

function mapRow(r) {
  return {
    id: r.id,
    date: r.entry_date,
    day: r.day_name,
    assignee: r.assignee,
    project_key: r.project_key,
    summary: r.summary,
    phase: r.phase,
    task_type: r.task_type,
    hours: Number(r.hours) || 0
  };
}

// Read the stored timesheet; optionally compute a preview when nothing is stored
async function getTimesheet(projectId, { computeIfEmpty = false } = {}) {
  const projectKey = await projectKeyOf(projectId);
  const stored = await db.query(
    `SELECT * FROM timesheet_entries WHERE project_id=$1
     ORDER BY assignee, entry_date, summary, id`, [projectId]);
  if (stored.rowCount || !computeIfEmpty) {
    const wbs = await db.query('SELECT COUNT(*)::int AS n FROM wbs_tasks WHERE project_id=$1', [projectId]);
    return { ...summarize(projectKey, stored.rows.map(mapRow), wbs.rows[0].n), stored: true };
  }
  const { entries, fromTasks } = await computeEntries(projectId);
  return { ...summarize(projectKey, entries, fromTasks), stored: false };
}

// rows for the exporter (xls/csv/html/pdf)
function timesheetRows(ts) {
  const rows = [];
  rows.push([{ v: `${ts.projectKey} — Timesheet (day-wise)`, title: true, colspan: 8 }]);
  rows.push([{ v: `${ts.entries.length} entries · ${ts.totalHours} hours · ${ts.resources} resources · ${ts.daysCovered} working days`, bold: true }]);
  rows.push([]);
  rows.push(['Date', 'Day', 'Assignee (IPN)', 'Project Key', 'Task Summary', 'Phase', 'Task Type', 'Hours']
    .map((h) => ({ v: h, header: true })));
  ts.entries.forEach((e) => rows.push([e.date, e.day, e.assignee, e.project_key, e.summary, e.phase, e.task_type, e.hours]));
  rows.push([]);
  rows.push([{ v: 'Total', bold: true }, '', '', '', '', '', '', { v: ts.totalHours, bold: true }]);
  return rows;
}

module.exports = { generateTimesheet, getTimesheet, timesheetRows, dayNameFor };
