import React, { useState } from 'react';
import { useDialogs } from '../../components/common/Dialogs.jsx';
import { useDirty } from './DirtyContext.jsx';

export default function MenuBar({ sheetNames, onActivate, onCopyArtifact, currentArtifact, onExportWbsCsv, onRefresh, onAddListRow }) {
  const [open, setOpen] = useState(null);
  const { msgBox } = useDialogs();
  const { saveAll } = useDirty();

  const menus = {
    file: [
      ['Save', saveAll],
      ['Copy Artifact To Desktop…', () => onCopyArtifact(currentArtifact)],
      ['Export WBS (CSV)', onExportWbsCsv]
    ],
    edit: [
      ['Refresh (recalculate)', onRefresh]
    ],
    view: sheetNames.map((n) => [n, () => onActivate(n)]),
    insert: [
      ['Add Constraint row', () => onAddListRow('constraint')],
      ['Add Dependency row', () => onAddListRow('dependency')],
      ['Add Assumption row', () => onAddListRow('assumption')],
      ['Add Risk row', () => onAddListRow('risk')]
    ],
    tools: [
      ['Generate WBS (GenWBS2)', () => onActivate('WBS For JIRA')],
      ['Protect Sheet', () => document.getElementById('rbProtect')?.click()],
      ['Unprotect Sheet', () => document.getElementById('rbUnprotect')?.click()]
    ],
    data: [
      ['Application-Data', () => onActivate('Data Sheet')],
      ['Project-Data', () => onActivate('Data Sheet')],
      ['Resource-Data', () => onActivate('Data Sheet')],
      ['Standards-Data', () => onActivate('Data Sheet')]
    ],
    help: [
      ['About Key Artifact Generator', () => msgBox('Key Artifact Generator V1.0 (Web Edition)\nGenerates project key artifacts: Kick-Off, AIN, IPP, WBS for JIRA.\nBackend: Node.js + PostgreSQL')]
    ]
  };

  return (
    <div id="menubar" onClick={(e) => e.stopPropagation()}>
      {Object.keys(menus).map((key) => (
        <span
          key={key}
          className="menu-item"
          onClick={(e) => { e.stopPropagation(); setOpen(open === key ? null : key); }}
        >
          {key[0].toUpperCase() + key.slice(1)}
        </span>
      ))}
      {open && (
        <div className="menu-dropdown" style={{ display: 'block', left: 0, top: 46 }}>
          {menus[open].map(([label, fn]) => (
            <div key={label} onClick={() => { setOpen(null); fn(); }}>{label}</div>
          ))}
        </div>
      )}
      {open && <MenuBackdrop onClose={() => setOpen(null)} />}
    </div>
  );
}

function MenuBackdrop({ onClose }) {
  React.useEffect(() => {
    const h = () => onClose();
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [onClose]);
  return null;
}
