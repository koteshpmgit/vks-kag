// REST API for the Key Artifact Generator
const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const db = require('../db');
const { computeProject } = require('../services/calc');
const { generateWbs } = require('../services/wbs');
const { rowsToXls, rowsToCsv, rowsToHtml, rowsToPdf } = require('../services/exporter');
const { buildArtifactRows } = require('../services/artifacts');
const { generateTimesheet, getTimesheet, timesheetRows, dayNameFor } = require('../services/timesheet');
const { extractFromSrs } = require('../services/ai');

const router = express.Router();
const SRS_MAX_MB = 10; // keep <= client_max_body_size in frontend/nginx.conf.template
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: SRS_MAX_MB * 1024 * 1024 } });
// multer errors (e.g. file too large) would otherwise fall through to Express's
// default HTML error page - return them as JSON like every other API error.
const uploadSingle = (field) => (req, res, next) => upload.single(field)(req, res, (err) => {
  if (!err) return next();
  const msg = err.code === 'LIMIT_FILE_SIZE' ? `File is too large (max ${SRS_MAX_MB} MB)` : err.message;
  res.status(400).json({ error: msg });
});
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

// Projects belong to the logged-in user who created them (owner_user_id, set
// in POST /projects below). Runs before every /projects/:id... route.
// owner_user_id === null covers pre-auth/seeded projects, which stay
// accessible to any signed-in user rather than becoming permanently orphaned.
router.use('/projects/:id', (req, res, next) => {
  db.query('SELECT owner_user_id FROM projects WHERE id=$1', [req.params.id])
    .then((r) => {
      if (!r.rows[0]) return res.status(404).json({ error: 'Project not found' });
      if (r.rows[0].owner_user_id !== null && r.rows[0].owner_user_id !== req.userId) {
        return res.status(403).json({ error: 'Not authorized for this project' });
      }
      next();
    })
    .catch((e) => { console.error(e); res.status(500).json({ error: e.message }); });
});

// ---------------- Application (Application-Data section) ----------------
// Scoped to the requesting project's own application_id (set at project
// creation, see POST /projects) so each project shows its own Application
// Details instead of always falling back to whichever application row was
// created first. ?project_id is optional only for backwards compatibility;
// every current caller (ProjectDataContext) always sends it.
router.get('/application', wrap(async (req, res) => {
  const pid = req.query.project_id;
  if (pid && /^\d+$/.test(String(pid))) {
    const p = await db.query('SELECT application_id FROM projects WHERE id=$1', [pid]);
    if (p.rows[0]?.application_id) {
      const r = await db.query('SELECT * FROM applications WHERE id=$1', [p.rows[0].application_id]);
      return res.json(r.rows[0] || null);
    }
  }
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
  const r = await db.query('SELECT * FROM projects WHERE owner_user_id=$1 ORDER BY id', [req.userId]);
  res.json(r.rows);
}));

