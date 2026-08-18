import React from 'react';
import { fmtDate } from '../../api/client.js';

export { fmtDate };

export function MenuLink({ onMenu }) {
  if (!onMenu) return null;
  return <span className="menu-link" onClick={onMenu}>Menu</span>;
}

export function SlideTitle({ children, onMenu }) {
  return <div className="slide-title">{children} <MenuLink onMenu={onMenu} /></div>;
}

export function SectionSub({ children, style }) {
  return <div className="section-sub" style={style}>{children}</div>;
}

export function Kv({ k, v }) {
  return <div className="kv"><span className="k">{k}</span><span className="v">{v ?? ''}</span></div>;
}

export function findRole(hrplan, role) {
  return hrplan.find((h) => h.role_acronym === role) || {};
}
