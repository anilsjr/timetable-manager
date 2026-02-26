import { body, param } from 'express-validator';

export const createRoom = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('code').trim().notEmpty().withMessage('Code is required'),
  body('type').isIn(['class', 'lab']).withMessage('Type must be either class or lab'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
];

export const updateRoom = [
  param('id').isMongoId().withMessage('Invalid room ID'),
  body('name').optional().trim().notEmpty(),
  body('code').optional().trim().notEmpty(),
  body('type').optional().isIn(['class', 'lab']).withMessage('Type must be either class or lab'),
  body('capacity').optional().isInt({ min: 1 }),
];

export const getById = [param('id').isMongoId().withMessage('Invalid room ID')];
export const deleteById = [param('id').isMongoId().withMessage('Invalid room ID')];
