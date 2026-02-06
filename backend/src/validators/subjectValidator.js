import { body, param } from 'express-validator';

const subjectBody = [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('short_name').trim().notEmpty().withMessage('Short name is required'),
  body('code').trim().notEmpty().withMessage('Code is required'),
  body('weekly_frequency')
    .isInt({ min: 1 })
    .withMessage('Weekly frequency must be a positive integer'),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
];

export const createSubject = subjectBody;

export const updateSubject = [
  param('id').isMongoId().withMessage('Invalid subject ID'),
  body('full_name').optional().trim().notEmpty().withMessage('Full name required'),
  body('short_name').optional().trim().notEmpty().withMessage('Short name required'),
  body('code').optional().trim().notEmpty().withMessage('Code required'),
  body('weekly_frequency')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Weekly frequency must be a positive integer'),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
];

export const getById = [param('id').isMongoId().withMessage('Invalid subject ID')];
export const deleteById = [param('id').isMongoId().withMessage('Invalid subject ID')];
