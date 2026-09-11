// Key Artifact Generator — Interactive Demo engine.
// Drives two modes over the same SCENES (see scenes.js):
//  - autorun: scenes render, run their scripted micro-actions, then auto-advance
//  - explore: scenes render once; the user drives everything by hand, and can
//             replay a scene's scripted actions on demand via "Play this step"
(function () {
  'use strict';

  const CANCELLED = Symbol('cancelled');
  const DEFAULT_DWELL = 5200; // ms to sit on a scene with no script before advancing

  const state = { sceneIndex: 0, mode: 'autorun', playing: false, speed: 1, gen: 0 };

  const el = {
    rail: document.getElementById('rail'),
    stage: document.getElementById('stage'),
    caption: document.getElementById('captionText'),
    captionBadge: document.getElementById('captionBadge'),
    progressFill: document.getElementById('tbProgressFill'),
    progressLabel: document.getElementById('tbProgressLabel'),
    btnPlayPause: document.getElementById('btnPlayPause'),
    btnPrev: document.getElementById('btnPrev'),
    btnNext: document.getElementById('btnNext'),
    btnRestart: document.getElementById('btnRestart'),
    btnRunStep: document.getElementById('btnRunStep'),
    speedSelect: document.getElementById('speedSelect'),
    modeAutorunBtn: document.getElementById('modeAutorunBtn'),
    modeExploreBtn: document.getElementById('modeExploreBtn'),
    toastHost: document.getElementById('toastHost'),
    btnTheme: document.getElementById('btnTheme')
  };

  // ---------------- Light / dark layout toggle ----------------
  const THEME_KEY = 'kagDemoTheme';
  function getPreferredTheme() {
    try { const saved = localStorage.getItem(THEME_KEY); if (saved === 'light' || saved === 'dark') return saved; } catch (e) { /* noop */ }
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  }
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    el.btnTheme.textContent = t === 'light' ? '🌙' : '☀️';
    el.btnTheme.title = t === 'light' ? 'Switch to dark layout' : 'Switch to light layout';
    try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* noop */ }
  }
  let currentTheme = getPreferredTheme();
  applyTheme(currentTheme);
  el.btnTheme.addEventListener('click', () => { currentTheme = currentTheme === 'light' ? 'dark' : 'light'; applyTheme(currentTheme); });

  // ---------------- Engine helpers exposed to scenes.js ----------------
  function bumpGen() { return ++state.gen; }

  function wait(ms) {
    const myGen = state.gen;
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        if (state.gen !== myGen) reject(CANCELLED);
        else resolve();
      }, Math.max(1, ms / state.speed));
    });
  }

  function setCaption(text, badge) {
    el.caption.textContent = text;
    if (badge) el.captionBadge.textContent = badge;
  }

  function toast(msg, isErr) {
    const t = document.createElement('div');
    t.className = 'toast' + (isErr ? ' err' : '');
    t.innerHTML = '<span class="dot"></span><span></span>';
    t.querySelector('span:last-child').textContent = msg;
    el.toastHost.appendChild(t);
    window.setTimeout(() => {
      t.style.animation = 'toastOut .25s ease forwards';
      window.setTimeout(() => t.remove(), 260);
    }, 3200);
  }

  async function typeInto(input, text, opts) {
    opts = opts || {};
    const perChar = opts.speed || 22;
    input.classList.add('demo-typing');
    input.value = '';
    input.focus();
    for (let i = 0; i < text.length; i++) {
      input.value += text[i];
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await wait(perChar);
    }
    await wait(180);
    input.classList.remove('demo-typing');
    input.blur();
  }

  async function pulse(node, ms) {
    if (!node) return;
    node.classList.add('hl-pulse');
    scrollIntoView(node);
    await wait(ms || 900);
    node.classList.remove('hl-pulse');
  }

  async function clickFx(node) {
    if (!node) return;
    scrollIntoView(node);
    node.classList.add('clicked');
    await wait(260);
    node.classList.remove('clicked');
  }

  function scrollIntoView(node) {
    try { node.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { /* noop */ }
  }

  const Engine = { wait, setCaption, toast, typeInto, pulse, clickFx, scrollIntoView, CANCELLED, get speed() { return state.speed; } };
  window.Engine = Engine;

  // ---------------- Rail ----------------
  function renderRail() {
    el.rail.innerHTML = '';
    let lastGroup = null;
    SCENES.forEach((scene, i) => {
      if (scene.group !== lastGroup) {
        const g = document.createElement('div');
        g.className = 'rail-group-label';
        g.textContent = scene.group;
        el.rail.appendChild(g);
        lastGroup = scene.group;
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rail-item' + (i === state.sceneIndex ? ' current' : '') + (i < state.sceneIndex ? ' done' : '');
      btn.innerHTML =
        '<span class="num">' + (i < state.sceneIndex ? '✓' : (i + 1)) + '</span>' +
        '<span class="rail-icon">' + scene.icon + '</span>' +
        '<span class="label">' + scene.title + '</span>';
      btn.addEventListener('click', () => goTo(i, { auto: state.mode === 'autorun' && state.playing }));
      el.rail.appendChild(btn);
    });
  }

  function renderProgress() {
    const pct = Math.round(((state.sceneIndex + 1) / SCENES.length) * 100);
    el.progressFill.style.width = pct + '%';
    el.progressLabel.textContent = 'Step ' + (state.sceneIndex + 1) + ' of ' + SCENES.length;
  }

  function updateTransportButtons() {
    el.btnPrev.disabled = state.sceneIndex === 0;
    el.btnNext.disabled = state.sceneIndex === SCENES.length - 1;
    el.btnPlayPause.textContent = (state.mode === 'autorun' && state.playing) ? '⏸' : '▶';
    el.btnPlayPause.title = (state.mode === 'autorun' && state.playing) ? 'Pause (Space)' : 'Play (Space)';
    el.btnRunStep.hidden = state.mode !== 'explore';
  }

  function setMode(mode) {
    state.mode = mode;
    el.modeAutorunBtn.classList.toggle('active', mode === 'autorun');
    el.modeAutorunBtn.setAttribute('aria-selected', mode === 'autorun');
    el.modeExploreBtn.classList.toggle('active', mode === 'explore');
    el.modeExploreBtn.setAttribute('aria-selected', mode === 'explore');
    if (mode === 'explore') {
      state.playing = false;
      bumpGen();
      setCaption(SCENES[state.sceneIndex].blurb, 'EXPLORE');
    }
    updateTransportButtons();
  }

  // ---------------- Scene rendering / playback ----------------
  function renderScene(idx) {
    const scene = SCENES[idx];
    el.stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'scene';
    el.stage.appendChild(wrap);
    scene.render(wrap, Engine);
    el.stage.scrollTop = 0;
    document.title = scene.title + ' — Key Artifact Generator Demo';
  }

  async function runSceneScript(idx, opts) {
    opts = opts || {};
    const scene = SCENES[idx];
    const myGen = state.gen;
    if (!scene.script) {
      setCaption(scene.blurb, state.mode === 'autorun' ? 'GUIDE' : 'EXPLORE');
      if (opts.advance) {
        try { await wait(DEFAULT_DWELL); } catch (e) { return; }
        if (state.gen === myGen) advance();
      }
      return;
    }
    try {
      await scene.script(Engine, el.stage);
      if (state.gen !== myGen) return;
      setCaption(scene.blurb, state.mode === 'autorun' ? 'GUIDE' : 'EXPLORE');
      if (opts.advance) {
        await wait(1400);
        if (state.gen === myGen) advance();
      }
    } catch (e) {
      if (e !== CANCELLED) { console.error(e); }
    }
  }

  function advance() {
    if (state.sceneIndex < SCENES.length - 1) {
      goTo(state.sceneIndex + 1, { auto: true });
    } else {
      state.playing = false;
      updateTransportButtons();
      setCaption('That’s the full tour — press ↺ Restart, or pick any chapter on the left to revisit it.', 'DONE');
    }
  }

  function goTo(idx, opts) {
    opts = opts || {};
    idx = Math.max(0, Math.min(SCENES.length - 1, idx));
    bumpGen();
    state.sceneIndex = idx;
    if (opts.auto) state.playing = true;
    renderRail();
    renderProgress();
    renderScene(idx);
    updateTransportButtons();
    setCaption(SCENES[idx].blurb, opts.auto ? 'GUIDE' : (state.mode === 'autorun' ? 'GUIDE' : 'EXPLORE'));
    if (opts.auto) {
      runSceneScript(idx, { advance: true });
    }
  }

  // ---------------- Transport wiring ----------------
  el.btnPrev.addEventListener('click', () => goTo(state.sceneIndex - 1, { auto: state.mode === 'autorun' && state.playing }));
  el.btnNext.addEventListener('click', () => goTo(state.sceneIndex + 1, { auto: state.mode === 'autorun' && state.playing }));
  el.btnRestart.addEventListener('click', () => goTo(0, { auto: state.mode === 'autorun' }));

  el.btnPlayPause.addEventListener('click', () => {
    if (state.mode !== 'autorun') setMode('autorun');
    if (state.playing) {
      state.playing = false;
      bumpGen();
      updateTransportButtons();
    } else {
      goTo(state.sceneIndex, { auto: true });
    }
  });

  el.btnRunStep.addEventListener('click', () => {
    bumpGen();
    renderScene(state.sceneIndex);
    runSceneScript(state.sceneIndex, { advance: false });
  });

  el.modeAutorunBtn.addEventListener('click', () => {
    setMode('autorun');
    goTo(state.sceneIndex, { auto: true });
  });
  el.modeExploreBtn.addEventListener('click', () => {
    setMode('explore');
    renderScene(state.sceneIndex);
  });

  el.speedSelect.addEventListener('change', (e) => { state.speed = parseFloat(e.target.value) || 1; });

  document.addEventListener('keydown', (e) => {
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowRight') { el.btnNext.click(); }
    else if (e.key === 'ArrowLeft') { el.btnPrev.click(); }
    else if (e.key === ' ') { e.preventDefault(); el.btnPlayPause.click(); }
  });

  window.gotoScene = function (id) {
    const idx = SCENES.findIndex((s) => s.id === id);
    if (idx < 0) return;
    goTo(idx, { auto: state.mode === 'autorun' && state.playing });
  };

  // ---------------- Boot ----------------
  renderRail();
  renderProgress();
  renderScene(0);
  updateTransportButtons();
  setCaption(SCENES[0].blurb, 'GUIDE');
  window.setTimeout(() => { goTo(0, { auto: true }); }, 1100);
})();
