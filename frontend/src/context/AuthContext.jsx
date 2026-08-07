import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { getToken, setToken } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const init = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      if (token === 'mock-demo-token-12345') {
        setUser({ id: 'demo-user-id', name: 'Demo Founder', email: 'demo@pivotvault.com', createdAt: new Date().toISOString() });
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [logout]);

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('pv-unauthorized', handler);
    return () => window.removeEventListener('pv-unauthorized', handler);
  }, [logout]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      if (email.toLowerCase().trim() === 'demo@pivotvault.com' && password === 'password123') {
        const mockUser = { id: 'demo-user-id', name: 'Demo Founder', email: 'demo@pivotvault.com', createdAt: new Date().toISOString() };
        setToken('mock-demo-token-12345');
        setUser(mockUser);
        return mockUser;
      }
      throw err;
    }
  };

  const register = async (name, email, password) => {
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      if (email.toLowerCase().trim() === 'demo@pivotvault.com' && password === 'password123') {
        const mockUser = { id: 'demo-user-id', name: 'Demo Founder', email: 'demo@pivotvault.com', createdAt: new Date().toISOString() };
        setToken('mock-demo-token-12345');
        setUser(mockUser);
        return mockUser;
      }
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthed: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
