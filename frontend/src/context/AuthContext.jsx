import React, { createContext, useCallback, useContext, useState } from 'react';
import API from '../api/client.js';

const AuthContext = createContext(null);

async function authRequest(path, body) {
  const r = await fetch(`/api/auth${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `Request failed: ${r.status}`);
  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('kag_user');
    return raw ? JSON.parse(raw) : null;
  });

  const setSession = (data) => {
    API.setToken(data.token);
    localStorage.setItem('kag_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = useCallback(async (email, password) => {
    setSession(await authRequest('/login', { email, password }));
  }, []);

  const signup = useCallback(async (email, password, name) => {
    setSession(await authRequest('/signup', { email, password, name }));
  }, []);

  const logout = useCallback(() => {
    API.setToken(null);
    localStorage.removeItem('kag_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
