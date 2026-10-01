import React, { useEffect, useMemo, useState } from 'react';
import API from '../../api/client.js';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import { useDialogs } from '../../components/common/Dialogs.jsx';
import { ARTIFACTS } from '../../components/artifacts/index.js';
import { DirtyProvider } from './DirtyContext.jsx';
import TitleBar from './TitleBar.jsx';
import MenuBar from './MenuBar.jsx';
import Toolbar from './Toolbar.jsx';
import FormulaBar from './FormulaBar.jsx';
import LeftPanel from './LeftPanel.jsx';
import TabBar from './TabBar.jsx';
import StatusBar from './StatusBar.jsx';
import { generateWbsWithChecks } from '../../components/common/generateWbs.js';
import DataSheet from './DataSheet.jsx';

export default function ExcelLayout() {
  const { data, projectId, reload } = useProjectData();
  const { msgBox } = useDialogs();
  const [active, setActive] = useState('Data Sheet');
  const [protect, setProtect] = useState(false);
  const [artifact, setArtifact] = useState('Select Artifact to Copy');
  const [artifact2, setArtifact2] = useState('Select Artifact to Copy');
  const [status, setStatus] = useState('Ready');

  useEffect(() => {
    document.body.classList.toggle('protected', protect);
  }, [protect]);

  if (!data) return null;

  const ainTabLabel = `AIN-${data.project.project_key}`;
  const wbsTabLabel = data.wbs.length ? `${data.project.project_key}-WBS` : 'WBS For JIRA';

  const sheets = useMemo(() => [
    { name: 'Data Sheet' },
    ...ARTIFACTS.map((a) => ({
      name: a.name,
      tabLabel: a.name === 'AIN-Project' ? ainTabLabel : a.name === 'WBS For JIRA' ? wbsTabLabel : a.name
    }))
  ], [ainTabLabel, wbsTabLabel]);

  const sheetNames = sheets.map((s) => s.name);

  const goToSection = (sectionId) => {
    setActive('Data Sheet');
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.remove('highlight-flash');
        void el.offsetWidth;
        el.classList.add('highlight-flash');
      }
    }, 0);
  };

  const copyArtifact = async (name) => {
    if (!name || name === 'Select Artifact to Copy') return;
    const proj = data.project.project_key;
    const ans = await msgBox(`Proceed for copy ${proj}-${name} to desktop`, { title: 'Confirm selection', buttons: ['OK', 'Cancel'] });
    if (ans !== 'OK') return;
    const artifactName = name === ainTabLabel ? 'AIN-Project' : name;
    try {
      await API.download(`/projects/${projectId}/export/${encodeURIComponent(artifactName)}`);
    } catch (e) {
      await msgBox(e.message, { title: 'Download failed' });
      return;
    }
    await msgBox(`${proj}-${name} has been copied to Desktop`);
  };

  const generateWbs = async () => {
    const proj = data.project.project_key;
    if (data.wbs.length) {
      const ans = await msgBox('Are you sure you want to Re-Generate WBS', { title: ' Confirm WBS Re-Genaration', buttons: ['OK', 'Cancel'] });
      if (ans !== 'OK') return;
    }
    setStatus('Generating WBS…');
    const r = await generateWbsWithChecks(projectId, { msgBox, confirmDialog: msgBox });
    if (!r) { setStatus('Ready'); return; }
    await reload();
    setActive('WBS For JIRA');
    await msgBox(`WBS genarated for the project - ${proj}-WBS (${r.generated} tasks)` + (r.seededTeam ? `

A default team plan was added to the HR plan (people 'To be assigned') - assign real resources there and re-generate.` : ''));
    setStatus('Ready');
  };

  const generateTimesheet = async () => {
    const proj = data.project.project_key;
    if (!data.wbs.length) {
      await msgBox('Generate the WBS first - the timesheet is built from the WBS tasks');
      return;
    }
    setStatus('Generating Timesheet…');
    await API.post(`/projects/${projectId}/timesheet/generate`);
    const ts = await API.get(`/projects/${projectId}/timesheet`);
    setStatus('Ready');
    if (!ts.entries.length) {
      await msgBox('No timesheet entries could be generated (no dated tasks with hours)');
      return;
    }
    const ans = await msgBox(
      `Timesheet generated for ${proj}:\n\n${ts.entries.length} day-wise entries\n${ts.totalHours} total hours\n` +
      `${ts.resources} resources across ${ts.daysCovered} working days\n\nDownload as Excel (.xls)?`,
      { title: 'Timesheet generated', buttons: ['OK', 'Cancel'] });
    if (ans === 'OK') API.download(`/projects/${projectId}/timesheet/export`).catch((e) => msgBox(e.message, { title: 'Download failed' }));
  };

  const addListRow = async (kind) => {
    const rows = data.lists.filter((l) => l.kind === kind);
    await API.post(`/projects/${projectId}/lists`, { kind, sno: rows.length + 1, description: '' });
    await reload();
    goToSection(`sec-proj-${kind}s`);
  };

  const artifactMeta = ARTIFACTS.find((a) => a.name === active);

  return (
    <DirtyProvider onSaved={() => { reload(); setStatus('Saved'); }} onFailed={(e) => { msgBox('Save failed: ' + e.message); setStatus('Save failed'); }}>
      <TitleBar />
      <MenuBar
        sheetNames={sheetNames}
        onActivate={setActive}
        onCopyArtifact={copyArtifact}
        currentArtifact={artifact}
        onExportWbsCsv={() => API.download(`/projects/${projectId}/export/WBS%20For%20JIRA?format=csv`).catch((e) => msgBox(e.message, { title: 'Download failed' }))}
        onRefresh={reload}
        onAddListRow={addListRow}
      />
      <Toolbar
        sheetNames={sheetNames}
        artifact={artifact}
        setArtifact={setArtifact}
        onCopyArtifact={copyArtifact}
        onGenerateWbs={generateWbs}
        protect={protect}
        setProtect={setProtect}
      />
      <FormulaBar />
      <div id="workarea">
        {active === 'Data Sheet' && (
          <LeftPanel
            sheetNames={sheetNames}
            artifact2={artifact2}
            setArtifact2={setArtifact2}
            onCopyArtifact={copyArtifact}
            onGoToSection={goToSection}
            protect={protect}
            setProtect={setProtect}
          />
        )}
        <div id="sheetarea">
          {active === 'Data Sheet' && <div className="sheet active"><DataSheet onAddListRow={addListRow} /></div>}
          {artifactMeta && (
            <div className="sheet active">
              <artifactMeta.Component
                data={data}
                projectId={projectId}
                onMenu={() => goToSection('sec-app-details')}
                onGenerateWbs={generateWbs}
                onGenerateTimesheet={generateTimesheet}
              />
            </div>
          )}
        </div>
      </div>
      <TabBar sheets={sheets} active={active} onActivate={setActive} />
      <StatusBar status={status} />
    </DirtyProvider>
  );
}
