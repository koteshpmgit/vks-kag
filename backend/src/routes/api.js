// REST API for the Key Artifact Generator
const express = require('express');
const db = require('../db');
const { computeProject } = require('../services/calc');
const { generateWbs } = require('../services/wbs');
const { rowsToXls, rowsToCsv, rowsToHtml, rowsToPdf } = require('../services/exporter');
const { buildArtifactRows } = require('../services/artifacts');
const { generateTimesheet, getTimesheet, timesheetRows, dayNameFor } = require('../services/timesheet');

const router = express.Router();
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error(e);
  res.status(500).json({ error: e.message });
});

// :id / :rowId are always numeric primary keys - reject non-numeric values with a
// clean 400 here, instead of letting them reach the DB as an "invalid input syntax
// for type integer" error that wrap() would otherwise surface as a raw 500.
// (router.param only accepts one name per call in this Express version - it does
// not fan out over an array.)
const validateNumericParam = (req, res, next, value, name) => {
  if (!/^\d+$/.test(value)) return res.status(400).json({ error: `Invalid ${name}: must be a positive integer` });
  next();
};
router.param('id', validateNumericParam);
router.param('rowId', validateNumericParam);

// ---------------- Application (Application-Data section) ----------------
router.get('/application', wrap(async (req, res) => {
  const r = await db.query('SELECT * FROM applications ORDER BY id LIMIT 1');
  res.json(r.rows[0] || null);
}));

router.put('/application/:id', wrap(async (req, res) => {
  const f = req.body;
  const r = await db.query(
    `UPDATE applications SET app_name=$1, irn_no=$2, app_size_fp=$3, front_office=$4, domain=$5,
       category=$6, description=$7, acceptance_criteria=$8, life_cycle=$9, dcv=$10, cvs=$11,
       technology=$12, scope=$13, org_chart_link=$14, quality_plan_link=$15, corfou_link=$16,
       hr_plan_link=$17, radar_link=$18
     WHERE id=$19 RETURNING *`,
    [f.app_name, f.irn_no, f.app_size_fp || null, f.front_office, f.domain, f.category,
      f.description, f.acceptance_criteria, f.life_cycle, f.dcv, f.cvs, f.technology, f.scope,
      f.org_chart_link, f.quality_plan_link, f.corfou_link, f.hr_plan_link, f.radar_link,
      req.params.id]
  );
  res.json(r.rows[0]);
}));

// ---------------- Resources (Resource-Data section) ----------------
router.get('/resources', wrap(async (req, res) => {
  const r = await db.query(`SELECT *, (last_name || ' ' || first_name) AS full_name
                            FROM resources ORDER BY id`);
  res.json(r.rows);
}));

