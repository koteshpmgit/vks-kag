import React, { useState } from 'react';
import API from '../../api/client.js';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import { useDialogs } from '../../components/common/Dialogs.jsx';
import { GROUPS, SECTION_META, COLLECTION_COLS, PROJ_FIELDS_CREATE, LIST_KIND_MAP, SectionBody } from '../../data/sections.jsx';

const MIN_ROWS = 2;
const DRAFT_SECTIONS = new Set([
  ...Object.keys(COLLECTION_COLS), ...Object.keys(LIST_KIND_MAP)
]);
const LIVE_SECTIONS = new Set(['appDetails', 'resources', 'stdRoles', 'stdTools', 'stdMatrix', 'stdFolders', 'stdTasks']);
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

export default function Wizard({ onClose }) {
  const { reloadProjects, switchProject } = useProjectData();
  const { toast, confirmDialog } = useDialogs();
  const [stepIdx, setStepIdx] = useState(0);
  const [visited, setVisited] = useState(new Set([0]));
  const [errors, setErrors] = useState([]);
  const [draft, setDraft] = useState(() => ({
    project: {},
    lists: Object.fromEntries([...DRAFT_SECTIONS].map((k) => [k, []]))
  }));

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
    try {
      const p = await API.post('/projects', draft.project);
      const failures = [];
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
      onClose();
    } catch (e) {
      toast('Failed to create project: ' + e.message, true);
    }
  };

  const requestClose = async () => {
    const touched = draft.project.project_key || Object.values(draft.lists).some((r) => r.length);
    if (touched) {
      const ans = await confirmDialog('Discard this new project draft?', { title: 'Close wizard', buttons: ['Discard', 'Keep editing'] });
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
            <h2>New Project</h2>
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
            />
          </div>
        </div>

        <div className="wizard-footer">
          <button className="btn btn-light" onClick={prev} disabled={stepIdx === 0}>&larr; Back</button>
          {stepIdx === STEPS.length - 1
            ? <button className="btn btn-accent" onClick={finish}>Create Project</button>
            : <button className="btn btn-accent" onClick={next}>Next &rarr;</button>}
        </div>
      </div>
    </div>
  );
}

function StepBody({ step, draft, setDraft, addDraftRow, updateDraftRow, deleteDraftRow }) {
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

  if (LIVE_SECTIONS.has(step.id)) {
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
