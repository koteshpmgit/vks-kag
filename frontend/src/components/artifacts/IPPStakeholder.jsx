import React from 'react';
import { SlideTitle } from './helpers.jsx';

export default function IPPStakeholder({ data, onMenu }) {
  const { matrix } = data;
  const styleFor = (c) => c === 'E' ? { background: '#c6efce', fontWeight: 'bold', textAlign: 'center' }
    : c === 'P' ? { background: '#ffeb9c', textAlign: 'center' }
    : c === 'ES' ? { background: '#ffc7ce', textAlign: 'center' } : { textAlign: 'center' };
  return (
    <div>
      <SlideTitle onMenu={onMenu}>Stakeholder Matrix</SlideTitle>
      <div className="note">Please alter the stakeholder Involvement, if it differs in your project</div>
      <table className="grid">
        <thead>
          <tr><th>Important Activities</th><th>VH</th><th>ODO</th><th>PO</th><th>QADO</th><th>QA</th><th>TDO</th><th>TO</th><th>Project team</th><th>DI</th><th>SEPG</th><th>FO</th><th>SSM</th><th>Remarks</th></tr>
        </thead>
        <tbody>
          {matrix.map((m) => (
            <tr key={m.id}>
              <td>{m.activity}</td>
              {[m.vh, m.odo, m.po, m.qado, m.qa, m.tdo, m.tos, m.team, m.di, m.sepg, m.fo, m.ssm].map((c, i) => (
                <td key={i} style={styleFor(c)}>{c || ''}</td>
              ))}
              <td>{m.remarks || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="kv"><span className="v">E - Execution</span></div>
      <div className="kv"><span className="v">P - Participate</span></div>
      <div className="kv"><span className="v">O - Overview</span></div>
      <div className="kv"><span className="v">EC - Escalation</span></div>
      <div className="note">SSM - Shared Services Managers. The Services are tracked on periodical basis by ISDC, however based on the need it can be escalated to Shared Services Managers.</div>
    </div>
  );
}
