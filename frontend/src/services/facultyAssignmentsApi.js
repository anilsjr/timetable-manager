import api from './api';

export const getFacultyAssignmentsByClass = (classId) =>
  api.get(`/api/faculty-assignments/class/${classId}`).then((r) => r.data?.data ?? []);
