import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

const DirtyContext = createContext(null);

export function DirtyProvider({ onSaved, onFailed, children }) {
  const dirty = useRef(new Set());
  const [count, setCount] = useState(0);

  const markDirty = useCallback((saveFn) => {
    dirty.current.add(saveFn);
    setCount(dirty.current.size);
  }, []);

  const saveAll = useCallback(async () => {
    const fns = [...dirty.current];
    dirty.current.clear();
    setCount(0);
    try {
      for (const fn of fns) await fn();
      onSaved?.();
    } catch (e) {
      onFailed?.(e);
    }
  }, [onSaved, onFailed]);

  return (
    <DirtyContext.Provider value={{ markDirty, saveAll, count }}>
      {children}
    </DirtyContext.Provider>
  );
}

export function useDirty() {
  const ctx = useContext(DirtyContext);
  if (!ctx) throw new Error('useDirty must be used inside DirtyProvider');
  return ctx;
}
