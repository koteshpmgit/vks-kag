// "IPP-Stakeholder plan" sheet - stakeholder matrix
(function () {
  const sheet = {
    id: 'ippstakeholder',
    name: 'IPP-Stakeholder plan',
    render(host, data) {
      const { matrix } = data;
      let h = '';
      h += `<div class="slide-title">Stakeholder Matrix</div>`;
      h += `<div class="note">Please alter the stakeholder Involvement, if it differs in your project</div>`;
      h += `<table class="grid"><tr><th>Important Activities</th><th>VH</th><th>ODO</th><th>PO</th><th>QADO</th><th>QA</th><th>TDO</th><th>TO</th><th>Project team</th><th>DI</th><th>SEPG</th><th>FO</th><th>SSM</th><th>Remarks</th></tr>`;
      matrix.forEach((m) => {
        h += `<tr><td>${escHtml(m.activity)}</td>`;
        [m.vh, m.odo, m.po, m.qado, m.qa, m.tdo, m.tos, m.team, m.di, m.sepg, m.fo, m.ssm].forEach((c) => {
          const style = c === 'E' ? 'background:#c6efce;font-weight:bold;text-align:center'
            : c === 'P' ? 'background:#ffeb9c;text-align:center'
            : c === 'ES' ? 'background:#ffc7ce;text-align:center' : 'text-align:center';
          h += `<td style="${style}">${escHtml(c || '')}</td>`;
        });
        h += `<td>${escHtml(m.remarks || '')}</td></tr>`;
      });
      h += `</table>`;
      h += `<div class="kv"><span class="v">E - Execution</span></div>`;
      h += `<div class="kv"><span class="v">P - Participate</span></div>`;
      h += `<div class="kv"><span class="v">O - Overview</span></div>`;
      h += `<div class="kv"><span class="v">EC - Escalation</span></div>`;
      h += `<div class="note">SSM - Shared Services Managers.  The Services are tracked on periodical basis by ISDC, however based on the need it can be escalated to Shared Services Managers.</div>`;
      host.innerHTML = h;
    }
  };

  App.registerSheet(sheet);
})();
