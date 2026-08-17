// Calculation engine - replicates the Data Sheet formulas of the workbook.
//
// Excel named-range formulas reproduced here:
//   ProjectTotEffMd  = ProjectFpSize / ProjectProdFactor              (V5)
//   Phase MD         = ProjectTotEffMd * phasePct                     (AD5..AD14)
//   Phase Hr         = MD * 8                                         (AE5..AE14)
//   Kick-Off date    = ProjectStartDt - 3                             (V19)
//   ProjectEndDt     = ProjectStartDt + ProjectTotEffMd/2 + 25        (W11)
//   Proposed PAT Dt  = ProjectStartDt + (TotEff - PmMd) * 1.5         (W7)
//   Avg Res/day      = AvgDailyRes% * TotalFTE                        (W5)
//   Milestone chain  (S21..U29):
//     Req Analysis:  start = ProjectStartDt          end = start + AnalysisMd + DesignMd/2
//     Design:        start = reqEnd + 3              end = start + DesignMd
//     Coding & UTC:  start = designEnd + 3           end = start + TotCutMd
//     SIT cycle 1:   start = cutEnd                  end = start + TotSitMd/2
//     SIT cycle 2:   start = sit1End                 end = start + TotSitMd/2 + 2
//     PAT Delivery:  start = sit2End + 1             end = start
//     PAT Support:   start = patDelEnd               end = start + 7
//     UAT Support:   start = patSupEnd + 2           end = start + 7
//     Go - Live:     start = uatEnd + 11             end = start + 1

const MS_DAY = 24 * 3600 * 1000;

// Excel keeps fractional day serials and truncates only for display,
// so keep the fraction here; toISO() floors to the date like Excel's display.
function addDays(date, days) {
  if (!date) return null;
  return new Date(date.getTime() + days * MS_DAY);
}

