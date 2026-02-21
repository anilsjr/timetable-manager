import Schedule from '../models/Schedule.js';
import Teacher from '../models/Teacher.js';
import { checkConflicts } from './conflictService.js';

const REFERENCE_DATE = '1970-01-01';
const DAY_MAP = { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5 };

function toDate(dayOfWeek, timeStr) {
  const base = new Date(REFERENCE_DATE);
  base.setDate(base.getDate() + (DAY_MAP[dayOfWeek] ?? 0));
  if (typeof timeStr === 'string' && timeStr.includes(':')) {
    const [h, m] = timeStr.split(':').map(Number);
    base.setHours(h || 0, m || 0, 0, 0);
    return base;
  }
  const d = timeStr instanceof Date ? timeStr : new Date(timeStr);
  base.setHours(d.getHours(), d.getMinutes(), 0, 0);
  return base;
}

function normalizePayload(body) {
  const classId = body.classId || body.class;
  const subjectId = body.subjectId || body.subject;
  const teacherId = body.teacherId || body.teacher;
  const day = body.day || body.day_of_week;
  const startTime = body.startTime || body.start_time;
  const endTime = body.endTime || body.end_time;
  const type = body.type;

  const start_time =
    typeof startTime === 'string' && startTime.length <= 5
      ? toDate(day, startTime)
      : new Date(startTime);
  
  let end_time;
  if (type === 'LAB') {
    // For labs, calculate end_time as start_time + 100 minutes (2 slots of 50 minutes each)
    end_time = new Date(start_time);
    end_time.setMinutes(end_time.getMinutes() + 100);
  } else {
    end_time =
      typeof endTime === 'string' && endTime.length <= 5 ? toDate(day, endTime) : new Date(endTime);
  }

  const normalized = {
    class: classId,
    subject: subjectId ?? null,
    teacher: teacherId ?? null,
    type: type,
    day_of_week: day,
    start_time,
    end_time,
    duration_slots: type === 'LAB' ? 2 : 1,
  };
  if (body.room !== undefined) normalized.room = body.room ?? null;
  if (body.roomModel !== undefined) normalized.roomModel = body.roomModel ?? null;
  return normalized;
}

async function ensureTeacherCanTeachSubject(teacherId, subjectId) {
  const teacher = await Teacher.findById(teacherId).lean();
  if (!teacher) throw new Error('Teacher not found');
  const subjectIds = (teacher.subjects || []).map((s) => (s && typeof s === 'object' && s.toString ? s.toString() : String(s)));
  if (!subjectIds.length || !subjectIds.includes(String(subjectId))) {
    const err = new Error('Teacher not allowed to teach this subject');
    err.code = 400;
    throw err;
  }
}

export const listSchedules = async ({ page = 1, limit = 10, search = '', classId, teacherId }) => {
  const query = {};
  if (classId) query.class = classId;
  if (teacherId) query.teacher = teacherId;
  if (search && ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].includes(search.toUpperCase())) {
    query.day_of_week = search.toUpperCase();
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

export const getSchedulesByClass = async (classId) => {
  const data = await Schedule.find({ class: classId })
    .populate('class', 'class_name year section code')
    .populate('subject', 'full_name short_name code')
    .populate('teacher', 'name short_abbr')
    .populate('room', 'name short_name code room_number')
    .sort({ day_of_week: 1, start_time: 1 })
    .lean();
  return data;
};

export const getScheduleById = async (id) => {
  const schedule = await Schedule.findById(id)
    .populate('class', 'class_name year section code student_count')
    .populate('subject', 'full_name short_name code')
    .populate('teacher', 'name short_abbr')
    .lean();
  if (!schedule) throw new Error('Schedule not found');
  return schedule;
};

export const createSchedule = async (payload) => {
  const normalized = normalizePayload(payload);
  if (normalized.teacher && normalized.subject) {
    await ensureTeacherCanTeachSubject(normalized.teacher, normalized.subject);
  }
  const conflict = await checkConflicts(normalized);
  if (conflict) {
    const err = new Error(conflict.message);
    err.conflict = conflict;
    throw err;
  }
  const doc = await Schedule.create(normalized);
  return Schedule.findById(doc._id)
    .populate('class', 'class_name year section code')
    .populate('subject', 'full_name short_name code')
    .populate('teacher', 'name short_abbr')
    .lean();
};

export const updateSchedule = async (id, payload) => {
  const normalized = normalizePayload(payload);
  if (normalized.teacher && normalized.subject) {
    await ensureTeacherCanTeachSubject(normalized.teacher, normalized.subject);
  }
  const conflict = await checkConflicts(normalized, id);
  if (conflict) {
    const err = new Error(conflict.message);
    err.conflict = conflict;
    throw err;
  }
  const schedule = await Schedule.findByIdAndUpdate(id, normalized, {
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
