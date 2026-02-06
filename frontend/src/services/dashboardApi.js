import api from './api';

export const getDashboardStats = () =>
  api.get('/api/dashboard/stats').then((r) => r.data);
