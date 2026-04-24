import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, TOKEN_KEY } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async (token) => {
    if (!token) {
      setUser(null);
      return;
    }
    const res = await api.get('/auth/me');
    setUser(res.data.data);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const t = localStorage.getItem(TOKEN_KEY);
      if (!t) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      try {
        await loadMe(t);
      } catch {
        if (active) {
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadMe]);

  const login = useCallback(
    async (email, password) => {
      const res = await api.post('/auth/login', { email, password });
      const { user: u, token } = res.data.data;
      localStorage.setItem(TOKEN_KEY, token);
      setUser(u);
      return u;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // token ya inválido o red caída
    }
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      loading,
      login,
      logout,
      isAdmin: user?.role === 'admin',
      isOperador: user?.role === 'operador',
      isPublico: user?.role === 'publico',
      canRunOps: user?.role === 'admin' || user?.role === 'operador',
    }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
