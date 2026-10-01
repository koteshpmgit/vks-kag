// Thin API client - same contract as the old js/api.js
let authToken = localStorage.getItem('kag_token') || null;

// Error for a failed request: message from the JSON body when there is one,
// plus .status, .code and .details (e.g. resource-loading results on WBS generate).
async function readError(r, fallback) {
  if (r.status === 401 && API.onUnauthorized) API.onUnauthorized();
  let body = null;
  // a proxy (Nginx) rejects oversized bodies with an HTML 413 page, not JSON
  if (r.status !== 413) { try { body = await r.json(); } catch { body = null; } }
  const err = new Error(r.status === 413 ? 'File is too large for the server to accept.' : (body?.error || fallback));
  err.status = r.status;
  err.code = body?.code;
  err.details = body?.details;
  return err;
}

const API = {
  base: '/api',
  // set by AuthProvider - called when the backend rejects the session token
  // (expired, or JWT_SECRET changed) so the app returns to /login instead of
  // failing every request
  onUnauthorized: null,

  setToken(token) {
    authToken = token;
    if (token) localStorage.setItem('kag_token', token);
    else localStorage.removeItem('kag_token');
  },
  authHeaders() {
    return authToken ? { Authorization: `Bearer ${authToken}` } : {};
  },

  async get(path) {
    const r = await fetch(this.base + path, { headers: this.authHeaders() });
    if (!r.ok) throw await readError(r, `GET ${path}: ${r.status}`);
    return r.json();
  },
  async send(method, path, body) {
    const r = await fetch(this.base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!r.ok) throw await readError(r, `${method} ${path}: ${r.status}`);
    return r.json();
  },
  async upload(path, formData) {
    const r = await fetch(this.base + path, { method: 'POST', headers: this.authHeaders(), body: formData });
    if (!r.ok) throw await readError(r, `POST ${path}: ${r.status}`);
    return r.json();
  },
  // File downloads must go through fetch: navigating the browser to an /api URL
  // sends no Authorization header, so the backend answers 401. Saves the file
  // under the server's Content-Disposition filename.
  async download(path, fallbackName = 'download') {
    const r = await fetch(this.base + path, { headers: this.authHeaders() });
    if (!r.ok) throw await readError(r, `Download failed (${r.status})`);
    const cd = r.headers.get('Content-Disposition') || '';
    const name = decodeURIComponent((cd.match(/filename\*=UTF-8''([^;]+)/i) || cd.match(/filename="?([^";]+)"?/i) || [])[1] || fallbackName);
    const url = URL.createObjectURL(await r.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  },
  post(path, body) { return this.send('POST', path, body); },
  put(path, body) { return this.send('PUT', path, body); },
  del(path) { return this.send('DELETE', path); }
};

export function fmtDate(d) {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d.slice(0, 10) + 'T00:00:00') : d;
  if (Number.isNaN(dt.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(dt.getDate()).padStart(2, '0')}-${months[dt.getMonth()]}-${String(dt.getFullYear()).slice(2)}`;
}

export function isoDate(d) { return d ? String(d).slice(0, 10) : ''; }

export default API;
