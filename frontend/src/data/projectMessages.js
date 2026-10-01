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

// Role acronyms match task templates case-/whitespace-insensitively, as in
// backend/src/services/wbs.js ("dev" = "DEV").
const roleKey = (r) => String(r || '').trim().toUpperCase();

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

  // WBS tasks are copied per HR-plan role from the role's task templates - a
  // role with no templates contributes nothing.
  const templateRoles = new Set((data.templateRoles || []).map(roleKey));
  let rolesBlockWbs = false;
  if (hrplan.length && templateRoles.size) {
    const noTemplates = hrplan.filter((h) => !templateRoles.has(roleKey(h.role_acronym)));
    const label = (h) => (String(h.role_acronym || '').trim() ? `"${String(h.role_acronym).trim()}"` : '(blank)') + (h.resource_name ? ` - ${h.resource_name}` : '');
    const valid = [...templateRoles].join(', ');
    if (noTemplates.length === hrplan.length) {
      rolesBlockWbs = true;
      msgs.push({
        id: 'hr-no-template-roles', level: 'error', fix: 'hrplan', fixLabel: 'Fix roles',
        title: 'No HR plan role has WBS task templates',
        detail: `Generate WBS will produce no tasks. Roles in the plan: ${noTemplates.map(label).join(', ')}. Use a Role Acronym that has templates: ${valid}.`
      });
    } else if (noTemplates.length) {
      msgs.push({
        id: 'hr-some-template-roles', level: 'info', fix: 'hrplan', fixLabel: 'Review roles',
        title: `${noTemplates.length} HR plan role${noTemplates.length > 1 ? 's get' : ' gets'} no WBS tasks`,
        detail: `${noTemplates.map(label).join(', ')} ${noTemplates.length > 1 ? 'have' : 'has'} no task templates - fine for oversight roles, otherwise use one of: ${valid}.`
      });
    }
  }

  // Resource loading (computed by the backend from the same plan Generate WBS uses):
  // errors block generation, warnings need confirming, info is a tip.
  const rl = data.resourceLoading;
  if (rl?.ready && !rolesBlockWbs) {
    rl.errors.forEach((e, i) => msgs.push({
      id: `rl-error-${i}`, level: 'error', fix: 'hrplan', fixLabel: 'Fix HR plan',
      title: { 'over-allocated': 'Person allocated over 100%', 'invalid-share': 'Invalid % contribution', 'dates-reversed': 'Team member dates are reversed', 'no-working-days': 'No working days for assigned tasks' }[e.code] || 'Resource loading problem',
      detail: e.message + ' Generate WBS is blocked until this is fixed.'
    }));
    if (rl.warnings.length) {
      msgs.push({
        id: 'rl-warnings', level: 'warning', fix: 'hrplan', fixLabel: 'Review HR plan',
        title: `Resource loading: ${rl.warnings.length} thing${rl.warnings.length > 1 ? 's' : ''} to check before generating the WBS`,
        detail: rl.warnings.map((w) => '• ' + w.message).join('\n') + '\nGenerate WBS will ask you to confirm these.'
      });
    }
    if (rl.info.length) {
      msgs.push({
        id: 'rl-info', level: 'info', fix: 'hrplan', fixLabel: 'Review HR plan',
        title: `${rl.info.length} team member${rl.info.length > 1 ? 's are' : ' is'} lightly loaded`,
        detail: rl.info.map((w) => '• ' + w.message).join('\n')
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

  const canGenerateWbs = project.start_date && Number(project.fp_count) > 0 && !rolesBlockWbs && !(rl?.errors || []).length;
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

  const rank = { error: 0, warning: 1, info: 2 };
  return msgs.sort((a, b) => rank[a.level] - rank[b.level]); // stable: keeps order within a level
}

export const MESSAGE_LEVELS = {
  error: { label: 'Action needed', icon: '⛔' },
  warning: { label: 'Recommended', icon: '⚠️' },
  info: { label: 'Tip', icon: 'ℹ️' }
};
