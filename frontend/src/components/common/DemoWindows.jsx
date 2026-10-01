import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// "Demo" and "Video Demo" header buttons + the frameless in-app window they open.
// Browsers no longer allow truly chromeless popups (window.open always keeps an
// address bar), so the window is drawn inside the app: its own title bar with
// minimise (to a tab at the bottom), maximise/restore, full screen and close,
// draggable by the title bar and resizable from the corner. "Pop out" still
// opens it as a separate minimal browser window.
// The pages are served by the backend at /demo (repo folder demo/).
export const DEMOS = {
  demo: { title: 'Interactive Demo', icon: '🎬', src: '/demo/index.html', hint: 'Self-running product tour — switch to Explore to click through it yourself' },
  video: { title: 'Video Demo', icon: '▶️', src: '/demo/video%20Presentations/index.html', hint: 'Narrated walkthrough videos of every way to use the app' }
};

const DemoWindowContext = createContext(null);
export const useDemoWindows = () => useContext(DemoWindowContext);

export function DemoWindowProvider({ children }) {
  // open windows in stacking order (last = front): { id, state: 'normal'|'max'|'min' }
  const [wins, setWins] = useState([]);
  const open = useCallback((id) => {
    setWins((ws) => {
      const existing = ws.find((w) => w.id === id);
      const rest = ws.filter((w) => w.id !== id);
      return [...rest, { id, state: existing && existing.state !== 'min' ? existing.state : (window.innerWidth < 760 ? 'max' : 'normal') }];
    });
  }, []);
  const close = useCallback((id) => setWins((ws) => ws.filter((w) => w.id !== id)), []);
  const setState = useCallback((id, state) => setWins((ws) => {
    const w = ws.find((x) => x.id === id);
    return w ? [...ws.filter((x) => x.id !== id), { ...w, state }] : ws;
  }), []);
  const front = useCallback((id) => setWins((ws) => {
    const w = ws.find((x) => x.id === id);
    return w && ws[ws.length - 1]?.id !== id ? [...ws.filter((x) => x.id !== id), w] : ws;
  }), []);

  const minimised = wins.filter((w) => w.state === 'min');
  return (
    <DemoWindowContext.Provider value={{ open }}>
      {children}
      {wins.map((w, i) => (
        <DemoWindow key={w.id} id={w.id} state={w.state} z={2000 + i}
          onClose={() => close(w.id)} onState={(s) => setState(w.id, s)} onFront={() => front(w.id)} />
      ))}
      {minimised.length > 0 && (
        <div className="dw-dock" role="toolbar" aria-label="Minimised windows">
          {minimised.map((w) => (
            <div key={w.id} className="dw-dock-item">
              <button type="button" className="dw-dock-open" onClick={() => setState(w.id, 'normal')} title="Restore">
                <span aria-hidden="true">{DEMOS[w.id].icon}</span> {DEMOS[w.id].title}
              </button>
              <button type="button" className="dw-dock-close" onClick={() => close(w.id)} title="Close" aria-label={`Close ${DEMOS[w.id].title}`}>×</button>
            </div>
          ))}
        </div>
      )}
    </DemoWindowContext.Provider>
  );
}

