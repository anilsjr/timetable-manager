import * as labService from '../services/labService.js';

export const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const result = await labService.listLabs({ page, limit, search });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const lab = await labService.getLabById(req.params.id);
    res.json({ success: true, data: lab });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const lab = await labService.createLab(req.body);
    res.status(201).json({ success: true, data: lab });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const lab = await labService.updateLab(req.params.id, req.body);
    res.json({ success: true, data: lab });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await labService.deleteLab(req.params.id);
    res.json({ success: true, message: 'Lab deleted' });
  } catch (error) {
    next(error);
  }
};
