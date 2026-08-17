// Thin API client
const API = {
  base: '/api',

  async get(path) {
    const r = await fetch(this.base + path);
    if (!r.ok) throw new Error(`GET ${path}: ${r.status}`);
    return r.json();
  },
  async send(method, path, body) {
    const r = await fetch(this.base + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!r.ok) throw new Error(`${method} ${path}: ${r.status}`);
    return r.json();
  },
  post(path, body) { return this.send('POST', path, body); },
  put(path, body) { return this.send('PUT', path, body); },
  del(path) { return this.send('DELETE', path); }
};

// Excel-style message box (replicates VBA MsgBox)
function msgBox(text, { title = 'Microsoft Excel', buttons = ['OK'] } = {}) {
  return new Promise((resolve) => {
    const ov = document.createElement('div');
    ov.className = 'msgbox-overlay';
    ov.innerHTML = `<div class="msgbox">
      <div class="mb-title">${title}</div>
      <div class="mb-body"></div>
      <div class="mb-actions"></div>
    </div>`;
    ov.querySelector('.mb-body').textContent = text;
    const actions = ov.querySelector('.mb-actions');
    buttons.forEach((b) => {
      const btn = document.createElement('button');
      btn.textContent = b;
      btn.onclick = () => { document.body.removeChild(ov); resolve(b); };
      actions.appendChild(btn);
    });
    document.body.appendChild(ov);
    actions.querySelector('button').focus();
  });
}

function setStatus(msg) {
  const el = document.getElementById('statusMsg');
  if (el) el.textContent = msg;
}

function fmtDate(d) {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d.slice(0, 10) + 'T00:00:00') : d;
  if (Number.isNaN(dt.getTime())) return '';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(dt.getDate()).padStart(2, '0')}-${months[dt.getMonth()]}-${String(dt.getFullYear()).slice(2)}`;
}

function isoDate(d) { return d ? String(d).slice(0, 10) : ''; }

function escHtml(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
