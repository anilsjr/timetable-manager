import * as scheduleService from '../services/scheduleService.js';

export const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', class: classId, teacher: teacherId } = req.query;
    const result = await scheduleService.listSchedules({
      page,
      limit,
      search,
      classId,
      teacherId,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const schedule = await scheduleService.getScheduleById(req.params.id);
    res.json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const schedule = await scheduleService.createSchedule(req.body);
    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    if (error.conflict) {
      return res.status(409).json({
        success: false,
        error: error.message,
        conflict: error.conflict,
      });
    }
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const schedule = await scheduleService.updateSchedule(req.params.id, req.body);
    res.json({ success: true, data: schedule });
  } catch (error) {
    if (error.conflict) {
      return res.status(409).json({
        success: false,
        error: error.message,
        conflict: error.conflict,
      });
    }
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await scheduleService.deleteSchedule(req.params.id);
    res.json({ success: true, message: 'Schedule deleted' });
  } catch (error) {
    next(error);
  }
};
