import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('phr_access_token')) return setLoading(false);
    api.get('/auth/me').then(({ data }) => setUser(data.user)).catch(() => localStorage.removeItem('phr_access_token')).finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('phr_access_token', data.accessToken);
    setUser(data.user);
    return data.user;
  };
  const register = async (values) => {
    const { data } = await api.post('/auth/register', values);
    localStorage.setItem('phr_access_token', data.accessToken);
    setUser(data.user);
    return data.user;
  };
  const logout = async () => {
    try { await api.post('/auth/logout'); } finally { localStorage.removeItem('phr_access_token'); setUser(null); }
  };

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
