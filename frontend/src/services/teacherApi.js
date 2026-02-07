import api from './api';

export const getTeachers = (params) =>
  api.get('/api/teachers', { params }).then((r) => r.data);

export const getTeacherById = (id) =>
  api.get(`/api/teachers/${id}`).then((r) => r.data);

export const getTeachersBySubject = (subjectId, params = {}) => {
  const query = {};
  if (params.day) query.day = params.day;
  if (params.startTime) query.startTime = params.startTime;
  if (params.excludeScheduleId) query.excludeScheduleId = params.excludeScheduleId;
  return api
    .get(`/api/teachers/by-subject/${subjectId}`, { params: query })
    .then((r) => r.data?.data ?? []);
};

export const createTeacher = (data) =>
  api.post('/api/teachers', data).then((r) => r.data);

export const updateTeacher = (id, data) =>
  api.put(`/api/teachers/${id}`, data).then((r) => r.data);

export const deleteTeacher = (id) =>
  api.delete(`/api/teachers/${id}`).then((r) => r.data);
