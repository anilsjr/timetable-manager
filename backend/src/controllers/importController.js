import * as importService from '../services/importService.js';
import logger from '../utils/logger.js';

/**
 * POST /api/import/subjects
 * Body: multipart file (field: file) – CSV, Excel, or JSON
 */
export const importSubjects = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, error: 'No file uploaded. Use field name: file' });
    }
    const { rows } = importService.parseFile(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );
    if (!rows.length) {
      return res.status(400).json({ success: false, error: 'File contains no data rows' });
    }
    const { created, errors } = await importService.importSubjects(rows);
    res.status(201).json({
      success: true,
      created: created.length,
      errors: errors.length,
      total: rows.length,
      details: errors.length ? { errors } : undefined,
    });
  } catch (err) {
    logger.warn('Import subjects failed', { message: err.message });
    next(err);
  }
};

/**
 * POST /api/import/teachers
 * Body: multipart file (field: file) – CSV, Excel, or JSON
 */
export const importTeachers = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, error: 'No file uploaded. Use field name: file' });
    }
    const { rows } = importService.parseFile(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );
    if (!rows.length) {
      return res.status(400).json({ success: false, error: 'File contains no data rows' });
    }
    const { created, errors } = await importService.importTeachers(rows);
    res.status(201).json({
      success: true,
      created: created.length,
      errors: errors.length,
      total: rows.length,
      details: errors.length ? { errors } : undefined,
    });
  } catch (err) {
    logger.warn('Import teachers failed', { message: err.message });
    next(err);
  }
};

/**
 * POST /api/import/labs
 * Body: multipart file (field: file) – CSV, Excel, or JSON
 */
export const importLabs = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, error: 'No file uploaded. Use field name: file' });
    }
    const { rows } = importService.parseFile(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );
    if (!rows.length) {
      return res.status(400).json({ success: false, error: 'File contains no data rows' });
    }
    const { created, errors } = await importService.importLabs(rows);
    res.status(201).json({
      success: true,
      created: created.length,
      errors: errors.length,
      total: rows.length,
      details: errors.length ? { errors } : undefined,
    });
  } catch (err) {
    logger.warn('Import labs failed', { message: err.message });
    next(err);
  }
};

/**
 * POST /api/import/classes
 * Body: multipart file (field: file) – CSV, Excel, or JSON
 */
export const importClasses = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, error: 'No file uploaded. Use field name: file' });
    }
    const { rows } = importService.parseFile(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );
    if (!rows.length) {
      return res.status(400).json({ success: false, error: 'File contains no data rows' });
    }
    const { created, errors } = await importService.importClasses(rows);
    res.status(201).json({
      success: true,
      created: created.length,
      errors: errors.length,
      total: rows.length,
      details: errors.length ? { errors } : undefined,
    });
  } catch (err) {
    logger.warn('Import classes failed', { message: err.message });
    next(err);
  }
};
