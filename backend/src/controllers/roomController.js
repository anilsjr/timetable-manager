import * as roomService from '../services/roomService.js';

export const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const result = await roomService.listRooms({ page, limit, search });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const room = await roomService.getRoomById(req.params.id);
    res.json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const room = await roomService.createRoom(req.body);
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const room = await roomService.updateRoom(req.params.id, req.body);
    res.json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await roomService.deleteRoom(req.params.id);
    res.json({ success: true, message: 'Room deleted' });
  } catch (error) {
    next(error);
  }
};
