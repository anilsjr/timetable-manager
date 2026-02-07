/**
 * Hard Constraint Engine for Timetable Scheduling
 */
import Schedule from '../models/Schedule.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';

const WORKING_START = 9 * 60;
const WORKING_END = 17 * 60;
const LUNCH_START = 13 * 60;
const LUNCH_END = 14 * 60;

const REFERENCE_DATE = '1970-01-01';

function timeToMinutes(d) {
  const date = d instanceof Date ? d : new Date(d);
  return date.getHours() * 60 + date.getMinutes();
}

function minutesOverlap(start1, end1, start2, end2) {
  return start1 < end2 && end1 > start2;
}

function parseTimeToDate(dayOfWeek, timeStr) {
  const dayMap = { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5 };
  const base = new Date(REFERENCE_DATE);
  base.setDate(base.getDate() + dayMap[dayOfWeek] || 0);
  if (typeof timeStr === 'string' && timeStr.includes(':')) {
    const [h, m] = timeStr.split(':').map(Number);
    base.setHours(h || 0, m || 0, 0, 0);
    return base;
  }
  const d = timeStr instanceof Date ? timeStr : new Date(timeStr);
  base.setHours(d.getHours(), d.getMinutes(), 0, 0);
  return base;
}

export async function checkConflicts(payload, excludeId = null) {
  let {
    class: classId,
    subject: subjectId,
    teacher: teacherId,
    room: roomId,
    roomModel,
    type,
    day_of_week,
    start_time,
    end_time,
  } = payload;

  if (typeof start_time === 'string' && start_time.length <= 5 && start_time.includes(':')) {
    start_time = parseTimeToDate(day_of_week, start_time);
  }
  if (typeof end_time === 'string' && end_time.length <= 5 && end_time.includes(':')) {
    end_time = parseTimeToDate(day_of_week, end_time);
  }

  const startMin = timeToMinutes(start_time);
  const endMin = timeToMinutes(end_time);

  if (startMin >= endMin) {
    return { type: 'INVALID_TIME_RANGE', message: 'Start time must be before end time', conflict_id: '' };
  }
  if (startMin < WORKING_START || endMin > WORKING_END) {
    return {
      type: 'INVALID_TIME_RANGE',
      message: 'Session must be within working hours (09:00–17:00)',
      conflict_id: '',
    };
  }

  if (minutesOverlap(startMin, endMin, LUNCH_START, LUNCH_END)) {
    return {
      type: 'BREAK_VIOLATION',
      message: 'Session cannot overlap lunch break (13:00–14:00)',
      conflict_id: '',
    };
  }

  const query = { day_of_week };
  if (excludeId) query._id = { $ne: excludeId };

  const classOverlaps = await Schedule.find({ ...query, class: classId }).lean();
  for (const s of classOverlaps) {
    const sStart = timeToMinutes(s.start_time);
    const sEnd = timeToMinutes(s.end_time);
    if (minutesOverlap(startMin, endMin, sStart, sEnd)) {
      return {
        type: 'STUDENT_OVERLAP',
        message: 'Class already has a session at this time',
        conflict_id: s._id.toString(),
      };
    }
  }

  if (teacherId) {
    const teacherOverlaps = await Schedule.find({ ...query, teacher: teacherId }).lean();
    for (const s of teacherOverlaps) {
      const sStart = timeToMinutes(s.start_time);
      const sEnd = timeToMinutes(s.end_time);
      if (minutesOverlap(startMin, endMin, sStart, sEnd)) {
        return {
          type: 'TEACHER_CONFLICT',
          message: 'Teacher already assigned at this time',
          conflict_id: s._id.toString(),
        };
      }
    }
  }

  if (roomId && roomModel) {
    const roomOverlaps = await Schedule.find({ ...query, room: roomId, roomModel }).lean();
    for (const s of roomOverlaps) {
      const sStart = timeToMinutes(s.start_time);
      const sEnd = timeToMinutes(s.end_time);
      if (minutesOverlap(startMin, endMin, sStart, sEnd)) {
        return {
          type: 'ROOM_CONFLICT',
          message: 'Room already in use at this time',
          conflict_id: s._id.toString(),
        };
      }
    }

    const cls = await Class.findById(classId).lean();
    if (!cls) {
      return { type: 'INVALID_DATA', message: 'Class not found', conflict_id: '' };
    }
    const studentCount = cls?.student_count ?? 0;
    let roomCapacity = 0;
    if (roomModel === 'Room') {
      const Room = (await import('../models/Room.js')).default;
      const roomDoc = await Room.findById(roomId).lean();
      roomCapacity = roomDoc?.capacity ?? 0;
    } else if (roomModel === 'Lab') {
      const Lab = (await import('../models/Lab.js')).default;
      const labDoc = await Lab.findById(roomId).lean();
      roomCapacity = labDoc?.capacity ?? 0;
    }
    if (roomCapacity < studentCount) {
      return {
        type: 'CAPACITY_EXCEEDED',
        message: `Room capacity (${roomCapacity}) is less than class size (${studentCount})`,
        conflict_id: '',
      };
    }
  }

  if (subjectId) {
    const subject = await Subject.findById(subjectId).lean();
    const requiredFreq = subject?.weekly_frequency ?? 0;
    const existingCount = await Schedule.countDocuments({
      class: classId,
      subject: subjectId,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
    if (requiredFreq > 0 && existingCount >= requiredFreq) {
      return {
        type: 'WEEKLY_FREQUENCY_EXCEEDED',
        message: `Subject already has ${existingCount} sessions per week (max ${requiredFreq})`,
        conflict_id: '',
      };
    }
  }

  return null;
}
