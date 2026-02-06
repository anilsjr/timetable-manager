import api from './api';

export const getSubjects = (params) =>
  api.get('/api/subjects', { params }).then((r) => r.data);

export const getSubjectById = (id) =>
  api.get(`/api/subjects/${id}`).then((r) => r.data);

export const createSubject = (data) =>
  api.post('/api/subjects', data).then((r) => r.data);

export const updateSubject = (id, data) =>
  api.put(`/api/subjects/${id}`, data).then((r) => r.data);

export const deleteSubject = (id) =>
  api.delete(`/api/subjects/${id}`).then((r) => r.data);
