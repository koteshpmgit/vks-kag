import KickOff from './KickOff.jsx';
import AIN from './AIN.jsx';
import AINProject from './AINProject.jsx';
import IPPAppInfo from './IPPAppInfo.jsx';
import IPPScope from './IPPScope.jsx';
import IPPStakeholder from './IPPStakeholder.jsx';
import IPPConfig from './IPPConfig.jsx';
import IPPProcess from './IPPProcess.jsx';
import WBSForJira from './WBSForJira.jsx';
import FolderStructure from './FolderStructure.jsx';

// id -> {name, Component} - order matches the workbook's sheet tab order
export const ARTIFACTS = [
  { id: 'kickoff', name: 'Kick-Off', Component: KickOff },
  { id: 'ain', name: 'AIN', Component: AIN },
  { id: 'ainproject', name: 'AIN-Project', Component: AINProject },
  { id: 'ippappinfo', name: 'IPP-Application Information', Component: IPPAppInfo },
  { id: 'ippscope', name: 'IPP-Scope Management', Component: IPPScope },
  { id: 'ippstakeholder', name: 'IPP-Stakeholder plan', Component: IPPStakeholder },
  { id: 'ippconfig', name: 'IPP-Configuration Mgmt.', Component: IPPConfig },
  { id: 'ippprocess', name: 'IPP-Process Planning', Component: IPPProcess },
  { id: 'wbsjira', name: 'WBS For JIRA', Component: WBSForJira },
  { id: 'folderstructure', name: 'Folder Structure', Component: FolderStructure }
];

export function artifactByName(name) {
  return ARTIFACTS.find((a) => a.name === name);
}
