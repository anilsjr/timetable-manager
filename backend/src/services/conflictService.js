/**
 * Hard Constraint Engine for Timetable Scheduling
 * Validates schedule creation/update against 8 mandatory constraints
 */
import Schedule from '../models/Schedule.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';

const WORKING_START = 9 * 60; // 09:00 in minutes
const WORKING_END = 17 * 60; // 17:00 in minutes
const LUNCH_START = 13 * 60; // 13:00
const LUNCH_END = 14 * 60; // 14:00

function timeToMinutes(d) {
  const date = d instanceof Date ? d : new Date(d);
  return date.getHours() * 60 + date.getMinutes();
}

function minutesOverlap(start1, end1, start2, end2) {
  return start1 < end2 && end1 > start2;
}

/**
 * Check all hard constraints. Returns null if valid, or conflict error object.
 * @param {Object} payload - Schedule data (class, subject, teacher, room, roomModel, type, day_of_week, start_time, end_time, semester_start, semester_end)
 * @param {string} excludeId - Schedule ID to exclude (for updates)
 */
export async function checkConflicts(payload, excludeId = null) {
  const {
    class: classId,
    subject: subjectId,
    teacher: teacherId,
    room: roomId,
    roomModel,
    type,
    day_of_week,
    start_time,
    end_time,
    semester_start,
    semester_end,
  } = payload;

  const startMin = timeToMinutes(start_time);
  const endMin = timeToMinutes(end_time);

  // 4. Valid Time Range: start_time < end_time, within 09:00–17:00
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

  // 6. Break Restriction: No sessions 13:00–14:00
  if (minutesOverlap(startMin, endMin, LUNCH_START, LUNCH_END)) {
    return {
      type: 'BREAK_VIOLATION',
      message: 'Session cannot overlap lunch break (13:00–14:00)',
      conflict_id: '',
    };
  }

  // 5. Valid Semester Range
  const semStart = new Date(semester_start).getTime();
  const semEnd = new Date(semester_end).getTime();
  const sessionStart = new Date(start_time).getTime();
  const sessionEnd = new Date(end_time).getTime();
  if (sessionStart < semStart || sessionEnd > semEnd) {
    return {
      type: 'INVALID_SEMESTER',
      message: 'Session must fall within semester dates',
      conflict_id: '',
    };
  }

  const query = { day_of_week };
  if (excludeId) query._id = { $ne: excludeId };

  // 1. No Student Overlap
  const classOverlaps = await Schedule.find({
    ...query,
    class: classId,
  }).lean();

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

  // 2. No Teacher Overlap
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

  // 3. No Room Overlap (room can be Room or Lab)
  const roomOverlaps = await Schedule.find({
    ...query,
    room: roomId,
    roomModel,
  }).lean();
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

  // 7. Capacity Constraint
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

  // 8. Weekly Frequency Validation
  const subject = await Subject.findById(subjectId).lean();
  const requiredFreq = subject?.weekly_frequency ?? 0;
  const existingCount = await Schedule.countDocuments({
    class: classId,
    subject: subjectId,
    semester_start: { $lte: semester_end },
    semester_end: { $gte: semester_start },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });
  if (existingCount >= requiredFreq) {
    return {
      type: 'WEEKLY_FREQUENCY_EXCEEDED',
      message: `Subject already has ${existingCount} sessions per week (max ${requiredFreq})`,
      conflict_id: '',
    };
  }

  return null;
}
