import React, { useState } from 'react';
import { projectMessages, MESSAGE_LEVELS } from '../../data/projectMessages.js';

// "Messages" panel: what's missing from the project and how to fix it.
// onFix(target) handles a message's fix target (a section id, 'srs' or 'wbs' -
// see projectMessages.js); canFix(target) says whether this screen can, so a
// button is only shown where it leads somewhere.
export default function ProjectMessages({ data, onFix, canFix = () => true }) {
  const msgs = projectMessages(data);
  const [open, setOpen] = useState(() => msgs.some((m) => m.level !== 'info'));
  const counts = msgs.reduce((c, m) => ({ ...c, [m.level]: (c[m.level] || 0) + 1 }), {});
  const fixable = (t) => onFix && canFix(t);

  if (!msgs.length) {
    return (
      <div className="pm-panel pm-ok">
        <span className="pm-icon" aria-hidden="true">✅</span>
        <div><b>All details complete</b><p>Nothing is missing for the artifacts or the WBS.</p></div>
      </div>
    );
  }

  return (
    <section className="pm-panel" aria-label="Messages">
      <button type="button" className="pm-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <b>Messages</b>
        <span className="pm-counts">
          {['error', 'warning', 'info'].filter((l) => counts[l]).map((l) => (
            <span key={l} className={`pm-count pm-${l}`}>{counts[l]} {MESSAGE_LEVELS[l].label}</span>
          ))}
        </span>
        <span className="pm-toggle">{open ? 'Hide' : 'Show'}</span>
      </button>

      {open && (
        <ul className="pm-list">
          {msgs.map((m) => (
            <li key={m.id} className={`pm-item pm-${m.level}`}>
              <span className="pm-icon" aria-hidden="true">{MESSAGE_LEVELS[m.level].icon}</span>
              <div className="pm-body">
                <b>{m.title}</b>
                <p>{m.detail}</p>
                {m.fixes && (
                  <div className="pm-chips">
                    {m.fixes.map((f) => (fixable(f.fix)
                      ? <button key={f.fix} type="button" className="pm-chip" title={`Used by: ${f.feeds.join(', ')}`} onClick={() => onFix(f.fix)}>{f.label}</button>
                      : <span key={f.fix} className="pm-chip" title={`Used by: ${f.feeds.join(', ')}`}>{f.label}</span>))}
                  </div>
                )}
              </div>
              {m.fix && fixable(m.fix) && (
                <button type="button" className="btn btn-sm pm-fix" onClick={() => onFix(m.fix)}>{m.fixLabel} →</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
