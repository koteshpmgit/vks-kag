import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProjectDataProvider, useProjectData } from './context/ProjectDataContext.jsx';
import { DialogProvider } from './components/common/Dialogs.jsx';
import ExcelLayout from './layouts/Excel/index.jsx';
import ModernLayout from './layouts/Modern/index.jsx';
import WebAppLayout from './layouts/WebApp/index.jsx';

function Boot({ children }) {
  const { loading, error, data } = useProjectData();
  if (error) {
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
        <h2>Failed to start</h2>
        <p>{error}</p>
        <p>Is the backend running and the database set up? Run: <code>npm run db:setup</code> in <code>backend/</code>.</p>
      </div>
    );
  }
  if (loading && !data) return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading…</div>;
  if (!loading && !data) {
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
        <h2>No projects yet</h2>
        <p>Create a project via the API, or run <code>npm run db:setup</code> in <code>backend/</code> to seed sample data.</p>
      </div>
    );
  }
  return children;
}

export default function App() {
  return (
    <ProjectDataProvider>
      <DialogProvider>
        <Boot>
          <Routes>
            <Route path="/" element={<ModernLayout />} />
            <Route path="/excel" element={<ExcelLayout />} />
            <Route path="/webapp" element={<WebAppLayout />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Boot>
      </DialogProvider>
    </ProjectDataProvider>
  );
}
