// "Folder Structure" sheet - standard project folder tree
(function () {
  const sheet = {
    id: 'folderstructure',
    name: 'Folder Structure',
    render(host, data) {
      const { project, folders } = data;
      let h = '';
      h += `<div class="slide-title">Folder Structure</div>`;
      h += `<div class="kv"><span class="k">Server Path</span><span class="v">${escHtml(project.shared_folder_path || '')}</span></div>`;
      h += `<table class="grid"><tr><th>Project Name</th><th>Phase</th><th>Artifact Folder</th><th>Others</th></tr>`;
      folders.forEach((f) => {
        h += `<tr><td>${escHtml(' ' + project.project_key)}</td><td>${escHtml(f.phase)}</td><td>${escHtml(f.artifact_folder || '')}</td><td>${escHtml(f.others || '')}</td></tr>`;
      });
      h += `</table>`;

      // tree view of the same structure
      h += `<div class="section-sub">Preview</div><div style="margin:8px;font-family:Consolas,monospace;font-size:12px">`;
      const phases = [...new Set(folders.map((f) => f.phase))].sort();
      h += `&#128193; ${escHtml(project.project_key)}<br>`;
      phases.forEach((p) => {
        h += `&nbsp;&nbsp;&#128193; ${escHtml(p)}<br>`;
        folders.filter((f) => f.phase === p && f.artifact_folder).forEach((f) => {
          h += `&nbsp;&nbsp;&nbsp;&nbsp;&#128193; ${escHtml(f.artifact_folder)}${f.others ? ' / ' + escHtml(f.others) : ''}<br>`;
        });
      });
      h += `</div>`;
      host.innerHTML = h;
    }
  };

  App.registerSheet(sheet);
})();
