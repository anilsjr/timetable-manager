import { body, param } from 'express-validator';

export const createLab = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('short_name').trim().notEmpty().withMessage('Short name is required'),
  body('code').trim().notEmpty().withMessage('Code is required'),
  body('room_number').optional().trim(),
  body('capacity').optional().isInt({ min: 0 }).withMessage('Capacity must be non-negative'),
];

export const updateLab = [
  param('id').isMongoId().withMessage('Invalid lab ID'),
  body('name').optional().trim().notEmpty(),
  body('short_name').optional().trim().notEmpty(),
  body('code').optional().trim().notEmpty(),
  body('room_number').optional().trim(),
  body('capacity').optional().isInt({ min: 0 }),
];

export const getById = [param('id').isMongoId().withMessage('Invalid lab ID')];
export const deleteById = [param('id').isMongoId().withMessage('Invalid lab ID')];
