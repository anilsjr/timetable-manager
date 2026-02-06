import * as teacherService from '../services/teacherService.js';

export const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const result = await teacherService.listTeachers({ page, limit, search });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const teacher = await teacherService.getTeacherById(req.params.id);
    res.json({ success: true, data: teacher });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const teacher = await teacherService.createTeacher(req.body);
    res.status(201).json({ success: true, data: teacher });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const teacher = await teacherService.updateTeacher(req.params.id, req.body);
    res.json({ success: true, data: teacher });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await teacherService.deleteTeacher(req.params.id);
    res.json({ success: true, message: 'Teacher deleted' });
  } catch (error) {
    next(error);
  }
};
