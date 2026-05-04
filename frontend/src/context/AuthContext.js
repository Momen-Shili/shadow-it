import React, { createContext, useContext, useState } from 'react';
import {
  login as loginService,
  logout as logoutService,
  getCurrentUser,
} from '../services/authService';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(getCurrentUser);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function login(email, password) {
    setLoading(true);
    setError(null);
    try {
      const data = await loginService(email, password);
      setUser(data.user);

      // Determine whether onboarding is needed
      let needsOnboarding = false;
      try {
        const { data: keysData } = await api.get('/keys');
        const k = keysData.data;
        needsOnboarding = !k.has_github && !k.has_trello && !k.has_slack;
      } catch {
        // If the keys check fails (e.g. network), don't block login
        needsOnboarding = false;
      }

      return { ...data, needsOnboarding };
    } catch (err) {
      const message = err.response?.data?.error || 'Échec de la connexion. Veuillez réessayer.';
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
