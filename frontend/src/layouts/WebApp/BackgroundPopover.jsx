import React, { useState } from 'react';
import { useTheme, BG_SWATCHES } from '../../context/ThemeContext.jsx';

export default function BackgroundPopover({ hidden }) {
  const { background, setBackground } = useTheme();
  const [tab, setTab] = useState('color');
  const [pendingUrl, setPendingUrl] = useState('');

  const applyColor = (hex) => setBackground({ type: 'color', value: hex });

  const applyFile = (file, type) => {
    const reader = new FileReader();
    reader.onload = () => setBackground({ type, value: reader.result });
    reader.readAsDataURL(file);
  };

  return (
    <div className="settings-popover bg-popover" hidden={hidden}>
      <h4>Background</h4>
      <div className="bg-tabs" role="tablist">
        {['color', 'image', 'video'].map((t) => (
          <button key={t} type="button" className={`bg-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'color' && (
        <div className="bg-panel">
          <div className="bg-swatches">
            {BG_SWATCHES.map((hex) => (
              <button key={hex} type="button"
                className={`bg-swatch${background.type === 'color' && background.value === hex ? ' active' : ''}`}
                style={{ background: hex }} onClick={() => applyColor(hex)} />
            ))}
          </div>
          <label className="color-control">
            <b>Custom color</b>
            <input type="color" defaultValue="#0f172a" onChange={(e) => applyColor(e.target.value)} />
          </label>
        </div>
      )}

      {tab === 'image' && (
        <div className="bg-panel">
          <label className="bg-field">
            <b>Image URL</b>
            <input type="text" placeholder="https://example.com/photo.jpg" value={pendingUrl} onChange={(e) => setPendingUrl(e.target.value)} />
          </label>
          <div className="bg-or">or</div>
          <label className="bg-field">
            <b>Upload from device</b>
            <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && applyFile(e.target.files[0], 'image')} />
          </label>
        </div>
      )}

      {tab === 'video' && (
        <div className="bg-panel">
          <label className="bg-field">
            <b>Video URL</b>
            <input type="text" placeholder="https://example.com/clip.mp4" value={pendingUrl} onChange={(e) => setPendingUrl(e.target.value)} />
          </label>
          <div className="bg-or">or</div>
          <label className="bg-field">
            <b>Upload from device</b>
            <input type="file" accept="video/*" onChange={(e) => {
              if (!e.target.files[0]) return;
              setBackground({ type: 'video', value: URL.createObjectURL(e.target.files[0]) });
            }} />
          </label>
          <small className="wizard-note">An uploaded video only lasts this browser session — use a URL for it to survive a reload.</small>
        </div>
      )}

      <div className="bg-actions">
        <button className="btn btn-light btn-sm" type="button" onClick={() => setBackground({ type: 'theme', value: '' })}>Reset to theme default</button>
        {(tab === 'image' || tab === 'video') && pendingUrl && (
          <button className="btn btn-accent btn-sm" type="button" onClick={() => setBackground({ type: tab, value: pendingUrl })}>Apply</button>
        )}
      </div>
    </div>
  );
}
