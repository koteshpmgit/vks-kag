import { GROUPS, SECTION_META } from './sections.jsx';

function isFilled(v) {
  if (v === null || v === undefined) return false;
  const s = String(v).trim();
  return s !== '' && s !== '0';
}

const APP_KEYS = ['app_name', 'irn_no', 'app_size_fp', 'front_office', 'domain', 'category', 'description', 'technology', 'scope'];
const PROJ_KEYS = ['project_key', 'fp_count', 'productivity_factor', 'project_type', 'technology', 'brief_desc', 'scope', 'start_date'];

export function sectionCompletion(sectionId, data) {
  if (sectionId === 'appDetails') {
    const n = APP_KEYS.filter((k) => isFilled(data.application[k])).length;
    return Math.round((n / APP_KEYS.length) * 100);
  }
  if (sectionId === 'projSummary') {
    const n = PROJ_KEYS.filter((k) => isFilled(data.project[k])).length;
    return Math.round((n / PROJ_KEYS.length) * 100);
  }
  if (sectionId === 'effort' || sectionId === 'milestones') return 100;
  if (['stdRoles', 'stdTools', 'stdMatrix', 'stdFolders', 'stdTasks'].includes(sectionId)) return null;
  if (sectionId === 'resources') return data.resources.length ? 100 : 0;
  const listKind = { constraints: 'constraint', dependencies: 'dependency', assumptions: 'assumption', risks: 'risk' }[sectionId];
  if (listKind) return data.lists.filter((l) => l.kind === listKind).length ? 100 : 0;
  if (data[sectionId] !== undefined) return Array.isArray(data[sectionId]) && data[sectionId].length ? 100 : 0;
  return null;
}

export function groupCompletion(groupId, data) {
  const g = GROUPS.find((x) => x.id === groupId);
  if (!g) return null;
  const vals = g.sections.map((s) => sectionCompletion(s, data)).filter((v) => v !== null);
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export function overallCompletion(data) {
  const vals = Object.keys(SECTION_META)
    .map((id) => sectionCompletion(id, data))
    .filter((v) => v !== null);
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export function pctClass(pct) {
  if (pct === null) return '';
  if (pct >= 100) return 'p100';
  if (pct >= 50) return 'p50';
  if (pct > 0) return 'plow';
  return 'p0';
}
