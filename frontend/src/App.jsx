import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ProjectDataProvider, useProjectData } from './context/ProjectDataContext.jsx';
import { DialogProvider } from './components/common/Dialogs.jsx';
import { DemoWindowProvider } from './components/common/DemoWindows.jsx';
import ExcelLayout from './layouts/Excel/index.jsx';
import ModernLayout from './layouts/Modern/index.jsx';
import WebAppLayout from './layouts/WebApp/index.jsx';
import OnboardingLayout from './layouts/Onboarding/index.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';

function Boot({ children }) {
  const { initialLoading, error } = useProjectData();
  const { logout } = useAuth();
  if (error) {
    const sessionError = /session|authenticated/i.test(error);
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
        <h2>Failed to start</h2>
        <p>{error}</p>
        {sessionError
          ? <p>Your login has expired or is no longer valid.</p>
          : <p>Is the backend running and the database set up? Run: <code>npm run db:setup</code> in <code>backend/</code>.</p>}
        <button type="button" onClick={logout}>Log in again</button>
      </div>
    );
  }
  // Only the very first fetch (on mount) blocks on a full-page loader. Later
  // reloads (switchProject, etc.) flip `loading` on/off while `initialLoading`
  // stays false - swapping children out here on every one of those would
  // unmount (and reset the state of) whatever's rendering, e.g. the
  // onboarding wizard mid-flow.
  if (initialLoading) return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading…</div>;
  return children;
}

// Everything below requires a logged-in user; ProjectDataProvider only mounts
// (and starts calling the API) once that's true, so a signed-out visit never
// fires a doomed-to-401 request.
function AuthedApp() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <ProjectDataProvider>
      <Boot>
        <Routes>
          <Route path="/" element={<OnboardingLayout />} />
          <Route path="/classic" element={<WebAppLayout />} />
          <Route path="/modern" element={<ModernLayout />} />
          <Route path="/excel" element={<ExcelLayout />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Boot>
    </ProjectDataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DialogProvider>
        <DemoWindowProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/*" element={<AuthedApp />} />
        </Routes>
        </DemoWindowProvider>
      </DialogProvider>
    </AuthProvider>
  );
}
