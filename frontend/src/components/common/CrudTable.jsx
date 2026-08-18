import React, { useState } from 'react';
import API, { isoDate } from '../../api/client.js';
import { Modal } from './Dialogs.jsx';
import { useDialogs } from './Dialogs.jsx';

// Generic modal-driven CRUD table for a REST collection - used by Modern & WebApp
// layouts for every project sub-collection / global collection (hardware, software,
// hrplan, resources, standards, ...). basePath is the REST path without trailing /id.
export default function CrudTable({ basePath, rows, columns, onChanged, addLabel = '+ Add row', readOnly = false, extraDefaults = {} }) {
  const [editing, setEditing] = useState(null); // row object being added/edited, or null
  const { confirmDialog, toast } = useDialogs();

  const openAdd = () => setEditing({ ...extraDefaults, sno: rows.length + 1 });
  const openEdit = (row) => setEditing({ ...row });

  const save = async () => {
    try {
      if (editing.id) {
        await API.put(`${basePath}/${editing.id}`, editing);
      } else {
        await API.post(basePath, editing);
      }
      setEditing(null);
      onChanged?.();
      toast('Saved');
    } catch (e) {
      toast('Save failed: ' + e.message, true);
    }
  };

  const del = async (row) => {
    const ans = await confirmDialog('Delete this row? This cannot be undone.', { title: 'Confirm delete', buttons: ['Delete', 'Cancel'] });
    if (ans !== 'Delete') return;
    await API.del(`${basePath}/${row.id}`);
    onChanged?.();
    toast('Deleted');
  };

  return (
    <div>
      {!readOnly && (
        <div className="section-toolbar">
          <button className="act-btn add" title="Add row" aria-label="Add row" onClick={openAdd}>+</button>
        </div>
      )}
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              {columns.map((c) => <th key={c.key}>{c.label}</th>)}
              {!readOnly && <th></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => (
                  <td key={c.key} className={c.type === 'number' ? 'num' : undefined}>
                    {c.type === 'date' ? isoDate(row[c.key]) : (c.fmt ? c.fmt(row[c.key], row) : row[c.key])}
                  </td>
                ))}
                {!readOnly && (
                  <td className="row-actions">
                    <button className="act-btn" title="Edit" aria-label="Edit" onClick={() => openEdit(row)}>&#9998;</button>
                    <button className="act-btn danger" title="Delete" aria-label="Delete" onClick={() => del(row)}>&#128465;</button>
                  </td>
                )}
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={columns.length + 1} style={{ textAlign: 'center', color: 'var(--muted)' }}>No rows yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal
          title={editing.id ? 'Edit row' : 'Add row'}
          onClose={() => setEditing(null)}
          footer={<>
            <button className="btn btn-light" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-accent" onClick={save}>Save</button>
          </>}
        >
          <div className="form-grid">
            {columns.filter((c) => !c.readonly).map((c) => (
              <label key={c.key} className={c.full ? 'full editable-field' : 'editable-field'}>
                <span>{c.label}</span>
                {c.type === 'multi'
                  ? <textarea rows={3} defaultValue={editing[c.key] ?? ''} onBlur={(e) => { editing[c.key] = e.target.value; }} />
                  : <input
                      type={c.type === 'date' ? 'date' : (c.type === 'number' ? 'number' : 'text')}
                      defaultValue={c.type === 'date' ? isoDate(editing[c.key]) : (editing[c.key] ?? '')}
                      onBlur={(e) => { editing[c.key] = e.target.value; }}
                    />}
              </label>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
