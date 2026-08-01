import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { getDashboardPath } from '../lib/utils';

// =============================================================================
// VLRK - Auth Context
// =============================================================================
// Provides authentication state and methods throughout the app
// =============================================================================

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('vlrk_token');
    const savedUser = localStorage.getItem('vlrk_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data.data;

    localStorage.setItem('vlrk_token', newToken);
    localStorage.setItem('vlrk_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);

    return newUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('vlrk_token');
    localStorage.removeItem('vlrk_user');
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'ADMIN';
  const isSiswa = user?.role === 'SISWA';
  const isPendamping = user?.role === 'PENDAMPING';
  const dashboardPath = user ? getDashboardPath(user.role) : '/login';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      isAuthenticated,
      isAdmin,
      isSiswa,
      isPendamping,
      dashboardPath,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
