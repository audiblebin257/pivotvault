import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { getToken, setToken } from '../lib/api';
import { auth, googleProvider } from '../lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    try {
      await fbSignOut(auth);
    } catch {
      // Ignore firebase signout errors if not signed in via Firebase
    }
  }, []);

  useEffect(() => {
    // Listen to Firebase auth state change
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser({
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email.split('@')[0],
          email: fbUser.email,
          photoURL: fbUser.photoURL,
          provider: 'firebase'
        });
        setLoading(false);
      }
    });

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

    return () => unsubscribe();
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
      // Try Firebase Auth if backend login fails or is down
      try {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCred.user;
        const mappedUser = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email.split('@')[0],
          email: fbUser.email,
          provider: 'firebase'
        };
        setUser(mappedUser);
        return mappedUser;
      } catch {
        if (email.toLowerCase().trim() === 'demo@pivotvault.com' && password === 'password123') {
          const mockUser = { id: 'demo-user-id', name: 'Demo Founder', email: 'demo@pivotvault.com', createdAt: new Date().toISOString() };
          setToken('mock-demo-token-12345');
          setUser(mockUser);
          return mockUser;
        }
        throw err;
      }
    }
  };

  const register = async (name, email, password) => {
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCred.user;
        const mappedUser = {
          id: fbUser.uid,
          name: name || fbUser.email.split('@')[0],
          email: fbUser.email,
          provider: 'firebase'
        };
        setUser(mappedUser);
        return mappedUser;
      } catch {
        if (email.toLowerCase().trim() === 'demo@pivotvault.com' && password === 'password123') {
          const mockUser = { id: 'demo-user-id', name: 'Demo Founder', email: 'demo@pivotvault.com', createdAt: new Date().toISOString() };
          setToken('mock-demo-token-12345');
          setUser(mockUser);
          return mockUser;
        }
        throw err;
      }
    }
  };

  const loginWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    const fbUser = res.user;
    const mappedUser = {
      id: fbUser.uid,
      name: fbUser.displayName,
      email: fbUser.email,
      photoURL: fbUser.photoURL,
      provider: 'google-firebase'
    };
    setUser(mappedUser);
    return mappedUser;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, isAuthed: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

