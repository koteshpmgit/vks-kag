import React from 'react';
import { SlideTitle, SectionSub } from './helpers.jsx';

export default function DesignDocument({ data, onMenu }) {
  const { project, design } = data;

  if (!design) {
    return (
      <div>
        <SlideTitle onMenu={onMenu}>Design Document – {project.project_key}</SlideTitle>
        <div className="note">No SRS (requirements) document has been uploaded for this project yet. Upload one from the project wizard to auto-generate this document.</div>
      </div>
    );
  }

  const {
    architecture_overview: overview = '', components = [],
    api_endpoints: endpoints = [], db_design: dbDesign = [], sequence_flows: flows = []
  } = design;

  return (
    <div>
      <SlideTitle onMenu={onMenu}>Design Document – {project.project_key}</SlideTitle>

      <SectionSub>Architecture Overview</SectionSub>
      <div className="note" style={{ whiteSpace: 'pre-wrap' }}>{overview || 'None extracted'}</div>

      <SectionSub>Components</SectionSub>
      <table className="grid">
        <thead><tr><th>Name</th><th>Responsibility</th><th>Technology</th></tr></thead>
        <tbody>
          {components.map((c, i) => <tr key={i}><td>{c.name}</td><td>{c.responsibility || ''}</td><td>{c.technology || ''}</td></tr>)}
          {!components.length && <tr><td colSpan={3} className="note">None extracted</td></tr>}
        </tbody>
      </table>

      <SectionSub>API Endpoints</SectionSub>
      <table className="grid">
        <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
        <tbody>
          {endpoints.map((e, i) => <tr key={i}><td>{e.method}</td><td>{e.path}</td><td>{e.description || ''}</td></tr>)}
          {!endpoints.length && <tr><td colSpan={3} className="note">None extracted</td></tr>}
        </tbody>
      </table>

      <SectionSub>Database Design</SectionSub>
      <table className="grid">
        <thead><tr><th>Entity</th><th>Fields</th><th>Relationships</th></tr></thead>
        <tbody>
          {dbDesign.map((e, i) => <tr key={i}><td>{e.entity}</td><td>{e.fields || ''}</td><td>{e.relationships || ''}</td></tr>)}
          {!dbDesign.length && <tr><td colSpan={3} className="note">None extracted</td></tr>}
        </tbody>
      </table>

      <SectionSub>Sequence Flows</SectionSub>
      <table className="grid">
        <thead><tr><th>Name</th><th>Steps</th></tr></thead>
        <tbody>
          {flows.map((s, i) => <tr key={i}><td>{s.name}</td><td style={{ whiteSpace: 'pre-wrap' }}>{s.steps || ''}</td></tr>)}
          {!flows.length && <tr><td colSpan={2} className="note">None extracted</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
