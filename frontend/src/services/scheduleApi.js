import api from './api';

export const getSchedules = (params) =>
  api.get('/api/schedules', { params }).then((r) => r.data);

export const getScheduleById = (id) =>
  api.get(`/api/schedules/${id}`).then((r) => r.data);

export const createSchedule = (data) =>
  api.post('/api/schedules', data).then((r) => r.data);

export const updateSchedule = (id, data) =>
  api.put(`/api/schedules/${id}`, data).then((r) => r.data);

export const deleteSchedule = (id) =>
  api.delete(`/api/schedules/${id}`).then((r) => r.data);
