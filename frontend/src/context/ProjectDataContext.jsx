import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import API from '../api/client.js';

const ProjectDataContext = createContext(null);

const COLLECTIONS = [
  'hrplan', 'phases', 'milestones', 'hardware', 'software', 'lists', 'docs', 'goals',
  'training', 'process', 'environments', 'dar', 'agenda', 'modules'
];

async function loadAll(projectId) {
  const [application, project, computed, resources, ...colls] = await Promise.all([
    API.get('/application'),
    API.get(`/projects/${projectId}`),
    API.get(`/projects/${projectId}/computed`),
    API.get('/resources'),
    ...COLLECTIONS.map((c) => API.get(`/projects/${projectId}/${c}`))
  ]);
  const [stdRoles, stdTools, matrix, folders, wbs] = await Promise.all([
    API.get('/standards/roles'),
    API.get('/standards/tools'),
    API.get('/standards/stakeholder-matrix'),
    API.get('/standards/folder-structure'),
    API.get(`/projects/${projectId}/wbs`)
  ]);
  const data = { application, project, computed, resources, stdRoles, stdTools, matrix, folders, wbs };
  COLLECTIONS.forEach((c, i) => { data[c] = colls[i]; });
  return data;
}

export function ProjectDataProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const value = {
    projects, projectId, data, loading, error,
    reload: () => reload(),
    switchProject,
    reloadProjects,
    setProjectId
  };

  return <ProjectDataContext.Provider value={value}>{children}</ProjectDataContext.Provider>;
}

export function useProjectData() {
  const ctx = useContext(ProjectDataContext);
  if (!ctx) throw new Error('useProjectData must be used inside ProjectDataProvider');
  return ctx;
}
