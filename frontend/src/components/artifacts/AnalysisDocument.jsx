import React from 'react';
import { SlideTitle, SectionSub } from './helpers.jsx';

export default function AnalysisDocument({ data, onMenu }) {
  const { project, analysis } = data;

  if (!analysis) {
    return (
      <div>
        <SlideTitle onMenu={onMenu}>Analysis Document – {project.project_key}</SlideTitle>
        <div className="note">No SRS (requirements) document has been uploaded for this project yet. Upload one from the project wizard to auto-generate this document.</div>
      </div>
    );
  }

  const {
    business_requirements: brs = [], functional_requirements: frs = [],
    non_functional_requirements: nfrs = [], use_cases: useCases = [], data_entities: entities = []
  } = analysis;

  return (
    <div>
      <SlideTitle onMenu={onMenu}>Analysis Document – {project.project_key}</SlideTitle>

      <SectionSub>Business Requirements</SectionSub>
      <table className="grid">
        <thead><tr><th>S.No</th><th>Description</th><th>Priority</th></tr></thead>
        <tbody>
          {brs.map((r, i) => <tr key={i}><td>{i + 1}</td><td>{r.description}</td><td>{r.priority || ''}</td></tr>)}
          {!brs.length && <tr><td colSpan={3} className="note">None extracted</td></tr>}
        </tbody>
      </table>

      <SectionSub>Functional Requirements</SectionSub>
      <table className="grid">
        <thead><tr><th>Req ID</th><th>Description</th><th>Priority</th></tr></thead>
        <tbody>
          {frs.map((r, i) => <tr key={i}><td>{r.req_id || ''}</td><td>{r.description}</td><td>{r.priority || ''}</td></tr>)}
          {!frs.length && <tr><td colSpan={3} className="note">None extracted</td></tr>}
        </tbody>
      </table>

      <SectionSub>Non-Functional Requirements</SectionSub>
      <table className="grid">
        <thead><tr><th>Category</th><th>Requirement</th></tr></thead>
        <tbody>
          {nfrs.map((r, i) => <tr key={i}><td>{r.category}</td><td>{r.requirement}</td></tr>)}
          {!nfrs.length && <tr><td colSpan={2} className="note">None extracted</td></tr>}
        </tbody>
      </table>

      <SectionSub>Use Cases</SectionSub>
      <table className="grid">
        <thead><tr><th>Name</th><th>Actor</th><th>Description</th><th>Preconditions</th><th>Postconditions</th></tr></thead>
        <tbody>
          {useCases.map((u, i) => (
            <tr key={i}><td>{u.name}</td><td>{u.actor || ''}</td><td>{u.description || ''}</td><td>{u.preconditions || ''}</td><td>{u.postconditions || ''}</td></tr>
          ))}
          {!useCases.length && <tr><td colSpan={5} className="note">None extracted</td></tr>}
        </tbody>
      </table>

      <SectionSub>Data Entities</SectionSub>
      <table className="grid">
        <thead><tr><th>Name</th><th>Attributes</th><th>Description</th></tr></thead>
        <tbody>
          {entities.map((e, i) => <tr key={i}><td>{e.name}</td><td>{e.attributes || ''}</td><td>{e.description || ''}</td></tr>)}
          {!entities.length && <tr><td colSpan={3} className="note">None extracted</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
