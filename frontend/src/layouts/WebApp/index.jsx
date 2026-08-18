import React, { useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext.jsx';
import { ThemeProvider, useTheme } from '../../context/ThemeContext.jsx';
import { SECTION_META } from '../../data/sections.jsx';
import ArtifactModal from '../../components/common/ArtifactModal.jsx';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import Home from './Home.jsx';
import Wizard from './Wizard.jsx';
import Content from '../Modern/Content.jsx';
import SummaryPopover from '../Modern/SummaryPopover.jsx';

function WebAppBody() {
  const { data } = useProjectData();
  const { sidebarHidden } = useTheme();
  const [page, setPage] = useState('home'); // 'home' | 'summary' | 'section'
  const [activeGroup, setActiveGroup] = useState('app');
  const [activeSection, setActiveSection] = useState('appDetails');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [artifact, setArtifact] = useState(null);

  React.useEffect(() => {
    document.body.classList.toggle('wa-sidebar-hidden', sidebarHidden);
    document.body.classList.toggle('wa-home-page', page === 'home');
    return () => document.body.classList.remove('wa-home-page');
  }, [sidebarHidden, page]);

  if (!data) return <div style={{ padding: 40 }}>Loading…</div>;

  const openSection = (g, s) => { setActiveGroup(g); setActiveSection(s); setPage('section'); };

  return (
    <>
      <Header
        page={page}
        onHome={() => setPage('home')}
        onSummary={() => setPage('summary')}
        onOpenSection={openSection}
        onNewProject={() => setWizardOpen(true)}
        onGenerateWbs={() => setArtifact({ id: 'wbsjira', name: 'WBS For JIRA' })}
      />
      <div id="waLayout">
        <Sidebar
          page={page} activeGroup={activeGroup} activeSection={activeSection}
          onHome={() => setPage('home')} onSummary={() => setPage('summary')}
          onSelect={openSection} onOpenArtifact={setArtifact}
        />
        <main id="waContent">
          {page === 'home' && <Home onOpenSection={openSection} />}
          {page === 'summary' && (
            <div className="wa-summary-page">
              <SummaryPopover hidden={false} inline onOpenSection={openSection} />
            </div>
          )}
          {page === 'section' && (
            <>
              <div id="contentHead">
                <h2>{SECTION_META[activeSection]?.title}</h2>
              </div>
              <Content activeGroup={activeGroup} activeSection={activeSection} layoutMode="accordion" onSelectSection={openSection} />
            </>
          )}
        </main>
      </div>

      {wizardOpen && <Wizard onClose={() => setWizardOpen(false)} />}
      {artifact && <ArtifactModal artifact={artifact} onClose={() => setArtifact(null)} />}
    </>
  );
}

export default function WebAppLayout() {
  return (
    <ThemeProvider scope="webapp">
      <WebAppBody />
    </ThemeProvider>
  );
}
