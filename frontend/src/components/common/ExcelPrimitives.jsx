import React from 'react';
import API from '../../api/client.js';
import { isoDate } from '../../api/client.js';
import { useDirty } from '../../layouts/Excel/DirtyContext.jsx';
import { useProjectData } from '../../context/ProjectDataContext.jsx';

// Excel-style "Data Sheet" building blocks - 1:1 port of the old datasheet.js
// helpers (inputCell/kvTable/collGrid/listSection), deferred-save via markDirty.

export function SectionTitle({ id, children }) {
  return <div className="section-title" id={id}>{children}</div>;
}
export function SubTitle({ children }) {
  return <div className="section-sub">{children}</div>;
}
export function Note({ children }) {
  return <div className="note">{children}</div>;
}

function EditCell({ value, onCommit, type = 'text' }) {
  const isMulti = type === 'multi';
  const common = {
    defaultValue: value ?? '',
    onBlur: (e) => { if (e.target.value !== (value ?? '')) onCommit(e.target.value); }
  };
  return (
    <td>
      {isMulti
        ? <textarea rows={Math.min(6, Math.max(1, String(value || '').split('\n').length))} {...common} />
        : <input type={type} {...common} />}
    </td>
  );
}

// key/value editable table for a single object (application / project)
export function KvTable({ obj, fields, onFieldChange, saver }) {
  const { markDirty } = useDirty();
  return (
    <table className="grid">
      <tbody>
        {fields.map(([key, label, type]) => (
          <tr key={key}>
            <th style={{ width: 220 }}>{label}</th>
            <EditCell
              value={obj[key]}
              type={type || 'text'}
              onCommit={(v) => { onFieldChange(key, v); markDirty(saver); }}
            />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// editable collection grid with add/delete rows
export function CollGrid({ coll, rows, cols, defaults = {} }) {
  const { markDirty } = useDirty();
  const { projectId, reload } = useProjectData();

  const delRow = async (row) => {
    await API.del(`/projects/${projectId}/${coll}/${row.id}`);
    reload();
  };
  const addRow = async () => {
    await API.post(`/projects/${projectId}/${coll}`, { sno: rows.length + 1, ...defaults });
    reload();
  };

  return (
    <>
      <table className="grid">
        <thead>
          <tr>
            <th></th>
            {cols.map((c) => <th key={c.key}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="rowhead">
                <button className="del-btn" title="Delete row" onClick={() => delRow(row)}>&times;</button>
              </td>
              {cols.map((c) => {
                if (c.readonly) {
                  return <td key={c.key} className="calc">{c.fmt ? c.fmt(row[c.key], row) : row[c.key]}</td>;
                }
                const val = c.type === 'date' ? isoDate(row[c.key]) : row[c.key];
                return (
                  <EditCell
                    key={c.key}
                    value={val}
                    type={c.type === 'multi' ? 'multi' : (c.type || 'text')}
                    onCommit={(v) => {
                      row[c.key] = v;
                      markDirty(() => API.put(`/projects/${projectId}/${coll}/${row.id}`, row));
                    }}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <button className="addrow-btn" onClick={addRow}>+ Add row</button>
    </>
  );
}

// constraint/dependency/assumption/risk lists (kind-discriminated)
export function ListSection({ kind, rows, colLabel, onAdd }) {
  const { markDirty } = useDirty();
  const { projectId, reload } = useProjectData();
  const delRow = async (row) => { await API.del(`/projects/${projectId}/lists/${row.id}`); reload(); };
  return (
    <>
      <table className="grid">
        <thead><tr><th></th><th>S.No</th><th>{colLabel}</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="rowhead">
                <button className="del-btn" onClick={() => delRow(row)}>&times;</button>
              </td>
              <td>{row.sno}</td>
              <EditCell
                value={row.description}
                onCommit={(v) => {
                  row.description = v;
                  markDirty(() => API.put(`/projects/${projectId}/lists/${row.id}`, row));
                }}
              />
            </tr>
          ))}
        </tbody>
      </table>
      <button className="addrow-btn" onClick={onAdd}>+ Add {kind}</button>
    </>
  );
}
