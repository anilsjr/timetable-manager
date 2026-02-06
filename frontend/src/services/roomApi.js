import api from './api';

export const getRooms = (params) =>
  api.get('/api/rooms', { params }).then((r) => r.data);

export const getRoomById = (id) =>
  api.get(`/api/rooms/${id}`).then((r) => r.data);

export const createRoom = (data) =>
  api.post('/api/rooms', data).then((r) => r.data);

export const updateRoom = (id, data) =>
  api.put(`/api/rooms/${id}`, data).then((r) => r.data);

export const deleteRoom = (id) =>
  api.delete(`/api/rooms/${id}`).then((r) => r.data);
