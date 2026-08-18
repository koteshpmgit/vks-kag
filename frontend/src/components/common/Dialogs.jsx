import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

const DialogContext = createContext(null);

let toastId = 0;

export function DialogProvider({ children }) {
  const [msgBoxState, setMsgBoxState] = useState(null); // { title, text, buttons, resolve }
  const [confirmState, setConfirmState] = useState(null); // { title, text, buttons, resolve }
  const [toasts, setToasts] = useState([]);

  const msgBox = useCallback((text, { title = 'Microsoft Excel', buttons = ['OK'] } = {}) =>
    new Promise((resolve) => setMsgBoxState({ title, text, buttons, resolve })), []);

  const confirmDialog = useCallback((text, { title = 'Confirm', buttons = ['OK', 'Cancel'] } = {}) =>
    new Promise((resolve) => setConfirmState({ title, text, buttons, resolve })), []);

  const toast = useCallback((message, isErr = false) => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, message, isErr }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const closeMsgBox = (btn) => {
    msgBoxState?.resolve(btn);
    setMsgBoxState(null);
  };
  const closeConfirm = (btn) => {
    confirmState?.resolve(btn);
    setConfirmState(null);
  };

  return (
    <DialogContext.Provider value={{ msgBox, confirmDialog, toast }}>
      {children}

      {msgBoxState && (
        <div className="msgbox-overlay">
          <div className="msgbox">
            <div className="mb-title">{msgBoxState.title}</div>
            <div className="mb-body">{msgBoxState.text}</div>
            <div className="mb-actions">
              {msgBoxState.buttons.map((b) => (
                <button key={b} autoFocus={b === msgBoxState.buttons[0]} onClick={() => closeMsgBox(b)}>{b}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {confirmState && (
        <div className="modal-overlay" onClick={() => closeConfirm(null)}>
          <div className="modal" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{confirmState.title}</h3>
              <button className="modal-close" onClick={() => closeConfirm(null)}>&times;</button>
            </div>
            <div className="modal-body" style={{ whiteSpace: 'pre-wrap' }}>{confirmState.text}</div>
            <div className="modal-foot">
              {confirmState.buttons.map((b, i) => (
                <button
                  key={b}
                  className={i === 0 ? 'btn btn-accent' : 'btn btn-light'}
                  onClick={() => closeConfirm(b)}
                >{b}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div id="toastRoot">
        {toasts.map((t) => (
          <div key={t.id} className={`toast${t.isErr ? ' err' : ''}`}>{t.message}</div>
        ))}
      </div>
    </DialogContext.Provider>
  );
}

export function useDialogs() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialogs must be used inside DialogProvider');
  return ctx;
}

export function Modal({ title, lg, onClose, children, footer }) {
  const ref = useRef(null);
  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === ref.current) onClose?.(); }}>
      <div ref={ref} className={`modal${lg ? ' modal-lg' : ''}`}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
