import React from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';

const THEME_OPTIONS = [
  { group: 'Themes', options: [['ocean', 'Ocean'], ['emerald', 'Emerald'], ['sunset', 'Sunset'], ['glossy', 'Glossy Transparent']] },
  { group: 'RGB', options: [['red', 'Red (RGB)'], ['green', 'Green (RGB)'], ['blue', 'Blue (RGB)']] },
  { group: 'VIBGYOR', options: [['violet', 'Violet'], ['indigo', 'Indigo'], ['blue', 'Blue'], ['green', 'Green'], ['yellow', 'Yellow'], ['orange', 'Orange'], ['red', 'Red'], ['vibgyor', 'Rainbow (VIBGYOR)']] }
];

const DEFAULT_VISUAL = { glass: true, threeD: false, depth: 6, color: 'ocean', customColor: '#0891b2', customActive: false, density: 'comfortable' };

export default function SettingsPopover({ hidden }) {
  const { visual, setVisual, setBackground } = useTheme();

  return (
    <div className="settings-popover" hidden={hidden}>
      <h4>Display Settings</h4>
      <label className="switch" title="Transparent glass surfaces">
        <b>Glass</b>
        <input type="checkbox" checked={!!visual.glass} onChange={(e) => setVisual((v) => ({ ...v, glass: e.target.checked }))} />
        <span></span>
      </label>
      <label className="switch" title="3D controls and cards">
        <b>3D</b>
        <input type="checkbox" checked={!!visual.threeD} onChange={(e) => setVisual((v) => ({ ...v, threeD: e.target.checked }))} />
        <span></span>
      </label>
      <label className="depth-control" title="3D depth">
        <b>Depth</b>
        <input type="range" min={0} max={10} value={visual.depth ?? 6} onChange={(e) => setVisual((v) => ({ ...v, depth: Number(e.target.value) }))} />
      </label>
      <label className="color-control" title="Theme color">
        <b>Color</b>
        <select value={visual.color} onChange={(e) => setVisual((v) => ({ ...v, color: e.target.value, customActive: false }))}>
          {THEME_OPTIONS.map((g) => (
            <optgroup key={g.group} label={g.group}>
              {g.options.map(([val, label]) => <option key={val + label} value={val}>{label}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      <label className="color-control" title="Pick any custom color - overrides the theme above">
        <b>Custom accent</b>
        <input type="color" value={visual.customColor || '#0891b2'} onChange={(e) => setVisual((v) => ({ ...v, customColor: e.target.value, customActive: true }))} />
      </label>
      <label className="density-control" title="Content spacing">
        <b>Density</b>
        <select value={visual.density || 'comfortable'} onChange={(e) => setVisual((v) => ({ ...v, density: e.target.value }))}>
          <option value="comfortable">Comfortable</option>
          <option value="compact">Compact</option>
        </select>
      </label>
      <button className="btn btn-light btn-sm" type="button" onClick={() => { setVisual(DEFAULT_VISUAL); setBackground({ type: 'theme', value: '' }); }}>
        Reset to defaults
      </button>
    </div>
  );
}
