// Thin API client - same contract as the old js/api.js
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

export function fmtDate(d) {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d.slice(0, 10) + 'T00:00:00') : d;
  if (Number.isNaN(dt.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(dt.getDate()).padStart(2, '0')}-${months[dt.getMonth()]}-${String(dt.getFullYear()).slice(2)}`;
}

export function isoDate(d) { return d ? String(d).slice(0, 10) : ''; }

export default API;
