import React, { useState } from 'react';
import API, { isoDate } from '../../api/client.js';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import { useDialogs } from '../../components/common/Dialogs.jsx';
import { GROUPS, SECTION_META, COLLECTION_COLS, PROJ_FIELDS_CREATE, APP_FIELDS, LIST_KIND_MAP, SectionBody } from '../../data/sections.jsx';

const MIN_ROWS = 2;
const DRAFT_SECTIONS = new Set([
  ...Object.keys(COLLECTION_COLS), ...Object.keys(LIST_KIND_MAP)
]);
// Genuinely org-wide/shared data, same regardless of which project is being
// created - safe to edit live against whatever's in context. Application
// Details is NOT here: each project now gets its own blank application
// record (see POST /projects), so it has to be collected as a draft and
// saved against the project actually being created, not edited live.
const LIVE_SECTIONS = new Set(['resources', 'stdRoles', 'stdTools', 'stdMatrix', 'stdFolders', 'stdTasks']);
const PREVIEW_SECTIONS = new Set(['effort', 'milestones']);

// Must match the phaseDefaults/milestoneDefaults seeded server-side in
// POST /api/projects (backend/src/routes/api.js) - this is a preview only.
const PHASE_DEFAULTS = [
  ['Analysis', 8], ['Design', 11], ['Design Review', 3], ['Coding', 20],
  ['Code Review', 4], ['Unit Testing', 6], ['System Testing', 24],
  ['PM', 10], ['PAT/UAT Support', 10], ['Other Efforts', 4]
];
const MILESTONE_DEFAULTS = [
  'Requirement Analysis', 'Design', 'Coding & UTC execution', 'System test cycle 1',
  'System test cycle 2', 'PAT Delivery', 'PAT Support', 'UAT Support', 'Go - Live'
];

function buildSteps() {
  const steps = [{ id: '__create__', title: 'Create Project', group: null }];
  GROUPS.forEach((g) => {
    g.sections.forEach((sid) => steps.push({ id: sid, title: SECTION_META[sid].title, group: g.label }));
  });
  return steps;
}
const STEPS = buildSteps();

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj?.[k] != null && obj[k] !== '').map((k) => [k, obj[k]]));

// Draft pre-filled from an existing project (e.g. one just created from an SRS
// upload, whose extracted data was saved into these same tables). Rows keep
// their database id so finish() can update/delete them instead of duplicating.
function draftFromProject(data) {
  const project = pick(data.project, PROJ_FIELDS_CREATE.map(([k]) => k));
  if (project.start_date) project.start_date = isoDate(project.start_date);
  if (Number(project.fp_count) === 0) delete project.fp_count;
  const lists = {};
  for (const sid of DRAFT_SECTIONS) {
    const rows = LIST_KIND_MAP[sid]
      ? (data.lists || []).filter((r) => r.kind === LIST_KIND_MAP[sid])
      : (data[sid] || []);
    const cols = COLLECTION_COLS[sid] || [{ key: 'sno' }, { key: 'description' }];
    lists[sid] = rows.map((r) => {
      const row = { id: r.id, _localId: `db-${r.id}` };
      cols.forEach((c) => { row[c.key] = c.type === 'date' ? isoDate(r[c.key]) : (r[c.key] ?? ''); });
      return row;
    });
  }
  return { project, application: pick(data.application, APP_FIELDS.map(([k]) => k)), lists };
}