// Creates a project owned by userId, with default phases, milestones and a
// first module (shared by POST /projects and the SRS-first POST /srs).
async function createProject(userId, f = {}) {
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

    // Every new project gets its own blank Application Details row rather
    // than reusing/inheriting whichever application was created first (e.g.
    // the seeded sample data) - Application-Data should start empty for a
    // fresh project, not pre-filled with someone else's example.
    let applicationId = f.application_id || null;
    if (!applicationId) {
      const appRow = await client.query('INSERT INTO applications (app_name) VALUES ($1) RETURNING id', ['']);
      applicationId = appRow.rows[0].id;
    }

    const r = await client.query(
      `INSERT INTO projects (owner_user_id, application_id, project_key, fp_count, productivity_factor, project_type,
         technology, brief_desc, scope, start_date, software_req, hardware_req, quality_objective,
         life_cycle, shared_folder_path, other_info, avg_daily_res_pct, doc_owner_ipn, naming_convention)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING *`,
      [
        userId,
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
    return project;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

router.post('/projects', wrap(async (req, res) => {
  res.status(201).json(await createProject(req.userId, req.body || {}));
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

// ---------------- SRS (requirements document) upload + AI extraction ----------------
// Must stay registered before the generic /projects/:id/:coll route below,
// otherwise Express matches that catch-all first and this never runs.
// Reads the text out of an uploaded SRS file; returns { text } or { error }.
async function readSrsText(file) {
  if (!file) return { error: 'No file uploaded' };
  const name = file.originalname || 'srs.txt';
  const ext = (name.split('.').pop() || '').toLowerCase();

  let text;
  if (ext === 'pdf') {
    try {
      text = (await pdfParse(file.buffer)).text;
    } catch (e) {
      return { error: `Could not read this PDF (${e.message || e}). Try re-saving it as PDF, or upload a .txt/.md export instead.` };
    }
  } else {
    text = file.buffer.toString('utf8');
  }
  if (!text || !text.trim()) return { error: 'Could not read any text from the uploaded file (supported: .txt, .md, .pdf)' };
  return { name, text };
}

// Stores the SRS text for a project, runs AI extraction and saves the
// project/analysis/design results. Extraction failures are returned (not
// thrown) so the caller can let the user continue without AI.
async function saveSrs(projectId, name, text) {
  const document = (await db.query(
    'INSERT INTO srs_documents (project_id, filename, raw_text) VALUES ($1,$2,$3) RETURNING id, filename, uploaded_at',
    [projectId, name, text]
  )).rows[0];

  let extracted;
  try {
    extracted = await extractFromSrs(text);
  } catch (e) {
    return { document, extracted: false, error: e.message };
  }

  const p = extracted.project || {};
  await db.query(
    `UPDATE projects SET
       brief_desc  = COALESCE(NULLIF($1,''), brief_desc),
       scope       = COALESCE(NULLIF($2,''), scope),
       technology  = COALESCE(NULLIF($3,''), technology),
       software_req= COALESCE(NULLIF($4,''), software_req),
       hardware_req= COALESCE(NULLIF($5,''), hardware_req),
       life_cycle  = COALESCE(NULLIF($6,''), life_cycle)
     WHERE id=$7`,
    [srsText(p.brief_desc), srsText(p.scope), srsText(p.technology), srsText(p.software_req), srsText(p.hardware_req), srsText(p.life_cycle), projectId]
  );

  const a = extracted.analysis || {};
  await db.query(
    `INSERT INTO srs_analysis (project_id, business_requirements, functional_requirements, non_functional_requirements, use_cases, data_entities, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,now())
     ON CONFLICT (project_id) DO UPDATE SET
       business_requirements=$2, functional_requirements=$3, non_functional_requirements=$4,
       use_cases=$5, data_entities=$6, updated_at=now()`,
    [projectId, JSON.stringify(a.business_requirements || []), JSON.stringify(a.functional_requirements || []),
      JSON.stringify(a.non_functional_requirements || []), JSON.stringify(a.use_cases || []), JSON.stringify(a.data_entities || [])]
  );

  const d = extracted.design || {};
  await db.query(
    `INSERT INTO srs_design (project_id, architecture_overview, components, api_endpoints, db_design, sequence_flows, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,now())
     ON CONFLICT (project_id) DO UPDATE SET
       architecture_overview=$2, components=$3, api_endpoints=$4, db_design=$5, sequence_flows=$6, updated_at=now()`,
    [projectId, d.architecture_overview || '', JSON.stringify(d.components || []), JSON.stringify(d.api_endpoints || []),
      JSON.stringify(d.db_design || []), JSON.stringify(d.sequence_flows || [])]
  );

  await saveWizardData(projectId, extracted.wizard || {});

  const project = (await db.query('SELECT * FROM projects WHERE id=$1', [projectId])).rows[0];
  return { document, extracted: true, project, analysis: a, design: d, wizard: extracted.wizard || {} };
}

// Saves the SRS's project-setup data (what the New Project wizard asks for)
// into the project's own tables, so the wizard opens pre-filled. Never
// overwrites what the user already entered: text fields are only filled when
// blank, and a list section only when it has no rows yet.
// Placeholder values the model sometimes emits instead of leaving a field out.
const PLACEHOLDER = /^[<\[(]?\s*(unknown|n\/?a|none|not (specified|stated|mentioned|provided|available)|tbd|-+)\s*[>\])]?\.?$/i;
const srsText = (v) => {
  const t = v == null ? '' : String(v).trim();
  return PLACEHOLDER.test(t) ? '' : t;
};

async function saveWizardData(projectId, w) {
  const str = srsText;
  const int = (v) => (Number.isFinite(Number(v)) && v !== '' && v != null ? Math.round(Number(v)) : null);

  const p = w.project || {};
  const fp = int(p.fp_count_estimate);
  await db.query(
    `UPDATE projects SET
       fp_count = CASE WHEN COALESCE(fp_count, 0) = 0 AND $1::int IS NOT NULL THEN GREATEST($1::int, 10) ELSE fp_count END,
       quality_objective = COALESCE(NULLIF(quality_objective, ''), NULLIF($2, ''))
     WHERE id=$3`,
    [fp, str(p.quality_objective), projectId]
  );

  const APP_KEYS = ['app_name', 'domain', 'category', 'description', 'acceptance_criteria', 'technology', 'scope', 'life_cycle'];
  const app = w.application || {};
  await db.query(
    `UPDATE applications SET ${APP_KEYS.map((k, i) => `${k} = COALESCE(NULLIF(${k}, ''), NULLIF($${i + 1}, ''), ${k})`).join(', ')}
     WHERE id = (SELECT application_id FROM projects WHERE id=$${APP_KEYS.length + 1})`,
    [...APP_KEYS.map((k) => str(app[k])), projectId]
  );

  const hasRows = async (table, where = '', params = []) =>
    (await db.query(`SELECT 1 FROM ${table} WHERE project_id=$1 ${where} LIMIT 1`, [projectId, ...params])).rowCount > 0;
  const insertRows = async (coll, rows) => {
    const c = collections[coll];
    for (const row of rows) {
      const params = c.cols.map((_, i) => `$${i + 2}`).join(',');
      await db.query(`INSERT INTO ${c.table} (project_id, ${c.cols.join(',')}) VALUES ($1, ${params})`,
        [projectId, ...c.cols.map((col) => (row[col] === '' || row[col] == null ? null : row[col]))]);
    }
  };
  const arr = (v) => (Array.isArray(v) ? v : []);
  const numbered = (rows) => rows.map((r, i) => ({ sno: i + 1, ...r }));

  const simple = {
    hardware: arr(w.hardware).filter((r) => str(r.description))
      .map((r) => ({ description: str(r.description), spec: str(r.spec), quantity: int(r.quantity) })),
    software: arr(w.software).filter((r) => str(r.description))
      .map((r) => ({ description: str(r.description), version: str(r.version), installations: int(r.installations) })),
    environments: arr(w.environments).filter((r) => str(r.env_name))
      .map((r) => ({ env_name: str(r.env_name), server_path: str(r.server_path), access_type: str(r.access_type) })),
    docs: arr(w.docs).filter((r) => str(r.name))
      .map((r) => ({ name: str(r.name), version: str(r.version), copy_type: str(r.copy_type) })),
    training: arr(w.training).filter((r) => str(r.name))
      .map((r) => ({ name: str(r.name), train_type: str(r.train_type), participants: str(r.participants) })),
    goals: arr(w.goals).filter((r) => str(r.metric_name))
      .map((r) => ({ metric_name: str(r.metric_name), frequency: str(r.frequency), target: str(r.target) }))
  };
  for (const [coll, rows] of Object.entries(simple)) {
    if (rows.length && !(await hasRows(collections[coll].table))) {
      const withSno = collections[coll].cols.includes('sno') ? numbered(rows) : rows;
      await insertRows(coll, withSno);
    }
  }

  for (const [key, kind] of [['constraints', 'constraint'], ['dependencies', 'dependency'], ['assumptions', 'assumption'], ['risks', 'risk']]) {
    const rows = arr(w[key]).map(str).filter(Boolean);
    if (rows.length && !(await hasRows('list_items', 'AND kind=$2', [kind]))) {
      await insertRows('lists', rows.map((description, i) => ({ kind, sno: i + 1, description })));
    }
  }

  // modules: POST /projects seeds one placeholder row (named after the
  // project key, everything else blank) - replace it, but keep real rows.
  const modules = arr(w.modules).filter((r) => str(r.name))
    .map((r, i) => ({ sno: i + 1, name: str(r.name), description: str(r.description) }));
  if (modules.length) {
    await db.query(
      `DELETE FROM modules m USING projects p
       WHERE m.project_id=$1 AND p.id=m.project_id AND m.name=p.project_key
         AND COALESCE(m.description,'')='' AND COALESCE(m.dev_res,'')='' AND COALESCE(m.tl_res,'')='' AND COALESCE(m.testers,'')=''`,
      [projectId]
    );
    if (!(await hasRows('modules'))) await insertRows('modules', modules);
  }
}

router.post('/projects/:id/srs', uploadSingle('file'), wrap(async (req, res) => {
  const { name, text, error } = await readSrsText(req.file);
  if (error) return res.status(400).json({ error });
  res.json(await saveSrs(req.params.id, name, text));
}));

// First screen after login: create a new project straight from an SRS
// upload. The file is read before the project is created, so an unreadable
// file doesn't leave an empty project behind.
router.post('/srs', uploadSingle('file'), wrap(async (req, res) => {
  const { name, text, error } = await readSrsText(req.file);
  if (error) return res.status(400).json({ error });
  const projectKey = String(req.body?.project_key || '').trim() || name.replace(/\.[^.]+$/, '').slice(0, 40);
  const created = await createProject(req.userId, { project_key: projectKey });
  const result = await saveSrs(created.id, name, text);
  res.status(201).json({ ...result, project: result.project || created });
}));

router.get('/projects/:id/srs', wrap(async (req, res) => {
  const [document] = (await db.query(
    'SELECT id, filename, uploaded_at FROM srs_documents WHERE project_id=$1 ORDER BY id DESC LIMIT 1', [req.params.id]
  )).rows;
  const [analysis] = (await db.query('SELECT * FROM srs_analysis WHERE project_id=$1', [req.params.id])).rows;
  const [design] = (await db.query('SELECT * FROM srs_design WHERE project_id=$1', [req.params.id])).rows;
  res.json({ document: document || null, analysis: analysis || null, design: design || null });
}));

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