function DemoWindow({ id, state, z, onClose, onState, onFront }) {
  const def = DEMOS[id];
  const ref = useRef(null);
  const [pos, setPos] = useState(() => {
    const w = Math.min(1180, Math.round(window.innerWidth * 0.82));
    const h = Math.min(780, Math.round(window.innerHeight * 0.82));
    const offset = id === 'video' ? 28 : 0;
    return { x: Math.max(8, Math.round((window.innerWidth - w) / 2) + offset), y: Math.max(8, Math.round((window.innerHeight - h) / 2) + offset), w, h };
  });
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    const onFs = () => setIsFull(document.fullscreenElement === ref.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // keep the user's size after a corner resize (CSS resize: both)
  useEffect(() => {
    const el = ref.current;
    if (!el || state !== 'normal') return undefined;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setPos((p) => (Math.abs(p.w - r.width) > 1 || Math.abs(p.h - r.height) > 1 ? { ...p, w: Math.round(r.width), h: Math.round(r.height) } : p));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [state]);

  const startDrag = (e) => {
    if (state !== 'normal' || e.button !== 0 || e.target.closest('button')) return;
    onFront();
    const sx = e.clientX, sy = e.clientY, ox = pos.x, oy = pos.y;
    const shield = document.createElement('div');   // keeps mouse events away from the iframe while dragging
    shield.className = 'dw-shield';
    document.body.appendChild(shield);
    const move = (ev) => setPos((p) => ({
      ...p,
      x: Math.min(window.innerWidth - 120, Math.max(-p.w + 160, ox + ev.clientX - sx)),
      y: Math.min(window.innerHeight - 40, Math.max(0, oy + ev.clientY - sy))
    }));
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); shield.remove(); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else ref.current?.requestFullscreen?.().catch(() => {});
  };
  const popOut = () => {
    const w = Math.min(1280, window.screen.availWidth - 40), h = Math.min(860, window.screen.availHeight - 60);
    const win = window.open(def.src, `kag-${id}`, `popup=yes,width=${w},height=${h},left=${Math.round((window.screen.availWidth - w) / 2)},top=${Math.round((window.screen.availHeight - h) / 2)}`);
    if (win) onClose();
  };

  const style = state === 'max' ? { zIndex: z } : { zIndex: z, left: pos.x, top: pos.y, width: pos.w, height: pos.h };
  return (
    <section
      ref={ref}
      className={`dw-window dw-${state}${isFull ? ' dw-full' : ''}`}
      style={style}
      role="dialog"
      aria-label={def.title}
      onPointerDown={onFront}
      hidden={state === 'min'}
    >
      <header className="dw-titlebar" onPointerDown={startDrag} onDoubleClick={(e) => { if (!e.target.closest('button')) onState(state === 'max' ? 'normal' : 'max'); }}>
        <span className="dw-title"><span aria-hidden="true">{def.icon}</span> {def.title}<small>{def.hint}</small></span>
        <span className="dw-controls">
          <button type="button" onClick={popOut} title="Open in a separate window" aria-label="Pop out">⧉</button>
          <button type="button" onClick={() => onState('min')} title="Minimise" aria-label="Minimise">—</button>
          <button type="button" onClick={() => onState(state === 'max' ? 'normal' : 'max')} title={state === 'max' ? 'Restore' : 'Maximise'} aria-label={state === 'max' ? 'Restore' : 'Maximise'}>{state === 'max' ? '❐' : '□'}</button>
          <button type="button" onClick={toggleFull} title={isFull ? 'Exit full screen' : 'Full screen'} aria-label="Full screen">{isFull ? '🗗' : '⛶'}</button>
          <button type="button" className="dw-close" onClick={() => { if (document.fullscreenElement) document.exitFullscreen(); onClose(); }} title="Close" aria-label="Close">×</button>
        </span>
      </header>
      <iframe className="dw-frame" src={def.src} title={def.title} allow="fullscreen; autoplay" allowFullScreen />
    </section>
  );
}

// The two header buttons; `variant` matches each layout's header button style.
export function DemoButtons({ variant = 'pill' }) {
  const { open } = useDemoWindows();
  if (variant === 'icon') {
    return (
      <>
        <button type="button" className="icon-btn" title={`${DEMOS.demo.title} — ${DEMOS.demo.hint}`} onClick={() => open('demo')}>🎬</button>
        <button type="button" className="icon-btn" title={`${DEMOS.video.title} — ${DEMOS.video.hint}`} onClick={() => open('video')}>▶️</button>
      </>
    );
  }
  if (variant === 'excel') {
    return (
      <>
        <button type="button" title={DEMOS.demo.hint} onClick={() => open('demo')}>🎬 Demo</button>
        <button type="button" title={DEMOS.video.hint} onClick={() => open('video')}>▶ Video Demo</button>
      </>
    );
  }
  return (
    <>
      <button type="button" className="btn btn-light btn-sm" title={DEMOS.demo.hint} onClick={() => open('demo')}>🎬 Demo</button>
      <button type="button" className="btn btn-light btn-sm" title={DEMOS.video.hint} onClick={() => open('video')}>▶ Video Demo</button>
    </>
  );
}
