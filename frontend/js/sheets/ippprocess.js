// "IPP-Process Planning" sheet
(function () {
  const sheet = {
    id: 'ippprocess',
    name: 'IPP-Process Planning',
    render(host, data) {
      const { process } = data;
      let h = '';
      h += `<div class="slide-title">Process Planning</div>`;
      h += `<table class="grid"><tr><th>S.No</th><th>Process Name</th><th>Applicable</th><th>Applicable tailoring (if any)</th></tr>`;
      process.forEach((p) => {
        const yes = String(p.applicable || '').toLowerCase() === 'yes';
        h += `<tr><td>${p.sno ?? ''}</td><td>${escHtml(p.process_name)}</td>` +
          `<td style="text-align:center;${yes ? 'background:#c6efce' : 'background:#ffc7ce'}">${escHtml(p.applicable || '')}</td>` +
          `<td>${escHtml(p.tailoring || '')}</td></tr>`;
      });
      h += `</table>`;
      host.innerHTML = h;
    }
  };

  App.registerSheet(sheet);
})();
