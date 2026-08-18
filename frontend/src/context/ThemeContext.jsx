import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const THEMES = ['ocean', 'violet', 'emerald', 'sunset', 'glossy', 'red', 'green', 'blue', 'indigo', 'yellow', 'orange', 'vibgyor'];

export const BG_SWATCHES = [
  '#0f172a', '#0e7490', '#0f766e', '#166534', '#854d0e', '#9a3412',
  '#991b1b', '#5b21b6', '#1e40af', '#334155', '#0891b2', '#fdf6e0'
];

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function saveJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 8, g: 145, b: 178 };
}
function rgbToHex(r, g, b) {
  const h = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
export function mixColor(hex, target, weight) {
  const a = hexToRgb(hex), b = hexToRgb(target);
  return rgbToHex(a.r + (b.r - a.r) * weight, a.g + (b.g - a.g) * weight, a.b + (b.b - a.b) * weight);
}
function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

const DEFAULT_VISUAL = { glass: true, threeD: false, depth: 6, color: 'ocean' };
const DEFAULT_WA_VISUAL = { ...DEFAULT_VISUAL, customColor: '#0891b2', customActive: false, density: 'comfortable' };
const DEFAULT_BG = { type: 'theme', value: '' };

export function ThemeProvider({ scope, children }) {
  // scope: 'modern' | 'webapp' - which layout is mounted (drives which localStorage keys + body classes apply)
  const isWebApp = scope === 'webapp';
  const [visual, setVisual] = useState(() =>
    loadJSON(isWebApp ? 'kagWaVisualOptions' : 'kagVisualOptions', isWebApp ? DEFAULT_WA_VISUAL : DEFAULT_VISUAL));
  const [background, setBackground] = useState(() => loadJSON('kagWaBackground', DEFAULT_BG));
  const [sidebarHidden, setSidebarHidden] = useState(() => loadJSON(isWebApp ? 'kagWaSidebar' : 'kagSidebar', false));

  useEffect(() => {
    saveJSON(isWebApp ? 'kagWaVisualOptions' : 'kagVisualOptions', visual);
  }, [visual, isWebApp]);
  useEffect(() => { saveJSON('kagWaBackground', background); }, [background]);
  useEffect(() => {
    saveJSON(isWebApp ? 'kagWaSidebar' : 'kagSidebar', sidebarHidden);
  }, [sidebarHidden, isWebApp]);

  // apply body-level classes/attrs (the shared CSS targets `body`)
  useEffect(() => {
    const body = document.body;
    body.classList.toggle('fx-glass', !!visual.glass);
    body.classList.toggle('fx-3d', !!visual.threeD);
    body.style.setProperty('--depth-scale', String((visual.depth ?? 6) / 10));
    body.dataset.theme = visual.color || 'ocean';
    body.classList.toggle('wa-compact', isWebApp && visual.density === 'compact');
    body.classList.toggle('sidebar-hidden', !isWebApp && sidebarHidden);
    body.classList.toggle('wa-sidebar-hidden', isWebApp && sidebarHidden);

    if (isWebApp && visual.customActive && visual.customColor) {
      const accent = visual.customColor;
      const accentDark = mixColor(accent, '#000000', 0.32);
      const accentSoft = mixColor(accent, '#ffffff', 0.92);
      body.style.setProperty('--accent', accent);
      body.style.setProperty('--accent-dark', accentDark);
      body.style.setProperty('--accent-soft', accentSoft);
      body.style.setProperty('--sheet-head', accentSoft);
      body.style.setProperty('--cool-gradient', `linear-gradient(135deg, #0f172a 0%, ${accentDark} 48%, ${accent} 100%)`);
      body.style.setProperty('--panel-gradient', `linear-gradient(145deg, rgba(255,255,255,.98), ${accentSoft})`);
    } else {
      ['--accent', '--accent-dark', '--accent-soft', '--sheet-head', '--cool-gradient', '--panel-gradient'].forEach((p) =>
        body.style.removeProperty(p));
    }

    return () => {};
  }, [visual, sidebarHidden, isWebApp]);

  // Background (WebApp only): color / image / video, with auto contrast
  useEffect(() => {
    if (!isWebApp) return;
    const body = document.body;
    let existingVideo = document.getElementById('bgVideoEl');
    if (existingVideo) existingVideo.remove();
    body.style.background = '';
    body.style.backgroundImage = '';

    const setContrast = (light) => {
      body.classList.toggle('bg-is-light', light === true);
      body.classList.toggle('bg-is-dark', light === false);
    };

    if (!background.value || background.type === 'theme') {
      setContrast(null);
      return;
    }
    if (background.type === 'color') {
      body.style.background = background.value;
      setContrast(luminance(background.value) > 0.55);
    } else if (background.type === 'image') {
      body.style.backgroundImage = `url(${background.value})`;
      body.style.backgroundSize = 'cover';
      body.style.backgroundPosition = 'center';
      body.style.backgroundAttachment = 'fixed';
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = 16; c.height = 16;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0, 16, 16);
          const px = ctx.getImageData(0, 0, 16, 16).data;
          let sum = 0;
          for (let i = 0; i < px.length; i += 4) sum += 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
          setContrast((sum / (px.length / 4)) / 255 > 0.55);
        } catch { setContrast(null); }
      };
      img.src = background.value;
    } else if (background.type === 'video') {
      const video = document.createElement('video');
      video.id = 'bgVideoEl';
      video.src = background.value;
      video.autoplay = true; video.loop = true; video.muted = true; video.playsInline = true;
      document.body.appendChild(video);
      setContrast(false);
    }
  }, [background, isWebApp]);

  const api = useMemo(() => ({
    visual, setVisual,
    background, setBackground,
    sidebarHidden, setSidebarHidden,
    isWebApp,
    themes: THEMES
  }), [visual, background, sidebarHidden, isWebApp]);

  return <ThemeContext.Provider value={api}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