function toISO(d) {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

function round1(n) { return Math.round(n * 10) / 10; }
function round2(n) { return Math.round(n * 100) / 100; }

/**
 * @param project   row from projects table
 * @param phaseRows rows from phase_efforts (phase, pct)
 * @param hrRows    rows from hr_plan (contribution_pct)
 */
function computeProject(project, phaseRows, hrRows) {
  const fp = Number(project.fp_count) || 0;
  const pf = Number(project.productivity_factor) || 1;
  const totalEffMd = pf ? fp / pf : 0;                       // ProjectTotEffMd

  // phase efforts
  const phases = phaseRows.map((p) => {
    const pct = Number(p.pct) || 0;
    const md = totalEffMd * pct / 100;
    return { ...p, pct, md: round1(md), hr: round1(md * 8) };
  });
  const phaseMd = {};
  const phaseHr = {};
  for (const p of phases) { phaseMd[p.phase] = p.md; phaseHr[p.phase] = p.hr; }

  const analysisMd = phaseMd['Analysis'] || 0;
  const designMd = phaseMd['Design'] || 0;
  const designRevMd = phaseMd['Design Review'] || 0;
  const codingMd = phaseMd['Coding'] || 0;
  const codeRevMd = phaseMd['Code Review'] || 0;
  const unitTestMd = phaseMd['Unit Testing'] || 0;
  const sysTestMd = phaseMd['System Testing'] || 0;
  const pmMd = phaseMd['PM'] || 0;
  const patUatMd = phaseMd['PAT/UAT Support'] || 0;
  const othersMd = phaseMd['Other Efforts'] || 0;

  const totCutMd = codingMd + codeRevMd + unitTestMd;        // TotCutMd
  const totSitMd = sysTestMd;                                // TotSitMd

  // Effort consolidation (Data Sheet AB18..AD26)
  const consolidation = [
    { phase: 'Analysis', md: round1(analysisMd) },
    { phase: 'Design', md: round1(designMd + designRevMd) },
    { phase: 'Coding & Unit Testing', md: round1(totCutMd) },
    { phase: 'System Testing', md: round1(totSitMd) },
    { phase: 'PAT & UAT Support', md: round1(patUatMd) },
    { phase: 'Project Management', md: round1(pmMd) },
    { phase: 'Others', md: round1(othersMd) }
  ].map((r) => ({ ...r, pct: totalEffMd ? Math.round((r.md / totalEffMd) * 100) : 0 }));

  // schedule (parse as UTC midnight so day arithmetic is timezone-safe)
  const start = project.start_date ? new Date(String(project.start_date).slice(0, 10) + 'T00:00:00Z') : null;
  const kickOffDate = start ? addDays(start, -3) : null;                       // V19
  const endDate = start ? addDays(start, totalEffMd / 2 + 25) : null;          // W11
  const proposedPatDate = start ? addDays(start, (totalEffMd - pmMd) * 1.5) : null; // W7

  // milestone chain
  let milestones = [];
  if (start) {
    const reqStart = start;
    const reqEnd = addDays(reqStart, analysisMd + designMd / 2);
    const designStart = addDays(reqEnd, 3);
    const designEnd = addDays(designStart, designMd);
    const cutStart = addDays(designEnd, 3);
    const cutEnd = addDays(cutStart, totCutMd);
    const sit1Start = cutEnd;
    const sit1End = addDays(sit1Start, totSitMd / 2);
    const sit2Start = sit1End;
    const sit2End = addDays(sit2Start, totSitMd / 2 + 2);
    const patDelStart = addDays(sit2End, 1);
    const patDelEnd = patDelStart;
    const patSupStart = patDelEnd;
    const patSupEnd = addDays(patSupStart, 7);
    const uatStart = addDays(patSupEnd, 2);
    const uatEnd = addDays(uatStart, 7);
    const goLiveStart = addDays(uatEnd, 11);
    const goLiveEnd = addDays(goLiveStart, 1);
    milestones = [
      { seq: 1, name: 'Requirement Analysis', start: reqStart, end: reqEnd },
      { seq: 2, name: 'Design', start: designStart, end: designEnd },
      { seq: 3, name: 'Coding & UTC execution', start: cutStart, end: cutEnd },
      { seq: 4, name: 'System test cycle 1', start: sit1Start, end: sit1End },
      { seq: 5, name: 'System test cycle 2', start: sit2Start, end: sit2End },
      { seq: 6, name: 'PAT Delivery', start: patDelStart, end: patDelEnd },
      { seq: 7, name: 'PAT Support', start: patSupStart, end: patSupEnd },
      { seq: 8, name: 'UAT Support', start: uatStart, end: uatEnd },
      { seq: 9, name: 'Go - Live', start: goLiveStart, end: goLiveEnd }
    ].map((m) => ({ ...m, start: toISO(m.start), end: toISO(m.end) }));
  }

  // resource summary (Data Sheet X20..Z28): FTE per role from hr plan
  const roleMap = {};
  for (const h of hrRows || []) {
    const role = h.role_acronym || '';
    if (!roleMap[role]) roleMap[role] = { role, count: 0, fte: 0 };
    roleMap[role].count += 1;
    roleMap[role].fte += (Number(h.contribution_pct) || 0) / 100;
  }
  const roleSummary = Object.values(roleMap).map((r) => ({ ...r, fte: round2(r.fte) }));
  const totalFte = round2(roleSummary.reduce((s, r) => s + r.fte, 0));
  const avgResPerDay = round2((Number(project.avg_daily_res_pct) || 0) / 100 * totalFte); // W5

  return {
    totalEffMd: round2(totalEffMd),
    totalEffHr: round1(totalEffMd * 8),
    phases,
    phaseMd, phaseHr,
    consolidation,
    totCutMd: round1(totCutMd),
    totSitMd: round1(totSitMd),
    kickOffDate: toISO(kickOffDate),
    endDate: toISO(endDate),
    proposedPatDate: toISO(proposedPatDate),
    milestones,
    roleSummary,
    totalFte,
    avgResPerDay
  };
}

module.exports = { computeProject, addDays, toISO };
