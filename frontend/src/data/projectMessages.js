import { SECTION_META, LIST_KIND_MAP } from './sections.jsx';

// Project data gaps that stop artifacts/WBS from being produced, or leave them
// thin - each with a `fix` target the host screen maps to its own navigation:
//   a section id (e.g. 'projSummary', 'hrplan') - open that section / wizard step
//   'srs' - upload a requirements document
//   'wbs' - open the WBS panel
// level: 'error' = blocks output, 'warning' = output is incomplete/placeholder,
// 'info' = optional sections that would enrich an artifact.

// Which artifacts read each optional section (see components/artifacts/*).
const FEEDS = {
  hardware: ['Kick-Off', 'IPP-Application Information'],
  software: ['Kick-Off', 'IPP-Application Information'],
  environments: ['IPP-Application Information'],
  docs: ['AIN-Project'],
  modules: ['AIN-Project', 'IPP-Scope Management'],
  training: ['IPP-Scope Management'],
  process: ['IPP-Process Planning'],
  goals: ['Kick-Off'],
  agenda: ['Kick-Off'],
  constraints: ['Kick-Off', 'IPP-Scope Management'],
  dependencies: ['Kick-Off', 'IPP-Scope Management'],
  assumptions: ['Kick-Off', 'IPP-Scope Management'],
  risks: ['Kick-Off', 'IPP-Scope Management']
};

const isPlaceholder = (h) => /^TBD-/i.test(h.resource_ipn || '') || /^to be assigned$/i.test((h.resource_name || '').trim());

// Rows with actual content - blank rows (e.g. added only to pass the wizard's
// minimum-rows rule) don't count as filling a section.
const BOOKKEEPING = new Set(['id', 'project_id', 'sno', 'seq', 'kind']);
const hasContent = (row) => Object.entries(row).some(([k, v]) => !BOOKKEEPING.has(k) && v != null && String(v).trim() !== '');

function sectionRows(data, sid) {
  const kind = LIST_KIND_MAP[sid];
  const rows = kind ? (data.lists || []).filter((l) => l.kind === kind) : (data[sid] || []);
  return rows.filter(hasContent);
}

export function projectMessages(data) {
  if (!data?.project) return [];
  const { project, application, analysis, design } = data;
  const hrplan = data.hrplan || [];
  const msgs = [];

  if (!project.start_date) {
    msgs.push({
      id: 'start-date', level: 'error', fix: 'projSummary', fixLabel: 'Set Start Date',
      title: 'Start Date is missing',
      detail: 'The schedule, milestone dates and WBS task dates are all calculated from it. Generate WBS won’t run until it’s set.'
    });
  }
  if (!(Number(project.fp_count) > 0)) {
    msgs.push({
      id: 'fp-count', level: 'error', fix: 'projSummary', fixLabel: 'Set FP Count',
      title: 'FP Count is 0',
      detail: 'Effort (MD/Hr), team FTE and every WBS estimate are derived from the function point count. Generate WBS won’t run until it’s above 0.'
    });
  }

  if (!hrplan.length) {
    msgs.push({
      id: 'hr-empty', level: 'warning', fix: 'hrplan', fixLabel: 'Add team',
      title: 'No team in the HR plan',
      detail: 'The WBS assigns tasks per HR-plan role. If you generate the WBS now, a standard team with placeholder people is added for you.'
    });
  } else {
    const tbd = hrplan.filter(isPlaceholder);
    if (tbd.length) {
      msgs.push({
        id: 'hr-placeholder', level: 'warning', fix: 'hrplan', fixLabel: 'Assign people',
        title: `${tbd.length} team role${tbd.length > 1 ? 's are' : ' is'} not assigned to a person`,
        detail: `${tbd.map((h) => h.role_name || h.role_acronym).join(', ')} still ${tbd.length > 1 ? 'have placeholder people, so their' : 'has a placeholder person, so its'} WBS tasks go to placeholder assignees like ${tbd[0].resource_ipn || 'TBD'}. Assign real resources, then re-generate the WBS.`
      });
    }
  }

  if (!analysis && !design) {
    msgs.push({
      id: 'no-srs', level: 'warning', fix: 'srs', fixLabel: 'Upload SRS',
      title: 'No requirements document analysed',
      detail: 'The Analysis and Design documents stay empty until an SRS is uploaded and analysed.'
    });
  }

  if (!String(application?.app_name || '').trim()) {
    msgs.push({
      id: 'app-name', level: 'warning', fix: 'appDetails', fixLabel: 'Add details',
      title: 'Application details are empty',
      detail: 'The AIN, AIN-Project, IPP-Application Information and Kick-Off artifacts show the application name, domain and description.'
    });
  }

  const canGenerateWbs = project.start_date && Number(project.fp_count) > 0;
  if (canGenerateWbs && !(data.wbs || []).length) {
    msgs.push({
      id: 'wbs', level: 'info', fix: 'wbs', fixLabel: 'Generate WBS',
      title: 'WBS not generated yet',
      detail: 'Everything the WBS needs is in place - generate the JIRA-ready task breakdown.'
    });
  }

  const empty = Object.keys(FEEDS).filter((sid) => !sectionRows(data, sid).length);
  if (empty.length) {
    msgs.push({
      id: 'empty-sections', level: 'info',
      title: `${empty.length} section${empty.length > 1 ? 's are' : ' is'} empty`,
      detail: 'Optional, but these feed the artifacts shown - fill them in for complete documents.',
      fixes: empty.map((sid) => ({ fix: sid, label: SECTION_META[sid].title, feeds: FEEDS[sid] }))
    });
  }

  return msgs;
}

export const MESSAGE_LEVELS = {
  error: { label: 'Action needed', icon: '⛔' },
  warning: { label: 'Recommended', icon: '⚠️' },
  info: { label: 'Tip', icon: 'ℹ️' }
};
