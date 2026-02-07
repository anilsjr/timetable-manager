import api from './api';

export const getSchedules = (params) =>
  api.get('/api/schedules', { params }).then((r) => r.data);

export const getSchedulesByClass = (classId) =>
  api.get(`/api/schedules/class/${classId}`).then((r) => r.data?.data ?? []);

export const getScheduleById = (id) =>
  api.get(`/api/schedules/${id}`).then((r) => r.data);

export const createSchedule = (data) => {
  const payload = {
    classId: data.classId,
    subjectId: data.subjectId,
    teacherId: data.teacherId,
    day: data.day,
    startTime: data.startTime,
    endTime: data.endTime,
    type: data.type,
  };
  if (data.room != null) payload.room = data.room;
  if (data.roomModel != null) payload.roomModel = data.roomModel;
  return api.post('/api/schedules', payload).then((r) => r.data);
};

export const updateSchedule = (id, data) => {
  const payload = {
    classId: data.classId,
    subjectId: data.subjectId,
    teacherId: data.teacherId,
    day: data.day,
    startTime: data.startTime,
    endTime: data.endTime,
    type: data.type,
  };
  if (data.room != null) payload.room = data.room;
  if (data.roomModel != null) payload.roomModel = data.roomModel;
  return api.put(`/api/schedules/${id}`, payload).then((r) => r.data);
};

export const deleteSchedule = (id) =>
  api.delete(`/api/schedules/${id}`).then((r) => r.data);
