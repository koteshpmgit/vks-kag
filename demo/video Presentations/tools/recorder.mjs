// Records a scripted browser session to MP4: headless Edge, a steady screenshot
// loop (frames with their timestamps) -> ffmpeg concat (variable frame
// durations; fast-forwarded stretches compressed) -> H.264.
// Narration: every caption / title card (and say()) is spoken with an offline
// Windows voice. The script waits for each line to finish before the next one,
// and its start time is logged; after encoding, the clips are mixed into the
// MP4 at their exact video times and a matching WebVTT subtitle file is written.
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { synthesize, spoken } from './tts.mjs';
const require = createRequire(import.meta.url);
const FFMPEG = require('ffmpeg-static');

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let portSeq = 9400;

export async function openBrowser({ width = 1280, height = 800, workDir, narrate = false }) {
  workDir = path.resolve(workDir);   // Edge resolves a relative profile path against its own folder
  const port = portSeq++;
  const profile = path.join(workDir, `profile-${port}`);
  fs.rmSync(profile, { recursive: true, force: true });
  const proc = spawn(EDGE, ['--headless=new', `--window-size=${width},${height}`, '--hide-scrollbars', '--force-device-scale-factor=1',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank']);
  let tabs; for (let i = 0; i < 40 && !tabs; i++) { await sleep(300); tabs = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json()).catch(() => null); }
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = {}; const listeners = []; const errors = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending[d.id]) { pending[d.id](d.result); delete pending[d.id]; }
    if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.method) listeners.forEach((fn) => fn(d));
  };
  const cmd = (method, params = {}) => new Promise((r) => { pending[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
  await cmd('Runtime.enable'); await cmd('Page.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  const ev = async (expr) => (await cmd('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
  const narr = { on: !!narrate, clips: new Map(), busyUntil: 0, events: null, cacheDir: path.join(workDir, 'tts') };
  const now = () => performance.now() / 1000;
  const clipFor = (text) => {
    const say = spoken(text);
    if (!narr.clips.has(say)) narr.clips.set(say, synthesize([say], narr.cacheDir)[0]);
    return narr.clips.get(say);
  };
  const waitNarration = async () => { while (now() < narr.busyUntil) await sleep(50); };
  // registers a spoken line starting now (call right after its visual appears)
  const startLine = (clip, caption) => {
    if (narr.events) narr.events.push({ t: now(), clip, caption });
    narr.busyUntil = now() + clip.seconds + 0.35;
  };
  const b = {
    cmd, ev, errors, width, height,
    // speak every caption/title-card text found in the recording scripts in one
    // batch up front (each separate synthesis costs ~2s of PowerShell start-up)
    preloadNarration(sourceFiles) {
      if (!narr.on) return 0;
      const texts = new Set();
      for (const f of sourceFiles) {
        const src = fs.readFileSync(f, 'utf8');
        for (const m of src.matchAll(/(?:caption|say)\(\s*'((?:[^'\\]|\\.){12,})'/g)) texts.add(m[1]);
        for (const m of src.matchAll(/titleCard\(\s*'((?:[^'\\]|\\.)+)'\s*,\s*'((?:[^'\\]|\\.)+)'/g)) texts.add(`${m[1]}. ${m[2]}`);
        for (const m of src.matchAll(/\[\s*'[^']{2,40}'\s*,\s*'((?:[^'\\]|\\.){20,})'\s*\]/g)) texts.add(m[1]);   // [tab, caption] pairs
        for (const m of src.matchAll(/NARRATION\s*=\s*\{([\s\S]*?)\n\};/g)) for (const n of m[1].matchAll(/:\s*'((?:[^'\\]|\\.){12,})'/g)) texts.add(n[1]);
      }
      const list = [...texts].map((t) => t.replace(/\\'/g, "'"));
      const clips = synthesize(list.map(spoken), narr.cacheDir);
      clips.forEach((c) => narr.clips.set(c.text, c));
      return clips.length;
    },
    waitNarration,
    // narration without an on-screen caption (e.g. over the demo's own caption bar)
    async say(text) {
      if (!narr.on) return;
      const clip = clipFor(text);
      await waitNarration();
      startLine(clip, text);
    },
    async goto(url) { await cmd('Page.navigate', { url }); await b.until('document.readyState === "complete"', 20000); await sleep(400); },
    async until(expr, ms = 20000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(`(()=>{try{return !!(${expr})}catch(e){return false}})()`)) return true; await sleep(150); } throw new Error('timeout: ' + expr); },
    // --- presentation overlay: caption bar + click ripple ---
    async caption(text, kind = 'step', { say } = {}) {
      const clip = narr.on ? clipFor(say ?? text) : null;
      if (clip) await waitNarration();
      await ev(`(()=>{let c=document.getElementById('__cap');if(!c){c=document.createElement('div');c.id='__cap';c.style.cssText='position:fixed;left:50%;'+(window.__capTop?'top:70px':'bottom:22px')+';transform:translateX(-50%);z-index:2147483647;max-width:86%;padding:12px 20px;border-radius:12px;background:rgba(15,23,42,.92);color:#fff;font:600 16px/1.4 Segoe UI,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:opacity .25s;pointer-events:none';document.body.appendChild(c)}
        c.innerHTML=${JSON.stringify(text)};c.style.borderLeft='5px solid '+(${JSON.stringify(kind)}==='title'?'#22d3ee':${JSON.stringify(kind)}==='ai'?'#a78bfa':${JSON.stringify(kind)}==='warn'?'#f59e0b':'#34d399');c.style.opacity=1;return 1})()`);
      if (clip) startLine(clip, text);
    },
    async hideCaption() { await ev(`(()=>{const c=document.getElementById('__cap');if(c)c.style.opacity=0;return 1})()`); },
    async titleCard(title, sub, ms = 2600) {
      const clip = narr.on ? clipFor(`${title}. ${sub}`) : null;
      if (clip) await waitNarration();
      await ev(`(()=>{const t=document.createElement('div');t.id='__title';t.style.cssText='position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:linear-gradient(135deg,#0f172a,#134e4a);color:#fff;font-family:Segoe UI,system-ui,sans-serif;text-align:center;padding:40px';
        t.innerHTML='<div style="font-size:15px;letter-spacing:.2em;text-transform:uppercase;color:#5eead4">Key Artifact Generator</div><div style="font-size:44px;font-weight:800;max-width:900px">'+${JSON.stringify(title)}+'</div><div style="font-size:20px;color:#cbd5e1;max-width:820px;line-height:1.45">'+${JSON.stringify(sub)}+'</div>';document.body.appendChild(t);return 1})()`);
      if (clip) { startLine(clip, `${title} — ${sub}`); ms = Math.max(ms, clip.seconds * 1000 + 400); }
      await sleep(ms);
      await ev(`(()=>{const t=document.getElementById('__title');if(t)t.remove();return 1})()`);
    },
    // highlight an element, then click it (selector, or [selector, text] to match by text)
    async click(target, { ms = 650 } = {}) {
      // [selector, text] matches text contained; [selector, text, 'exact'] matches it exactly
      const find = Array.isArray(target)
        ? `[...document.querySelectorAll(${JSON.stringify(target[0])})].find(e=>${target[2] === 'exact' ? `e.textContent.trim()===${JSON.stringify(target[1])}` : `e.textContent.trim().includes(${JSON.stringify(target[1])})`})`
        : `document.querySelector(${JSON.stringify(target)})`;
      const ok = await ev(`(()=>{const el=${find};if(!el)return false;el.scrollIntoView({block:'center',behavior:'instant'});const r=el.getBoundingClientRect();const d=document.createElement('div');
        d.style.cssText='position:fixed;z-index:2147483646;pointer-events:none;border:3px solid #22d3ee;border-radius:10px;box-shadow:0 0 0 6px rgba(34,211,238,.25);transition:all .3s;left:'+(r.left-6)+'px;top:'+(r.top-6)+'px;width:'+(r.width+12)+'px;height:'+(r.height+12)+'px';
        document.body.appendChild(d);setTimeout(()=>d.remove(),${ms + 500});window.__clickTarget=el;return true})()`);
      if (!ok) throw new Error('click target not found: ' + JSON.stringify(target));
      await sleep(ms);
      await ev(`(()=>{window.__clickTarget.click();return 1})()`);
      await sleep(350);
    },
    async type(selector, text, perChar = 45) {
      await ev(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center'});el.focus();return 1})()`);
      for (let i = 1; i <= text.length; i++) {
        await ev(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement:HTMLInputElement;Object.getOwnPropertyDescriptor(proto.prototype,'value').set.call(el,${JSON.stringify(text)}.slice(0,${i}));el.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
        await sleep(perChar);
      }
      await ev(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.dispatchEvent(new Event('change',{bubbles:true}));el.dispatchEvent(new FocusEvent('focusout',{bubbles:true}));el.blur();return 1})()`);
    },
    async scrollTo(selector) { await ev(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(el)el.scrollIntoView({block:'start',behavior:'smooth'});return 1})()`); await sleep(900); },
    async setFile(selector, file) {
      const { root } = await cmd('DOM.getDocument', { depth: -1 });
      const { nodeId } = await cmd('DOM.querySelector', { nodeId: root.nodeId, selector });
      await cmd('DOM.setFileInputFiles', { nodeId, files: [file] });
    },
    // --- recording ---
    async startRecording(name, outDir) {
      const frameDir = path.join(workDir, 'frames-' + name);
      fs.rmSync(frameDir, { recursive: true, force: true }); fs.mkdirSync(frameDir, { recursive: true });
      // Steady screenshot loop (the screencast API only emits frames on repaint
      // and stalls on idle pages). fastForward(on) marks frames to play back
      // FF_FACTOR x faster (e.g. while waiting for the AI).
      const frames = [];
      const FF_FACTOR = 10;
      let recording = true; let ff = false;
      narr.events = [];
      narr.busyUntil = 0;
      // never fast-forward over a line that is still being spoken
      b.fastForward = async (on) => { if (on) await waitNarration(); ff = on; };
      const loop = (async () => {
        while (recording) {
          const t = performance.now() / 1000;
          const shot = await cmd('Page.captureScreenshot', { format: 'jpeg', quality: 82, optimizeForSpeed: true, captureBeyondViewport: false });
          if (!shot?.data) continue;
          const f = path.join(frameDir, `f${String(frames.length).padStart(6, '0')}.jpg`);
          fs.writeFileSync(f, Buffer.from(shot.data, 'base64'));
          frames.push({ f, t, ff });
          const spent = performance.now() / 1000 - t;
          if (ff) await sleep(Math.max(0, 500 - spent * 1000));   // fewer frames while fast-forwarding
        }
      })();
      b.stopRecording = async ({ maxGap = 2.0 } = {}) => {
        await waitNarration();
        await sleep(600);
        recording = false;
        await loop;
        fs.mkdirSync(outDir, { recursive: true });
        const list = [];
        let total = 0;
        const timeline = [];   // per frame: real start, real length, video start, video length
        for (let i = 0; i < frames.length; i++) {
          const next = frames[i + 1]?.t ?? frames[i].t + 1.5;
          const real = Math.max(next - frames[i].t, 0.02);
          let dur = real;
          if (frames[i].ff) dur /= FF_FACTOR;
          dur = Math.min(dur, maxGap);
          timeline.push({ t: frames[i].t, real, v: total, dur });
          total += dur;
          list.push(`file '${frames[i].f.replace(/\\/g, '/')}'`, `duration ${dur.toFixed(3)}`);
        }
        list.push(`file '${frames[frames.length - 1].f.replace(/\\/g, '/')}'`);
        const listFile = path.join(frameDir, 'list.txt');
        fs.writeFileSync(listFile, list.join('\n'));
        const out = path.join(outDir, `${name}.mp4`);
        const events = narr.events || [];
        const videoOnly = events.length ? path.join(frameDir, 'video.mp4') : out;
        execFileSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile,
          '-vf', `fps=25,scale=${width}:-2:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '27',
          '-movflags', '+faststart', videoOnly]);
        let vtt = null;
        if (events.length) {
          // real time -> video time (frames played faster while fast-forwarding)
          const vt = (T) => {
            let lo = 0, hi = timeline.length - 1;
            while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (timeline[mid].t <= T) lo = mid; else hi = mid - 1; }
            const f = timeline[lo];
            return f.v + Math.min(Math.max(T - f.t, 0) * (f.dur / f.real), f.dur);
          };
          const cues = events.map((e) => ({ ...e, v: vt(e.t) }));
          const inputs = cues.flatMap((c) => ['-i', c.clip.file]);
          const chains = cues.map((c, i) => `[${i + 1}:a]aresample=44100,adelay=delays=${Math.round(c.v * 1000)}:all=1[a${i}]`);
          const mix = `${cues.map((_, i) => `[a${i}]`).join('')}amix=inputs=${cues.length}:normalize=0:duration=longest:dropout_transition=0[aout]`;
          execFileSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-i', videoOnly, ...inputs,
            '-filter_complex', [...chains, mix].join(';'), '-map', '0:v', '-map', '[aout]',
            '-c:v', 'copy', '-c:a', 'aac', '-b:a', '96k', '-ac', '1', '-movflags', '+faststart', out]);
          // subtitles: each line until the next one starts (or a little after it ends)
          const ts = (x) => { const ms = Math.round(x * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`; };
          const text = (c) => String(c.caption).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
          vtt = path.join(outDir, `${name}.vtt`);
          fs.writeFileSync(vtt, 'WEBVTT\n\n' + cues.map((c, i) => {
            const end = Math.min(cues[i + 1]?.v ?? Infinity, c.v + c.clip.seconds + 1.2, total);
            return `${i + 1}\n${ts(c.v)} --> ${ts(Math.max(end, c.v + 0.5))}\n${text(c)}\n`;
          }).join('\n'));
        }
        // poster: a frame ~40% in
        const poster = path.join(outDir, `${name}.jpg`);
        execFileSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-ss', (total * 0.4).toFixed(2), '-i', out, '-frames:v', '1', '-q:v', '3', poster]);
        fs.rmSync(frameDir, { recursive: true, force: true });
        narr.events = null;
        return { out, poster, vtt, narrationLines: events.length, seconds: Math.round(total), frames: frames.length, bytes: fs.statSync(out).size };
      };
    },
    async close() { try { ws.close(); } catch {} proc.kill(); }
  };
  return b;
}