// projectId set = complete an existing project (pre-filled, saves in place);
// otherwise create a new one from a blank draft. initialStep = a step id to
// open on (e.g. from a Messages panel "fix" button).
export default function Wizard({ onClose, onCreated, projectId = null, initialStep = null }) {
  const { data, reload, reloadProjects, switchProject } = useProjectData();
  const { toast, confirmDialog } = useDialogs();
  const editing = projectId != null && data?.project?.id === projectId;
  const startIdx = Math.max(0, STEPS.findIndex((s) => s.id === initialStep));
  const [stepIdx, setStepIdx] = useState(startIdx);
  const [visited, setVisited] = useState(new Set([0, startIdx]));
  const [errors, setErrors] = useState([]);
  const [original] = useState(() => (editing ? draftFromProject(data) : null));
  const [draft, setDraftState] = useState(() => original || ({
    project: {},
    application: {},
    lists: Object.fromEntries([...DRAFT_SECTIONS].map((k) => [k, []]))
  }));
  const [dirty, setDirty] = useState(false);
  const setDraft = (fn) => { setDirty(true); setDraftState(fn); };

  const step = STEPS[stepIdx];

  const validateStep = (idx) => {
    const s = STEPS[idx];
    if (s.id === '__create__') {
      const p = draft.project;
      const errs = [];
      if (!p.project_key) errs.push('Project Key is required.');
      if (!p.project_type) errs.push('Project Type is required.');
      if (!p.start_date) errs.push('Start Date is required.');
      if (!(Number(p.fp_count) >= 10)) errs.push('FP Count must be at least 10.');
      return errs;
    }
    if (DRAFT_SECTIONS.has(s.id)) {
      const rows = draft.lists[s.id] || [];
      return rows.length < MIN_ROWS ? [`Add at least ${MIN_ROWS} rows before continuing (currently ${rows.length}).`] : [];
    }
    return [];
  };

  const goTo = (idx) => {
    setStepIdx(idx);
    setVisited((v) => new Set([...v, idx]));
    setErrors([]);
  };

  const next = () => {
    const errs = validateStep(stepIdx);
    if (errs.length) { setErrors(errs); return; }
    if (stepIdx < STEPS.length - 1) goTo(stepIdx + 1);
  };
  const prev = () => { if (stepIdx > 0) goTo(stepIdx - 1); };

  const addDraftRow = (sid) => {
    setDraft((d) => ({ ...d, lists: { ...d.lists, [sid]: [...d.lists[sid], { _localId: Date.now() + Math.random(), sno: d.lists[sid].length + 1 }] } }));
  };
  const updateDraftRow = (sid, row, key, val) => {
    setDraft((d) => ({ ...d, lists: { ...d.lists, [sid]: d.lists[sid].map((r) => (r === row ? { ...r, [key]: val } : r)) } }));
  };
  const deleteDraftRow = (sid, row) => {
    setDraft((d) => ({ ...d, lists: { ...d.lists, [sid]: d.lists[sid].filter((r) => r !== row) } }));
  };

  const finish = async () => {
    for (let i = 0; i < STEPS.length; i++) {
      const errs = validateStep(i);
      if (errs.length) { goTo(i); setErrors(errs); return; }
    }
    if (editing) { await saveExisting(); return; }
    try {
      const p = await API.post('/projects', draft.project);
      const failures = [];
      if (p.application_id && Object.keys(draft.application).length) {
        // app_name is NOT NULL in the schema - fall back to the project key
        // so a partially-filled Application Details step (e.g. just Domain)
        // can't fail the save with a constraint violation.
        const appBody = { app_name: draft.project.project_key || '', ...draft.application };
        try { await API.put(`/application/${p.application_id}`, appBody); }
        catch (e) { failures.push(`Application Details: ${e.message}`); }
      }
      for (const [sid, rows] of Object.entries(draft.lists)) {
        for (const row of rows) {
          const { _localId, ...body } = row;
          try {
            if (LIST_KIND_MAP[sid]) {
              await API.post(`/projects/${p.id}/lists`, { ...body, kind: LIST_KIND_MAP[sid] });
            } else {
              await API.post(`/projects/${p.id}/${sid}`, body);
            }
          } catch (e) { failures.push(`${sid}: ${e.message}`); }
        }
      }
      await reloadProjects();
      await switchProject(p.id);
      toast(failures.length ? `Project created with ${failures.length} row(s) failed to save` : 'Project created');
      if (onCreated) onCreated(p);
      else onClose();
    } catch (e) {
      toast('Failed to create project: ' + e.message, true);
    }
  };

  const saveExisting = async () => {
    const failures = [];
    const attempt = async (label, fn) => { try { await fn(); } catch (e) { failures.push(`${label}: ${e.message}`); } };
    await attempt('Project', () => API.put(`/projects/${projectId}`, { ...data.project, ...draft.project }));
    if (data.project.application_id) {
      await attempt('Application Details', () => API.put(`/application/${data.project.application_id}`,
        { ...data.application, ...draft.application, app_name: draft.application.app_name || draft.project.project_key || '' }));
    }
    for (const [sid, rows] of Object.entries(draft.lists)) {
      const coll = LIST_KIND_MAP[sid] ? 'lists' : sid;
      const extra = LIST_KIND_MAP[sid] ? { kind: LIST_KIND_MAP[sid] } : {};
      const keep = new Set(rows.filter((r) => r.id).map((r) => r.id));
      for (const r of original.lists[sid]) {
        if (!keep.has(r.id)) await attempt(sid, () => API.del(`/projects/${projectId}/${coll}/${r.id}`));
      }
      for (const row of rows) {
        const { _localId, id, ...body } = row;
        await attempt(sid, () => (id
          ? API.put(`/projects/${projectId}/${coll}/${id}`, { ...body, ...extra })
          : API.post(`/projects/${projectId}/${coll}`, { ...body, ...extra })));
      }
    }
    await reloadProjects();
    await reload();
    toast(failures.length ? `Project saved with ${failures.length} item(s) failed to save` : 'Project saved');
    if (onCreated) onCreated(data.project);
    else onClose();
  };

  const requestClose = async () => {
    if (dirty) {
      const ans = await confirmDialog(editing ? 'Discard your changes?' : 'Discard this new project draft?', { title: 'Close wizard', buttons: ['Discard', 'Keep editing'] });
      if (ans !== 'Discard') return;
    }
    onClose();
  };

  const progress = Math.round(((stepIdx + 1) / STEPS.length) * 100);

  return (
    <div className="wizard-overlay">
      <div className="modal wizard-panel">
        <div className="wizard-header">
          <div className="wizard-header-top">
            <h2>New Project{editing && <small className="wizard-prefilled"> — pre-filled from {data.srsDocument?.filename || 'your SRS'}</small>}</h2>
            <button className="modal-close" onClick={requestClose}>&times;</button>
          </div>
          <div className="wizard-progress">
            <div className="wizard-progress-track"><span style={{ width: `${progress}%` }} /></div>
            <small>Step {stepIdx + 1} of {STEPS.length} — {step.title}</small>
          </div>
        </div>

        <div className="wizard-body">
          <div className="wizard-steplist">
            {STEPS.map((s, i) => {
              const showGroupLabel = s.group && s.group !== STEPS[i - 1]?.group;
              return (
                <React.Fragment key={s.id}>
                  {showGroupLabel && <div className="wiz-step-group">{s.group}</div>}
                  <button
                    type="button"
                    className={`wiz-step${i === stepIdx ? ' current' : ''}${visited.has(i) ? ' done' : ''}`}
                    onClick={() => goTo(i)}
                  >
                    <span className="wiz-step-num">{i + 1}</span>
                    <span className="wiz-step-label">{s.title}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          <div className="wizard-content">
            {errors.length > 0 && (
              <div className="wizard-errors">&#9888; {errors.join(' ')}</div>
            )}
            <StepBody
              step={step}
              draft={draft}
              setDraft={setDraft}
              addDraftRow={addDraftRow}
              updateDraftRow={updateDraftRow}
              deleteDraftRow={deleteDraftRow}
              hasData={!!data}
            />
          </div>
        </div>

        <div className="wizard-footer">
          <button className="btn btn-light" onClick={prev} disabled={stepIdx === 0}>&larr; Back</button>
          {stepIdx === STEPS.length - 1
            ? <button className="btn btn-accent" onClick={finish}>{editing ? 'Save Project' : 'Create Project'}</button>
            : <button className="btn btn-accent" onClick={next}>Next &rarr;</button>}
        </div>
      </div>
    </div>
  );
}

function StepBody({ step, draft, setDraft, addDraftRow, updateDraftRow, deleteDraftRow, hasData }) {
  if (step.id === '__create__') {
    return (
      <div className="form-grid">
        {PROJ_FIELDS_CREATE.map(([key, label, type, opts]) => (
          <label key={key} className={type === 'multi' ? 'full editable-field' : 'editable-field'}>
            <span>{label}{opts?.hint && <em className="field-hint-inline"> ({opts.hint})</em>}</span>
            {type === 'multi'
              ? <textarea rows={3} value={draft.project[key] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, project: { ...d.project, [key]: e.target.value } }))} />
              : <input
                  type={type === 'date' ? 'date' : (type === 'number' ? 'number' : 'text')}
                  min={opts?.min}
                  value={draft.project[key] ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, project: { ...d.project, [key]: e.target.value } }))}
                />}
          </label>
        ))}
      </div>
    );
  }

  if (step.id === 'appDetails') {
    return (
      <div className="form-grid">
        {APP_FIELDS.map(([key, label, type]) => (
          <label key={key} className={type === 'multi' ? 'full editable-field' : 'editable-field'}>
            <span>{label}</span>
            {type === 'multi'
              ? <textarea rows={3} value={draft.application[key] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, application: { ...d.application, [key]: e.target.value } }))} />
              : <input
                  type="text"
                  value={draft.application[key] ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, application: { ...d.application, [key]: e.target.value } }))}
                />}
          </label>
        ))}
      </div>
    );
  }

  if (step.id === 'projSummary') {
    // Not a list section - it's the same project record collected in
    // "Create Project" plus computed values (effort, dates) that don't
    // exist until the project is actually created. Falling through to the
    // generic draft-list renderer below would show a broken "add row" UI
    // with nothing backing it.
    return (
      <div className="wizard-tip">
        <span className="wizard-tip-icon">&#8505;</span>
        <div><b>Already collected</b><p>The core project details were captured in the Create Project step. The full summary - including computed effort and schedule - will be available once the project is created.</p></div>
      </div>
    );
  }

  if (LIVE_SECTIONS.has(step.id)) {
    // This shared reference data is fetched alongside a project's own data
    // (see ProjectDataContext), so there's nothing to read/save it against
    // yet on someone's very first-ever project (no project exists in
    // context at all until this wizard finishes). Every later project
    // creation has a prior active project in context, so this only shows
    // up once per user.
    if (!hasData) {
      return (
        <div className="wizard-tip">
          <span className="wizard-tip-icon">&#8505;</span>
          <div><b>Available after setup</b><p>{SECTION_META[step.id].title} is shared, org-wide data - you'll be able to fill it in from the Advanced editor once your first project is created.</p></div>
        </div>
      );
    }
    return (
      <div>
        <div className="wizard-tip">
          <span className="wizard-tip-icon">&#8505;</span>
          <div><b>Shared data</b><p>This is application-wide reference data, saved immediately (not part of the project draft).</p></div>
        </div>
        <SectionBody sectionId={step.id} />
      </div>
    );
  }

  if (PREVIEW_SECTIONS.has(step.id)) {
    return (
      <div>
        <div className="wizard-tip">
          <span className="wizard-tip-icon">&#8505;</span>
          <div><b>Set automatically</b><p>Standard {step.id === 'effort' ? 'phases' : 'milestones'} are seeded automatically when the project is created; you can edit them afterwards from the Data Sheet.</p></div>
        </div>
        {step.id === 'effort' ? (
          <table className="tbl"><thead><tr><th>Phase</th><th>%</th></tr></thead>
            <tbody>{PHASE_DEFAULTS.map(([p, pct]) => <tr key={p}><td>{p}</td><td className="num">{pct}%</td></tr>)}</tbody>
          </table>
        ) : (
          <table className="tbl"><thead><tr><th>Milestone</th></tr></thead>
            <tbody>{MILESTONE_DEFAULTS.map((m) => <tr key={m}><td>{m}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    );
  }

  // draft collection / list section
  const cols = COLLECTION_COLS[step.id] || [{ key: 'sno', label: 'S.No' }, { key: 'description', label: 'Description', full: true }];
  const rows = draft.lists[step.id] || [];
  return (
    <div>
      <div className={`wizard-rowcount ${rows.length >= MIN_ROWS ? 'ok' : 'low'}`}>
        {rows.length} row(s) added {rows.length < MIN_ROWS && <span className="wiz-req">— at least {MIN_ROWS} required</span>}
      </div>
      <div className="section-toolbar">
        <button className="act-btn add" title="Add row" onClick={() => addDraftRow(step.id)}>+</button>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr>{cols.map((c) => <th key={c.key}>{c.label}</th>)}<th></th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row._localId}>
                {cols.map((c) => (
                  <td key={c.key}>
                    <input
                      type={c.type === 'date' ? 'date' : (c.type === 'number' ? 'number' : 'text')}
                      defaultValue={row[c.key] ?? ''}
                      onBlur={(e) => updateDraftRow(step.id, row, c.key, e.target.value)}
                    />
                  </td>
                ))}
                <td><button className="act-btn danger" onClick={() => deleteDraftRow(step.id, row)}>&#128465;</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
