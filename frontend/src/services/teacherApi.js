import api from './api';

export const getTeachers = (params) =>
  api.get('/api/teachers', { params }).then((r) => r.data);

export const getTeacherById = (id) =>
  api.get(`/api/teachers/${id}`).then((r) => r.data);

export const createTeacher = (data) =>
  api.post('/api/teachers', data).then((r) => r.data);

export const updateTeacher = (id, data) =>
  api.put(`/api/teachers/${id}`, data).then((r) => r.data);

export const deleteTeacher = (id) =>
  api.delete(`/api/teachers/${id}`).then((r) => r.data);
