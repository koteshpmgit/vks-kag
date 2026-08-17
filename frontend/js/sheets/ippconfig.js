// "IPP-Configuration Mgmt." sheet
(function () {
  const sheet = {
    id: 'ippconfig',
    name: 'IPP-Configuration Mgmt.',
    render(host, data) {
      const { project, hrplan } = data;
      const di = hrplan.find((h) => h.role_acronym === 'DI') || {};
      let h = '';
      h += `<div class="slide-title">4.1 Configuration Management</div>`;
      h += `<table class="grid">`;
      h += `<tr><th style="width:260px">Configuration Management plan</th><td>${escHtml((project.shared_folder_path || '') + '02.PLANS\\2.6 CMP')}</td></tr>`;
      h += `<tr><th>Development Intergrator</th><td>${escHtml(di.resource_name || '')}</td></tr>`;
      h += `<tr><th>Naming convention</th><td style="white-space:pre-wrap">${escHtml(project.naming_convention || '')}</td></tr>`;
      h += `</table>`;
      host.innerHTML = h;
    }
  };

  App.registerSheet(sheet);
})();
