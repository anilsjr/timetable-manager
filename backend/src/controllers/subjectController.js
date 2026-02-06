import * as subjectService from '../services/subjectService.js';

export const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const result = await subjectService.listSubjects({ page, limit, search });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const subject = await subjectService.getSubjectById(req.params.id);
    res.json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const subject = await subjectService.createSubject(req.body);
    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const subject = await subjectService.updateSubject(req.params.id, req.body);
    res.json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await subjectService.deleteSubject(req.params.id);
    res.json({ success: true, message: 'Subject deleted' });
  } catch (error) {
    next(error);
  }
};
