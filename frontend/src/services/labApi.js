import api from './api';

export const getLabs = (params) =>
  api.get('/api/labs', { params }).then((r) => r.data);

export const getLabById = (id) =>
  api.get(`/api/labs/${id}`).then((r) => r.data);

export const createLab = (data) =>
  api.post('/api/labs', data).then((r) => r.data);

export const updateLab = (id, data) =>
  api.put(`/api/labs/${id}`, data).then((r) => r.data);

export const deleteLab = (id) =>
  api.delete(`/api/labs/${id}`).then((r) => r.data);
