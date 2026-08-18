import React, { useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import { ThemeProvider, useTheme } from '../../context/ThemeContext.jsx';
import { SECTION_META } from '../../data/sections.jsx';
import ArtifactModal from '../../components/common/ArtifactModal.jsx';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import Content from './Content.jsx';
import NewProjectModal from './NewProjectModal.jsx';

function ModernBody() {
  const { data } = useProjectData();
  const { sidebarHidden } = useTheme();
  const [activeGroup, setActiveGroup] = useState('app');
  const [activeSection, setActiveSection] = useState('appDetails');
  const [layoutMode, setLayoutMode] = useState('accordion');
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [artifact, setArtifact] = useState(null);

  React.useEffect(() => {
    document.body.classList.toggle('sidebar-hidden', sidebarHidden);
  }, [sidebarHidden]);

  if (!data) return <div style={{ padding: 40 }}>Loading…</div>;

  const select = (g, s) => { setActiveGroup(g); setActiveSection(s); };

  return (
    <>
      <Header
        onNewProject={() => setNewProjectOpen(true)}
        onGenerateWbs={() => setArtifact({ id: 'wbsjira', name: 'WBS For JIRA' })}
        onOpenSection={select}
      />
      <div id="layout">
        <aside id="sidebar">
          <Sidebar activeGroup={activeGroup} activeSection={activeSection} onSelect={select} onOpenArtifact={setArtifact} />
        </aside>
        <main id="content">
          <div id="contentHead">
            <h2>{SECTION_META[activeSection]?.title}</h2>
            <span id="contentHint">
              <button className="btn btn-light btn-sm" onClick={() => setLayoutMode((m) => (m === 'accordion' ? 'tabs' : 'accordion'))}>
                {layoutMode === 'accordion' ? 'Switch to tabs' : 'Switch to accordion'}
              </button>
            </span>
          </div>
          <Content activeGroup={activeGroup} activeSection={activeSection} layoutMode={layoutMode} onSelectSection={select} />
        </main>
      </div>

      {newProjectOpen && <NewProjectModal onClose={() => setNewProjectOpen(false)} />}
      {artifact && <ArtifactModal artifact={artifact} onClose={() => setArtifact(null)} />}
    </>
  );
}

export default function ModernLayout() {
  return (
    <ThemeProvider scope="modern">
      <ModernBody />
    </ThemeProvider>
  );
}
