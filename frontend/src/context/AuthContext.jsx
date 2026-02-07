import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import logger from '../utils/logger.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      logger.debug('Auth: checking token with /api/auth/me');
      api
        .get('/api/auth/me')
        .then(({ data }) => {
          setUser(data.user);
          logger.info('Auth: restored session', data.user?.email);
        })
        .catch((err) => {
          logger.warn('Auth: token invalid or expired', err.response?.status);
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    logger.info('Auth: login attempt', { email });
    const { data } = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    logger.info('Auth: login success', { email: data.user?.email });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
