import React from 'react';
import { SlideTitle } from './helpers.jsx';

export default function IPPProcess({ data, onMenu }) {
  const { process } = data;
  return (
    <div>
      <SlideTitle onMenu={onMenu}>Process Planning</SlideTitle>
      <table className="grid">
        <thead><tr><th>S.No</th><th>Process Name</th><th>Applicable</th><th>Applicable tailoring (if any)</th></tr></thead>
        <tbody>
          {process.map((p) => {
            const yes = String(p.applicable || '').toLowerCase() === 'yes';
            return (
              <tr key={p.id}>
                <td>{p.sno ?? ''}</td><td>{p.process_name}</td>
                <td style={{ textAlign: 'center', background: yes ? '#c6efce' : '#ffc7ce' }}>{p.applicable || ''}</td>
                <td>{p.tailoring || ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
