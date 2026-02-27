import { body, param } from 'express-validator';

const DAY_ENUM = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const TYPE_ENUM = ['LECTURE', 'LAB'];
const ROOM_MODEL = ['Room', 'Lab'];

const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const createSchedule = [
  body('classId').optional().isMongoId().withMessage('Valid class required'),
  body('class').optional().isMongoId().withMessage('Valid class required'),
  body('subjectId').optional().isMongoId().withMessage('Valid subject required'),
  body('subject').optional().isMongoId().withMessage('Valid subject required'),
  body('teacherId').optional().isMongoId().withMessage('Valid teacher required'),
  body('teacher').optional().isMongoId().withMessage('Valid teacher required'),
  body('day').optional().isIn(DAY_ENUM).withMessage('Valid day required'),
  body('day_of_week').optional().isIn(DAY_ENUM).withMessage('Valid day required'),
  body('startTime').optional().matches(timePattern).withMessage('Valid startTime required (HH:mm)'),
  body('start_time').optional(),
  body('endTime').optional().matches(timePattern).withMessage('Valid endTime required (HH:mm)'),
  body('end_time').optional(),
  body('type').isIn(TYPE_ENUM).withMessage('type must be LECTURE or LAB'),
  body('room').optional().isMongoId(),
  body('roomModel').optional().isIn(ROOM_MODEL),
]
  .concat([
    body().custom((_, { req }) => {
      const b = req.body;
      if (!b.classId && !b.class) throw new Error('Class is required');
      if (b.type === 'LAB') {
        if (!b.room) throw new Error('Lab is required');
        if (b.roomModel && !['Lab', 'Room'].includes(b.roomModel)) throw new Error('roomModel must be Lab or Room for lab schedule');
      } else {
        if (!b.subjectId && !b.subject) throw new Error('Subject is required');
        if (!b.teacherId && !b.teacher) throw new Error('Teacher is required');
      }
      if (!b.day && !b.day_of_week) throw new Error('Day is required');
      const hasStart = b.startTime || (b.start_time && (b.start_time.length <= 5 ? timePattern.test(b.start_time) : true));
      const hasEnd = b.endTime || (b.end_time && (b.end_time.length <= 5 ? timePattern.test(b.end_time) : true));
      if (!hasStart) throw new Error('Start time is required');
      if (!hasEnd) throw new Error('End time is required');
      return true;
    }),
  ]);

export const updateSchedule = [
  param('id').isMongoId().withMessage('Invalid schedule ID'),
  body('classId').optional().isMongoId(),
  body('class').optional().isMongoId(),
  body('subjectId').optional().isMongoId(),
  body('subject').optional().isMongoId(),
  body('teacherId').optional().isMongoId(),
  body('teacher').optional().isMongoId(),
  body('day').optional().isIn(DAY_ENUM),
  body('day_of_week').optional().isIn(DAY_ENUM),
  body('startTime').optional().matches(timePattern),
  body('start_time').optional(),
  body('endTime').optional().matches(timePattern),
  body('end_time').optional(),
  body('type').optional().isIn(TYPE_ENUM),
  body('room').optional().isMongoId(),
  body('roomModel').optional().isIn(ROOM_MODEL),
];

export const getById = [param('id').isMongoId().withMessage('Invalid schedule ID')];
export const deleteById = [param('id').isMongoId().withMessage('Invalid schedule ID')];

export const listByClass = [param('classId').isMongoId().withMessage('Invalid class ID')];
