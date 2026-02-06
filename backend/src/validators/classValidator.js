import { body, param } from 'express-validator';

const SECTION_ENUM = ['F', 'S', 'T', 'L'];

export const createClass = [
  body('class_name').trim().notEmpty().withMessage('Class name is required'),
  body('year').isInt({ min: 1 }).withMessage('Year must be a positive integer'),
  body('section')
    .isIn(SECTION_ENUM)
    .withMessage('Section must be F, S, T, or L'),
  body('student_count').optional().isInt({ min: 0 }).withMessage('Student count must be non-negative'),
];

export const updateClass = [
  param('id').isMongoId().withMessage('Invalid class ID'),
  body('class_name').optional().trim().notEmpty(),
  body('year').optional().isInt({ min: 1 }),
  body('section').optional().isIn(SECTION_ENUM),
  body('student_count').optional().isInt({ min: 0 }),
];

export const getById = [param('id').isMongoId().withMessage('Invalid class ID')];
export const deleteById = [param('id').isMongoId().withMessage('Invalid class ID')];
