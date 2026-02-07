import api from './api';

export const getClasses = (params) =>
  api.get('/api/classes', { params }).then((r) => r.data);

export const getClassById = (id) =>
  api.get(`/api/classes/${id}`).then((r) => r.data);

export const getClassSubjects = (classId) =>
  api.get(`/api/classes/${classId}/subjects`).then((r) => r.data?.data ?? []);

export const getClassLabs = (classId) =>
  api.get(`/api/classes/${classId}/labs`).then((r) => r.data?.data ?? []);

export const createClass = (data) =>
  api.post('/api/classes', data).then((r) => r.data);

export const updateClass = (id, data) =>
  api.put(`/api/classes/${id}`, data).then((r) => r.data);

export const deleteClass = (id) =>
  api.delete(`/api/classes/${id}`).then((r) => r.data);
