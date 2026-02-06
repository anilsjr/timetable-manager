import Schedule from '../models/Schedule.js';
import { checkConflicts } from './conflictService.js';

export const listSchedules = async ({ page = 1, limit = 10, search = '', classId, teacherId }) => {
  const query = {};
  if (classId) query.class = classId;
  if (teacherId) query.teacher = teacherId;
  if (search) {
    // Search by day or other fields - for now keep simple
    if (['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].includes(search.toUpperCase())) {
      query.day_of_week = search.toUpperCase();
    }
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Schedule.find(query)
      .populate('class', 'class_name year section code')
      .populate('subject', 'full_name short_name code')
      .populate('teacher', 'name short_abbr')
      .sort({ day_of_week: 1, start_time: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Schedule.countDocuments(query),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getScheduleById = async (id) => {
  const schedule = await Schedule.findById(id)
    .populate('class', 'class_name year section code student_count')
    .populate('subject', 'full_name short_name code weekly_frequency')
    .populate('teacher', 'name short_abbr')
    .lean();
  if (!schedule) throw new Error('Schedule not found');
  return schedule;
};

export const createSchedule = async (payload) => {
  const conflict = await checkConflicts(payload);
  if (conflict) {
    const err = new Error(conflict.message);
    err.conflict = conflict;
    throw err;
  }
  return Schedule.create(payload);
};

export const updateSchedule = async (id, payload) => {
  const conflict = await checkConflicts(payload, id);
  if (conflict) {
    const err = new Error(conflict.message);
    err.conflict = conflict;
    throw err;
  }
  const schedule = await Schedule.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  })
    .populate('class', 'class_name year section code')
    .populate('subject', 'full_name short_name code')
    .populate('teacher', 'name short_abbr');
  if (!schedule) throw new Error('Schedule not found');
  return schedule;
};

export const deleteSchedule = async (id) => {
  const schedule = await Schedule.findByIdAndDelete(id);
  if (!schedule) throw new Error('Schedule not found');
  return schedule;
};
