import { body, param } from 'express-validator';

export const createTeacher = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('short_abbr').trim().notEmpty().withMessage('Short abbreviation is required'),
  body('code').optional().trim(),
  body('subjects').optional().isArray().withMessage('Subjects must be an array'),
  body('subjects.*').optional().isMongoId().withMessage('Invalid subject ID'),
  body('max_load_per_day').optional().isInt({ min: 1 }).withMessage('Max load must be positive'),
];

export const updateTeacher = [
  param('id').isMongoId().withMessage('Invalid teacher ID'),
  body('name').optional().trim().notEmpty().withMessage('Name required'),
  body('short_abbr').optional().trim().notEmpty().withMessage('Short abbreviation required'),
  body('code').optional().trim(),
  body('subjects').optional().isArray(),
  body('subjects.*').optional().isMongoId(),
  body('max_load_per_day').optional().isInt({ min: 1 }),
];

export const getById = [param('id').isMongoId().withMessage('Invalid teacher ID')];
export const getTeachersBySubject = [param('subjectId').isMongoId().withMessage('Invalid subject ID')];
export const deleteById = [param('id').isMongoId().withMessage('Invalid teacher ID')];
