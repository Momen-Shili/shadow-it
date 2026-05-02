import React, { createContext, useContext, useState } from 'react';
import {
  login as loginService,
  logout as logoutService,
  getCurrentUser,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getCurrentUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function login(email, password) {
    setLoading(true);
    setError(null);
    try {
      const data = await loginService(email, password);
      setUser(data.user);
      return data;
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed. Please try again.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await logoutService();
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be called inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
