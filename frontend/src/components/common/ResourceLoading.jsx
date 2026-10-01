import React from 'react';
import { isoDate } from '../../api/client.js';

const STATUS = {
  'over-allocated': ['Over 100%', 'rl-bad'],
  'no-time': ['No working days', 'rl-bad'],
  overloaded: ['Overloaded', 'rl-warn'],
  underloaded: ['Light', 'rl-info'],
  'no-tasks': ['No WBS tasks', 'rl-muted'],
  ok: ['OK', 'rl-ok']
};

// Per-person resource loading (from GET /projects/:id/resource-loading), checked
// before generating the WBS: the WBS hours each person would get vs their
// working time. Load = WBS hours / full-time hours in their date window - over
// 100% means their tasks can't fit even working full-time.
export default function ResourceLoading({ loading }) {
  if (!loading) return null;
  if (!loading.ready) {
    return <div className="rl-note">Resource loading is checked once the project has {loading.missing.join(' and ')}.</div>;
  }
  if (loading.noTeam) {
    return <div className="rl-note">No team in the HR plan yet — a standard team with placeholder people is added when you generate the WBS.</div>;
  }
  const t = loading.totals;
  return (
    <details className="rl-panel" open={loading.errors.length + loading.warnings.length > 0}>
      <summary>
        <b>Resource loading</b>
        <span className="rl-sum">{t.assignedHrs}h of WBS tasks · {t.allocatedHrs}h booked by the team's % · {t.effortHrs}h estimated effort · schedule {isoDate(t.projectStart)} – {isoDate(t.projectEnd)}</span>
        {loading.errors.length > 0 && <span className="rl-chip rl-bad">{loading.errors.length} blocking</span>}
        {loading.warnings.length > 0 && <span className="rl-chip rl-warn">{loading.warnings.length} to check</span>}
      </summary>
      <div className="rl-table-wrap">
        <table className="grid rl-table">
          <thead>
            <tr><th>Person</th><th>IPN</th><th>Roles</th><th>Allocation</th><th>Working days</th><th>WBS hours</th><th title="Working days x 8h x their %">Booked hours</th><th title="Working days x 8h">Full-time hours</th><th title="WBS hours / full-time hours">Load</th><th>Status</th></tr>
          </thead>
          <tbody>
            {loading.members.map((m, i) => {
              const [label, cls] = STATUS[m.status] || STATUS.ok;
              return (
                <tr key={i}>
                  <td>{m.name}</td><td>{m.ipn}</td><td>{m.roles.join(', ')}</td>
                  <td className="num">{m.allocationPct}%</td><td className="num">{m.workingDays}</td>
                  <td className="num">{m.assignedHrs}</td><td className="num">{m.allocatedHrs}</td><td className="num">{m.capacityHrs}</td>
                  <td className="num">{m.loadingPct === null ? '∞' : `${m.loadingPct}%`}</td>
                  <td><span className={`rl-chip ${cls}`}>{label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {[...loading.errors, ...loading.warnings].length > 0 && (
        <ul className="rl-issues">
          {loading.errors.map((e, i) => <li key={`e${i}`} className="rl-bad-text">⛔ {e.message}</li>)}
          {loading.warnings.map((w, i) => <li key={`w${i}`} className="rl-warn-text">⚠️ {w.message}</li>)}
        </ul>
      )}
    </details>
  );
}
