import React, { useState } from 'react';
import { isoDate } from '../../api/client.js';
import { useDialogs } from './Dialogs.jsx';

// Generic key/value form for a single object (Application Details, Project Summary).
export default function ObjectForm({ obj, fields, onSave, validate }) {
  const [draft, setDraft] = useState(() => ({ ...obj }));
  const [errors, setErrors] = useState([]);
  const { toast } = useDialogs();

  const setField = (key, v) => setDraft((d) => ({ ...d, [key]: v }));

  const submit = async () => {
    const errs = validate ? validate(draft) : [];
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    try {
      await onSave(draft);
      toast('Saved');
    } catch (e) {
      toast('Save failed: ' + e.message, true);
    }
  };

  return (
    <div>
      {errors.length > 0 && (
        <div className="form-errors">{errors.map((e) => <div key={e}>{e}</div>)}</div>
      )}
      <div className="form-grid">
        {fields.map(([key, label, type, opts]) => (
          <label key={key} className={type === 'multi' ? 'full editable-field' : 'editable-field'}>
            <span>{label}{opts?.hint && <em className="field-hint-inline"> ({opts.hint})</em>}</span>
            {type === 'multi'
              ? <textarea rows={3} value={draft[key] ?? ''} onChange={(e) => setField(key, e.target.value)} />
              : <input
                  type={type === 'date' ? 'date' : (type === 'number' ? 'number' : 'text')}
                  value={type === 'date' ? isoDate(draft[key]) : (draft[key] ?? '')}
                  min={opts?.min}
                  onChange={(e) => setField(key, e.target.value)}
                />}
          </label>
        ))}
      </div>
      <div className="form-actions">
        <button className="btn btn-accent" onClick={submit}>Save</button>
      </div>
    </div>
  );
}
