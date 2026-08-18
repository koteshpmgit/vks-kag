import React from 'react';

export default function TabBar({ sheets, active, onActivate }) {
  return (
    <div id="tabbar">
      {sheets.map((s) => (
        <span
          key={s.name}
          className={`tab${active === s.name ? ' active' : ''}`}
          onClick={() => onActivate(s.name)}
        >
          {s.tabLabel || s.name}
        </span>
      ))}
    </div>
  );
}
