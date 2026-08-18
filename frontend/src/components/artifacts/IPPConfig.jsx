import React from 'react';
import { SlideTitle, findRole } from './helpers.jsx';

export default function IPPConfig({ data, onMenu }) {
  const { project, hrplan } = data;
  const di = findRole(hrplan, 'DI');
  return (
    <div>
      <SlideTitle onMenu={onMenu}>4.1 Configuration Management</SlideTitle>
      <table className="grid"><tbody>
        <tr><th style={{ width: 260 }}>Configuration Management plan</th><td>{(project.shared_folder_path || '') + '02.PLANS\\2.6 CMP'}</td></tr>
        <tr><th>Development Intergrator</th><td>{di.resource_name || ''}</td></tr>
        <tr><th>Naming convention</th><td style={{ whiteSpace: 'pre-wrap' }}>{project.naming_convention || ''}</td></tr>
      </tbody></table>
    </div>
  );
}
