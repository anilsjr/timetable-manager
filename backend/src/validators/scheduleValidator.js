import { body, param } from 'express-validator';

const DAY_ENUM = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const TYPE_ENUM = ['LECTURE', 'LAB'];
const ROOM_MODEL = ['Room', 'Lab'];

export const createSchedule = [
  body('class').isMongoId().withMessage('Valid class required'),
  body('subject').isMongoId().withMessage('Valid subject required'),
  body('teacher').isMongoId().withMessage('Valid teacher required'),
  body('room').isMongoId().withMessage('Valid room required'),
  body('roomModel').isIn(ROOM_MODEL).withMessage('roomModel must be Room or Lab'),
  body('type').isIn(TYPE_ENUM).withMessage('type must be LECTURE or LAB'),
  body('day_of_week').isIn(DAY_ENUM).withMessage('Valid day required'),
  body('start_time').isISO8601().withMessage('Valid start_time required'),
  body('end_time').isISO8601().withMessage('Valid end_time required'),
  body('semester_start').isISO8601().withMessage('Valid semester_start required'),
  body('semester_end').isISO8601().withMessage('Valid semester_end required'),
];

export const updateSchedule = [
  param('id').isMongoId().withMessage('Invalid schedule ID'),
  body('class').optional().isMongoId(),
  body('subject').optional().isMongoId(),
  body('teacher').optional().isMongoId(),
  body('room').optional().isMongoId(),
  body('roomModel').optional().isIn(ROOM_MODEL),
  body('type').optional().isIn(TYPE_ENUM),
  body('day_of_week').optional().isIn(DAY_ENUM),
  body('start_time').optional().isISO8601(),
  body('end_time').optional().isISO8601(),
  body('semester_start').optional().isISO8601(),
  body('semester_end').optional().isISO8601(),
];

export const getById = [param('id').isMongoId().withMessage('Invalid schedule ID')];
export const deleteById = [param('id').isMongoId().withMessage('Invalid schedule ID')];