router.post('/resources', wrap(async (req, res) => {
  const f = req.body;
  const r = await db.query(
    `INSERT INTO resources (ipn, role, role_desc, first_name, last_name, phone)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [f.ipn, f.role, f.role_desc, f.first_name, f.last_name, f.phone]);
  res.json(r.rows[0]);
}));

router.put('/resources/:id', wrap(async (req, res) => {
  const f = req.body;
  const r = await db.query(
    `UPDATE resources SET ipn=$1, role=$2, role_desc=$3, first_name=$4, last_name=$5, phone=$6
     WHERE id=$7 RETURNING *`,
    [f.ipn, f.role, f.role_desc, f.first_name, f.last_name, f.phone, req.params.id]);
  res.json(r.rows[0]);
}));

router.delete('/resources/:id', wrap(async (req, res) => {
  await db.query('DELETE FROM resources WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
}));

// ---------------- Projects (Project-Data section) ----------------
router.get('/projects', wrap(async (req, res) => {
  const r = await db.query('SELECT * FROM projects ORDER BY id');
  res.json(r.rows);
}));

router.post('/projects', wrap(async (req, res) => {
  const f = req.body || {};
  const app = await db.query('SELECT id FROM applications ORDER BY id LIMIT 1');
  const applicationId = f.application_id || app.rows[0]?.id || null;
  const phaseDefaults = [
    ['Analysis', 8], ['Design', 11], ['Design Review', 3], ['Coding', 20],
    ['Code Review', 4], ['Unit Testing', 6], ['System Testing', 24],
    ['PM', 10], ['PAT/UAT Support', 10], ['Other Efforts', 4]
  ];
  const milestoneDefaults = [
    'Requirement Analysis', 'Design', 'Coding & UTC execution', 'System test cycle 1',
    'System test cycle 2', 'PAT Delivery', 'PAT Support', 'UAT Support', 'Go - Live'
  ];

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      `INSERT INTO projects (application_id, project_key, fp_count, productivity_factor, project_type,
         technology, brief_desc, scope, start_date, software_req, hardware_req, quality_objective,
         life_cycle, shared_folder_path, other_info, avg_daily_res_pct, doc_owner_ipn, naming_convention)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [
        applicationId,
        f.project_key || `NEW PROJECT ${Date.now().toString().slice(-5)}`,
        f.fp_count || 0,
        f.productivity_factor || 1,
        f.project_type || 'MQC',
        f.technology || '',
        f.brief_desc || '',
        f.scope || '',
        f.start_date || null,
        f.software_req || '',
        f.hardware_req || '',
        f.quality_objective || '',
        f.life_cycle || '',
        f.shared_folder_path || '',
        f.other_info || '',
        f.avg_daily_res_pct || 80,
        f.doc_owner_ipn || '',
        f.naming_convention || ''
      ]
    );
    const project = r.rows[0];

    for (const [i, [phase, pct]] of phaseDefaults.entries()) {
      await client.query(
        'INSERT INTO phase_efforts (project_id, seq, phase, pct) VALUES ($1,$2,$3,$4)',
        [project.id, i + 1, phase, pct]
      );
    }
    for (const [i, name] of milestoneDefaults.entries()) {
      await client.query(
        'INSERT INTO milestones (project_id, seq, name, deliverable) VALUES ($1,$2,$3,$4)',
        [project.id, i + 1, name, '']
      );
    }
    await client.query(
      'INSERT INTO modules (project_id, sno, name, description, dev_res, tl_res, testers) VALUES ($1,1,$2,$3,$4,$5,$6)',
      [project.id, project.project_key, '', '', '', '']
    );

    await client.query('COMMIT');
    res.status(201).json(project);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

router.get('/projects/:id', wrap(async (req, res) => {
  const r = await db.query('SELECT * FROM projects WHERE id=$1', [req.params.id]);
  if (!r.rowCount) return res.status(404).json({ error: 'not found' });
  res.json(r.rows[0]);
}));

router.put('/projects/:id', wrap(async (req, res) => {
  const f = req.body;
  const r = await db.query(
    `UPDATE projects SET project_key=$1, fp_count=$2, productivity_factor=$3, project_type=$4,
       technology=$5, brief_desc=$6, scope=$7, start_date=$8, software_req=$9, hardware_req=$10,
       quality_objective=$11, life_cycle=$12, shared_folder_path=$13, other_info=$14,
       avg_daily_res_pct=$15, doc_owner_ipn=$16, naming_convention=$17
     WHERE id=$18 RETURNING *`,
    [f.project_key, f.fp_count || 0, f.productivity_factor || 1, f.project_type, f.technology,
      f.brief_desc, f.scope, f.start_date || null, f.software_req, f.hardware_req,
      f.quality_objective, f.life_cycle, f.shared_folder_path, f.other_info,
      f.avg_daily_res_pct || 80, f.doc_owner_ipn, f.naming_convention, req.params.id]
  );
  res.json(r.rows[0]);
}));

// Computed values (effort, milestones, schedule) - the "formulas" of the Data Sheet
router.get('/projects/:id/computed', wrap(async (req, res) => {
  const pid = req.params.id;
  const [proj, phases, hr] = await Promise.all([
    db.query('SELECT * FROM projects WHERE id=$1', [pid]),
    db.query('SELECT * FROM phase_efforts WHERE project_id=$1 ORDER BY seq', [pid]),
    db.query('SELECT * FROM hr_plan WHERE project_id=$1 ORDER BY sno', [pid])
  ]);
  if (!proj.rowCount) return res.status(404).json({ error: 'not found' });
  res.json(computeProject(proj.rows[0], phases.rows, hr.rows));
}));

// ---------------- WBS (Generate WBS button / GenWBS2 macro) ----------------
// registered before the generic ':coll' routes so 'wbs' is not swallowed by them
router.post('/projects/:id/wbs/generate', wrap(async (req, res) => {
  res.json(await generateWbs(req.params.id));
}));

router.get('/projects/:id/wbs', wrap(async (req, res) => {
  const r = await db.query('SELECT * FROM wbs_tasks WHERE project_id=$1 ORDER BY id', [req.params.id]);
  res.json(r.rows);
}));

// WBS row CRUD (edit the generated WBS)
const WBS_COLS = ['project_key', 'assignee', 'summary', 'description', 'start_date', 'end_date',
  'phase', 'task_type', 'component', 'est_hours'];

router.post('/projects/:id/wbs', wrap(async (req, res) => {
  const f = req.body || {};
  if (!f.project_key) {
    const p = await db.query('SELECT project_key FROM projects WHERE id=$1', [req.params.id]);
    f.project_key = p.rows[0]?.project_key || '';
  }
  const vals = WBS_COLS.map((c) => f[c] === '' ? null : (f[c] ?? null));
  const params = WBS_COLS.map((_, i) => `$${i + 2}`).join(',');
  const r = await db.query(
    `INSERT INTO wbs_tasks (project_id, ${WBS_COLS.join(',')}) VALUES ($1, ${params}) RETURNING *`,
    [req.params.id, ...vals]);
  res.status(201).json(r.rows[0]);
}));

router.put('/projects/:id/wbs/:rowId', wrap(async (req, res) => {
  const f = req.body || {};
  const sets = WBS_COLS.map((c, i) => `${c}=$${i + 1}`).join(',');
  const vals = WBS_COLS.map((c) => f[c] === '' ? null : (f[c] ?? null));
  const r = await db.query(
    `UPDATE wbs_tasks SET ${sets} WHERE id=$${WBS_COLS.length + 1} AND project_id=$${WBS_COLS.length + 2} RETURNING *`,
    [...vals, req.params.rowId, req.params.id]);
  res.json(r.rows[0]);
}));

router.delete('/projects/:id/wbs/:rowId', wrap(async (req, res) => {
  await db.query('DELETE FROM wbs_tasks WHERE id=$1 AND project_id=$2', [req.params.rowId, req.params.id]);
  res.json({ ok: true });
}));

// ---------------- Timesheet (Generate Timesheet button) ----------------
// Day-wise explosion of the generated WBS tasks (also before the ':coll' routes).
// Generation persists rows; entries are then editable via the CRUD routes below.
router.post('/projects/:id/timesheet/generate', wrap(async (req, res) => {
  res.json(await generateTimesheet(req.params.id));
}));

router.get('/projects/:id/timesheet', wrap(async (req, res) => {
  res.json(await getTimesheet(req.params.id));
}));

const TS_COLS = ['entry_date', 'day_name', 'assignee', 'project_key', 'summary', 'phase', 'task_type', 'hours'];

function tsBody(req) {
  const f = req.body || {};
  return {
    entry_date: f.date || f.entry_date || null,
    day_name: dayNameFor(f.date || f.entry_date),          // recomputed from the date
    assignee: f.assignee ?? null,
    project_key: f.project_key ?? null,
    summary: f.summary ?? null,
    phase: f.phase ?? null,
    task_type: f.task_type ?? null,
    hours: f.hours === '' ? null : (f.hours ?? null)
  };
}

router.post('/projects/:id/timesheet', wrap(async (req, res) => {
  const f = tsBody(req);
  if (!f.project_key) {
    const p = await db.query('SELECT project_key FROM projects WHERE id=$1', [req.params.id]);
    f.project_key = p.rows[0]?.project_key || '';
  }
  const vals = TS_COLS.map((c) => f[c]);
  const params = TS_COLS.map((_, i) => `$${i + 2}`).join(',');
  const r = await db.query(
    `INSERT INTO timesheet_entries (project_id, ${TS_COLS.join(',')}) VALUES ($1, ${params}) RETURNING *`,
    [req.params.id, ...vals]);
  res.status(201).json(r.rows[0]);
}));

router.put('/projects/:id/timesheet/:rowId', wrap(async (req, res) => {
  const f = tsBody(req);
  const sets = TS_COLS.map((c, i) => `${c}=$${i + 1}`).join(',');
  const vals = TS_COLS.map((c) => f[c]);
  const r = await db.query(
    `UPDATE timesheet_entries SET ${sets} WHERE id=$${TS_COLS.length + 1} AND project_id=$${TS_COLS.length + 2} RETURNING *`,
    [...vals, req.params.rowId, req.params.id]);
  res.json(r.rows[0]);
}));

router.delete('/projects/:id/timesheet/:rowId', wrap(async (req, res) => {
  await db.query('DELETE FROM timesheet_entries WHERE id=$1 AND project_id=$2', [req.params.rowId, req.params.id]);
  res.json({ ok: true });
}));

router.get('/projects/:id/timesheet/export', wrap(async (req, res) => {
  const fmt = ['csv', 'html', 'pdf'].includes(req.query.format) ? req.query.format : 'xls';
  const ts = await getTimesheet(req.params.id, { computeIfEmpty: true });
  const rows = timesheetRows(ts);
  const fname = `${ts.projectKey}-Timesheet.${fmt}`.replace(/[^\w .-]+/g, '_');
  res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
  const docTitle = `${ts.projectKey} — Timesheet`;
  if (fmt === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send('﻿' + rowsToCsv(rows));
  } else if (fmt === 'html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(rowsToHtml(docTitle, rows));
  } else if (fmt === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.send(await rowsToPdf(docTitle, rows));
  } else {
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.send(rowsToXls('Timesheet', rows));
  }
}));

// ---------------- Generic project sub-collections ----------------
const collections = {
  hrplan: { table: 'hr_plan', cols: ['sno', 'role_acronym', 'role_name', 'resource_name', 'resource_ipn', 'contribution_pct', 'start_date', 'end_date'] },
  phases: { table: 'phase_efforts', cols: ['seq', 'phase', 'pct'] },
  milestones: { table: 'milestones', cols: ['seq', 'name', 'start_date', 'end_date', 'deliverable'] },
  hardware: { table: 'hardware_requirements', cols: ['sno', 'description', 'spec', 'quantity', 'start_date', 'end_date'] },
  software: { table: 'software_requirements', cols: ['sno', 'description', 'version', 'installations', 'start_date', 'end_date'] },
  lists: { table: 'list_items', cols: ['kind', 'sno', 'description'] },
  docs: { table: 'docs_handed', cols: ['name', 'version', 'copy_type'] },
  goals: { table: 'project_goals', cols: ['sno', 'metric_name', 'frequency', 'target', 'commitment', 'source', 'storage'] },
  training: { table: 'training_plan', cols: ['sno', 'name', 'train_type', 'participants', 'start_date', 'end_date'] },
  process: { table: 'process_planning', cols: ['sno', 'process_name', 'applicable', 'tailoring'] },
  environments: { table: 'dev_environments', cols: ['env_name', 'server_path', 'access_type'] },
  dar: { table: 'decision_analysis', cols: ['sno', 'task', 'participants', 'remarks'] },
  agenda: { table: 'kickoff_agenda', cols: ['sno', 'topic'] },
  modules: { table: 'modules', cols: ['sno', 'name', 'description', 'dev_res', 'tl_res', 'testers'] }
};

router.get('/projects/:id/:coll', wrap(async (req, res, next) => {
  const c = collections[req.params.coll];
  if (!c) return res.status(404).json({ error: 'unknown collection' });
  const order = c.cols.includes('sno') ? 'sno, id' : (c.cols.includes('seq') ? 'seq, id' : 'id');
  const r = await db.query(`SELECT * FROM ${c.table} WHERE project_id=$1 ORDER BY ${order}`, [req.params.id]);
  res.json(r.rows);
}));

router.post('/projects/:id/:coll', wrap(async (req, res) => {
  const c = collections[req.params.coll];
  if (!c) return res.status(404).json({ error: 'unknown collection' });
  const vals = c.cols.map((col) => req.body[col] === '' ? null : (req.body[col] ?? null));
  const params = c.cols.map((_, i) => `$${i + 2}`).join(',');
  const r = await db.query(
    `INSERT INTO ${c.table} (project_id, ${c.cols.join(',')}) VALUES ($1, ${params}) RETURNING *`,
    [req.params.id, ...vals]);
  res.json(r.rows[0]);
}));

router.put('/projects/:id/:coll/:rowId', wrap(async (req, res) => {
  const c = collections[req.params.coll];
  if (!c) return res.status(404).json({ error: 'unknown collection' });
  const sets = c.cols.map((col, i) => `${col}=$${i + 1}`).join(',');
  const vals = c.cols.map((col) => req.body[col] === '' ? null : (req.body[col] ?? null));
  const r = await db.query(
    `UPDATE ${c.table} SET ${sets} WHERE id=$${c.cols.length + 1} AND project_id=$${c.cols.length + 2} RETURNING *`,
    [...vals, req.params.rowId, req.params.id]);
  res.json(r.rows[0]);
}));

router.delete('/projects/:id/:coll/:rowId', wrap(async (req, res) => {
  const c = collections[req.params.coll];
  if (!c) return res.status(404).json({ error: 'unknown collection' });
  await db.query(`DELETE FROM ${c.table} WHERE id=$1 AND project_id=$2`, [req.params.rowId, req.params.id]);
  res.json({ ok: true });
}));

// ---------------- Standards data (full CRUD - editable whenever needed) ----------------
const stdCollections = {
  'roles': { table: 'std_roles', cols: ['role_acronym', 'responsibility'], order: 'id' },
  'tools': { table: 'std_tools', cols: ['sno', 'activity', 'standards', 'tools', 'version'], order: 'sno, id' },
  'stakeholder-matrix': { table: 'stakeholder_matrix', cols: ['activity', 'vh', 'odo', 'po', 'qado', 'qa', 'tdo', 'tos', 'team', 'di', 'sepg', 'fo', 'ssm', 'remarks'], order: 'id' },
  'folder-structure': { table: 'folder_structure', cols: ['phase', 'artifact_folder', 'others'], order: 'id' },
  'task-templates': { table: 'task_templates', cols: ['role_acronym', 'summary', 'description', 'phase', 'task_type', 'start_rule', 'end_rule', 'est_expr', 'fixed_share'], order: 'id' }
};

function stdValue(col, v) {
  if (col === 'fixed_share') return v === true || v === 'true' || v === 'Yes';
  return v === '' ? null : (v ?? null);
}

router.get('/standards/:coll', wrap(async (req, res) => {
  const c = stdCollections[req.params.coll];
  if (!c) return res.status(404).json({ error: 'unknown standards collection' });
  res.json((await db.query(`SELECT * FROM ${c.table} ORDER BY ${c.order}`)).rows);
}));

router.post('/standards/:coll', wrap(async (req, res) => {
  const c = stdCollections[req.params.coll];
  if (!c) return res.status(404).json({ error: 'unknown standards collection' });
  const vals = c.cols.map((col) => stdValue(col, req.body[col]));
  const params = c.cols.map((_, i) => `$${i + 1}`).join(',');
  const r = await db.query(
    `INSERT INTO ${c.table} (${c.cols.join(',')}) VALUES (${params}) RETURNING *`, vals);
  res.status(201).json(r.rows[0]);
}));

router.put('/standards/:coll/:rowId', wrap(async (req, res) => {
  const c = stdCollections[req.params.coll];
  if (!c) return res.status(404).json({ error: 'unknown standards collection' });
  const sets = c.cols.map((col, i) => `${col}=$${i + 1}`).join(',');
  const vals = c.cols.map((col) => stdValue(col, req.body[col]));
  const r = await db.query(
    `UPDATE ${c.table} SET ${sets} WHERE id=$${c.cols.length + 1} RETURNING *`,
    [...vals, req.params.rowId]);
  res.json(r.rows[0]);
}));

router.delete('/standards/:coll/:rowId', wrap(async (req, res) => {
  const c = stdCollections[req.params.coll];
  if (!c) return res.status(404).json({ error: 'unknown standards collection' });
  await db.query(`DELETE FROM ${c.table} WHERE id=$1`, [req.params.rowId]);
  res.json({ ok: true });
}));

// ---------------- Empty WBS template (JIRA upload format, blank rows) ----------------
router.get('/wbs-template', wrap(async (req, res) => {
  const fmt = req.query.format === 'csv' ? 'csv' : 'xls';
  const nRows = Math.min(Number(req.query.rows) || 20, 200);
  const header = ['#Project Key', 'Assignee', 'Task Summary', 'Task Desc',
    'Start Date\n(yyyy-mm-dd)', 'End Date\n(yyyy-mm-dd)', 'Phase', 'Task Type',
    'Component Value', 'Estimated Task\n(HH.MM) (in hours)'];
  const rows = [header.map((h) => ({ v: h, header: true }))];
  for (let i = 0; i < nRows; i++) rows.push(header.map(() => ''));
  const fname = `WBS-Template.${fmt}`;
  if (fmt === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
    res.send('﻿' + rowsToCsv(rows));
  } else {
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
    res.send(rowsToXls('WBS Template', rows));
  }
}));

// ---------------- Artifact export ("Copy To Desktop" button) ----------------
router.get('/projects/:id/export/:artifact', wrap(async (req, res) => {
  const { artifact } = req.params;
  const fmt = ['csv', 'html', 'doc', 'pdf'].includes(req.query.format) ? req.query.format : 'xls';
  const { projectKey, rows } = await buildArtifactRows(req.params.id, artifact);
  const fname = `${projectKey}-${artifact}.${fmt}`.replace(/[^\w .-]+/g, '_');
  res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
  const docTitle = `${projectKey} — ${artifact}`;
  if (fmt === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send('﻿' + rowsToCsv(rows));
  } else if (fmt === 'html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(rowsToHtml(docTitle, rows));
  } else if (fmt === 'doc') {
    // MS Word opens HTML documents natively; serving it as .doc gives a Word file
    res.setHeader('Content-Type', 'application/msword');
    res.send(rowsToHtml(docTitle, rows));
  } else if (fmt === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.send(await rowsToPdf(docTitle, rows));
  } else {
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.send(rowsToXls(artifact, rows));
  }
}));

module.exports = router;
