import axios from 'axios';
import logger from '../utils/logger.js';

// Default to backend on port 5000 when VITE_API_URL is not set (e.g. missing .env)
const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : '');

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    logger.debug('API request', config.method?.toUpperCase(), config.url, config.data ?? '');
    return config;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (res) => {
    logger.debug('API response', res.config.url, res.status);
    return res;
  },
  (err) => {
    logger.warn('API error', err.config?.url, err.response?.status, err.response?.data ?? err.message);
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
