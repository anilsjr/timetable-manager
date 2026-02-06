import * as classService from '../services/classService.js';

export const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const result = await classService.listClasses({ page, limit, search });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const cls = await classService.getClassById(req.params.id);
    res.json({ success: true, data: cls });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const cls = await classService.createClass(req.body);
    res.status(201).json({ success: true, data: cls });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const cls = await classService.updateClass(req.params.id, req.body);
    res.json({ success: true, data: cls });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await classService.deleteClass(req.params.id);
    res.json({ success: true, message: 'Class deleted' });
  } catch (error) {
    next(error);
  }
};
