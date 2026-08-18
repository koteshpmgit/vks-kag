import React from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';

const THEME_OPTIONS = [
  { group: 'Themes', options: [['ocean', 'Ocean'], ['emerald', 'Emerald'], ['sunset', 'Sunset'], ['glossy', 'Glossy Transparent']] },
  { group: 'RGB', options: [['red', 'Red (RGB)'], ['green', 'Green (RGB)'], ['blue', 'Blue (RGB)']] },
  { group: 'VIBGYOR', options: [['violet', 'Violet'], ['indigo', 'Indigo'], ['blue', 'Blue'], ['green', 'Green'], ['yellow', 'Yellow'], ['orange', 'Orange'], ['red', 'Red'], ['vibgyor', 'Rainbow (VIBGYOR)']] }
];

export default function SettingsPopover({ hidden }) {
  const { visual, setVisual } = useTheme();
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
        <select value={visual.color} onChange={(e) => setVisual((v) => ({ ...v, color: e.target.value }))}>
          {THEME_OPTIONS.map((g) => (
            <optgroup key={g.group} label={g.group}>
              {g.options.map(([val, label]) => <option key={val + label} value={val}>{label}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
    </div>
  );
}
