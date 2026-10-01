import API from '../../api/client.js';

// Generate WBS with the backend's checks surfaced to the user:
//  - resource-loading errors / missing basics (400): explain, don't generate
//  - resource-loading warnings (409): list them and ask; "Generate anyway"
//    re-sends with ?force=1
// Returns the generate result, or null when nothing was generated.
export async function generateWbsWithChecks(projectId, { msgBox, confirmDialog }) {
  try {
    return await API.post(`/projects/${projectId}/wbs/generate`);
  } catch (e) {
    if (e.status === 409 && e.code === 'RESOURCE_WARNINGS') {
      const ans = await confirmDialog(`${e.message}\n\nGenerate the WBS anyway?`, {
        title: 'Check resource loading', buttons: ['Fix first', 'Generate anyway']
      });
      if (ans !== 'Generate anyway') return null;
      try {
        return await API.post(`/projects/${projectId}/wbs/generate?force=1`);
      } catch (e2) {
        await msgBox(e2.message, { title: 'WBS not generated' });
        return null;
      }
    }
    await msgBox(e.message, { title: 'WBS not generated' });
    return null;
  }
}
