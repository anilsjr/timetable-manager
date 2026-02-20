import { body, param } from 'express-validator';

const SECTION_ENUM = ['1', '2', '3', '4'];

export const createClass = [
  body('class_name').trim().notEmpty().withMessage('Class name is required'),
  body('year').isInt({ min: 1 }).withMessage('Year must be a positive integer'),
  body('section')
    .isIn(SECTION_ENUM)
    .withMessage('Section must be 1, 2, 3, or 4'),
  body('student_count').optional().isInt({ min: 0 }).withMessage('Student count must be non-negative'),
  body('subjects').optional().isArray().withMessage('Subjects must be an array'),
  body('subjects.*').optional().isMongoId().withMessage('Invalid subject ID'),
  body('labs').optional().isArray().withMessage('Labs must be an array'),
  body('labs.*').optional().isMongoId().withMessage('Invalid lab ID'),
];

export const updateClass = [
  param('id').isMongoId().withMessage('Invalid class ID'),
  body('class_name').optional().trim().notEmpty(),
  body('year').optional().isInt({ min: 1 }),
  body('section').optional().isIn(SECTION_ENUM),
  body('student_count').optional().isInt({ min: 0 }),
  body('subjects').optional().isArray(),
  body('subjects.*').optional().isMongoId(),
  body('labs').optional().isArray(),
  body('labs.*').optional().isMongoId(),
];

export const getById = [param('id').isMongoId().withMessage('Invalid class ID')];
export const getClassSubjects = [param('classId').isMongoId().withMessage('Invalid class ID')];
export const getClassLabs = [param('classId').isMongoId().withMessage('Invalid class ID')];
export const deleteById = [param('id').isMongoId().withMessage('Invalid class ID')];
