import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import API from '../api/client.js';

const ProjectDataContext = createContext(null);

const COLLECTIONS = [
  'hrplan', 'phases', 'milestones', 'hardware', 'software', 'lists', 'docs', 'goals',
  'training', 'process', 'environments', 'dar', 'agenda', 'modules'
];

async function loadAll(projectId) {
  const [application, project, computed, resources, ...colls] = await Promise.all([
    API.get(`/application?project_id=${projectId}`),
    API.get(`/projects/${projectId}`),
    API.get(`/projects/${projectId}/computed`),
    API.get('/resources'),
    ...COLLECTIONS.map((c) => API.get(`/projects/${projectId}/${c}`))
  ]);
  const [stdRoles, stdTools, matrix, folders, wbs, srs, taskTemplates, resourceLoading] = await Promise.all([
    API.get('/standards/roles'),
    API.get('/standards/tools'),
    API.get('/standards/stakeholder-matrix'),
    API.get('/standards/folder-structure'),
    API.get(`/projects/${projectId}/wbs`),
    API.get(`/projects/${projectId}/srs`),
    API.get('/standards/task-templates'),
    API.get(`/projects/${projectId}/resource-loading`)
  ]);
  const data = {
    application, project, computed, resources, stdRoles, stdTools, matrix, folders, wbs,
    srsDocument: srs.document, analysis: srs.analysis, design: srs.design,
    // role acronyms that have WBS task templates (Messages panel checks the HR plan against these)
    templateRoles: [...new Set(taskTemplates.map((t) => t.role_acronym))],
    // per-person allocation vs WBS hours, checked before generating the WBS (backend services/wbs.js)
    resourceLoading
  };
  COLLECTIONS.forEach((c, i) => { data[c] = colls[i]; });
  return data;
}

export function ProjectDataProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  // Distinct from `loading`: true only until the very first fetch (on mount)
  // settles, then stays false for the rest of the session. Callers that want
  // a one-time full-page boot spinner (App.jsx's Boot) should key off this,
  // not `loading` - `loading` also flips true/false on every later
  // switchProject()/reload(), which would otherwise unmount (and reset the
  // state of) whatever's rendering underneath on every project switch.
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async (pid) => {
    const id = pid ?? projectId;
    if (!id) return;
    setLoading(true);
    try {
      const d = await loadAll(id);
      setData(d);
      setError(null);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    (async () => {
      try {
        const list = await API.get('/projects');
        setProjects(list);
        const first = list[0]?.id || null;
        setProjectId(first);
        if (first) {
          const d = await loadAll(first);
          setData(d);
        }
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    })();
  }, []);

  const switchProject = useCallback(async (id) => {
    setProjectId(id);
    await reload(id);
  }, [reload]);

  const reloadProjects = useCallback(async () => {
    const list = await API.get('/projects');
    setProjects(list);
    return list;
  }, []);

  // After a project leaves the active list (archived or deleted): if it was the
  // open one, move to the first remaining project - or to none.
  const afterRemoval = useCallback(async (id) => {
    const list = await reloadProjects();
    if (id !== projectId) return;
    const next = list[0]?.id ?? null;
    setProjectId(next);
    if (next) await reload(next);
    else setData(null);
  }, [projectId, reload, reloadProjects]);

  const archiveProject = useCallback(async (id) => {
    await API.post(`/projects/${id}/archive`);
    await afterRemoval(id);
  }, [afterRemoval]);

  const deleteProject = useCallback(async (id) => {
    await API.del(`/projects/${id}`);
    await afterRemoval(id);
  }, [afterRemoval]);

  const restoreProject = useCallback(async (id) => {
    await API.post(`/projects/${id}/restore`);
    await reloadProjects();
  }, [reloadProjects]);

  const value = {
    projects, projectId, data, loading, initialLoading, error,
    reload: () => reload(),
    switchProject,
    reloadProjects,
    setProjectId,
    archiveProject,
    restoreProject,
    deleteProject
  };

  return <ProjectDataContext.Provider value={value}>{children}</ProjectDataContext.Provider>;
}

export function useProjectData() {
  const ctx = useContext(ProjectDataContext);
  if (!ctx) throw new Error('useProjectData must be used inside ProjectDataProvider');
  return ctx;
}
