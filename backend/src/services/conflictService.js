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

// Slot boundaries (in minutes from midnight)
const SLOT_TIMES = [
  { start: 9 * 60 + 45, end: 10 * 60 + 35 },   // 09:45-10:35
  { start: 10 * 60 + 35, end: 11 * 60 + 25 },  // 10:35-11:25
  // BREAK: 11:25-11:30
  { start: 11 * 60 + 30, end: 12 * 60 + 20 },  // 11:30-12:20
  { start: 12 * 60 + 20, end: 13 * 60 + 10 },  // 12:20-13:10
  // LUNCH: 13:10-13:40 (or 13:00-14:00 in some configs)
  { start: 13 * 60 + 40, end: 14 * 60 + 30 },  // 13:40-14:30
  { start: 14 * 60 + 30, end: 15 * 60 + 20 },  // 14:30-15:20
  { start: 15 * 60 + 20, end: 16 * 60 + 10 },  // 15:20-16:10
];

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

/**
 * Find which slot index a time falls into (-1 if not in any slot or in break/lunch)
 */
function findSlotIndex(timeMin) {
  for (let i = 0; i < SLOT_TIMES.length; i++) {
    if (timeMin >= SLOT_TIMES[i].start && timeMin < SLOT_TIMES[i].end) {
      return i;
    }
  }
  return -1;
}

/**
 * Check if a time range spans across break or lunch
 */
function spansBreakOrLunch(startMin, endMin) {
  const BREAK_START = 11 * 60 + 25;
  const BREAK_END = 11 * 60 + 30;
  const LUNCH_START_SLOT = 13 * 60 + 10;
  const LUNCH_END_SLOT = 13 * 60 + 40;
  
  // Check if spans the break
  if (startMin < BREAK_END && endMin > BREAK_START) {
    return 'BREAK';
  }
  
  // Check if spans lunch
  if (startMin < LUNCH_END_SLOT && endMin > LUNCH_START_SLOT) {
    return 'LUNCH';
  }
  
  return null;
}

/**
 * Validate that a LAB session occupies exactly 2 continuous slots
 */
function validateLabDuration(startMin, endMin) {
  const startSlotIdx = findSlotIndex(startMin);
  const endSlotIdx = findSlotIndex(endMin - 1); // Check just before end time
  
  if (startSlotIdx === -1) {
    return { valid: false, message: 'Lab start time must align with a slot boundary' };
  }
  
  // Lab must occupy exactly 2 continuous slots
  if (endSlotIdx !== startSlotIdx + 1) {
    return { valid: false, message: 'Lab must occupy exactly 2 continuous slots (100 minutes)' };
  }
  
  // Check that both slots are continuous (no break/lunch between them)
  const slot1End = SLOT_TIMES[startSlotIdx].end;
  const slot2Start = SLOT_TIMES[endSlotIdx].start;
  
  if (slot1End !== slot2Start) {
    return { valid: false, message: 'Lab cannot span across breaks or lunch. Choose 2 continuous slots.' };
  }
  
  // Verify end time matches exactly
  const expectedEndMin = SLOT_TIMES[endSlotIdx].end;
  if (endMin !== expectedEndMin) {
    return { valid: false, message: `Lab end time must be ${Math.floor(expectedEndMin / 60)}:${String(expectedEndMin % 60).padStart(2, '0')}` };
  }
  
  return { valid: true };
}

export async function checkConflicts(payload, excludeId = null) {
  let {
    class: classId,
    subject: subjectId,
    teacher: teacherId,
    lab_assistant: labAssistantId,
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

  // Special validation for LAB sessions (must occupy exactly 2 continuous slots)
  if (type === 'LAB') {
    const labValidation = validateLabDuration(startMin, endMin);
    if (!labValidation.valid) {
      return {
        type: 'LAB_DURATION_INVALID',
        message: labValidation.message,
        conflict_id: '',
      };
    }
  }

  // Check if session spans break or lunch (applies to both LECTURE and LAB)
  const breachType = spansBreakOrLunch(startMin, endMin);
  if (breachType) {
    return {
      type: 'BREAK_VIOLATION',
      message: `Session cannot span across ${breachType.toLowerCase()} time`,
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
    const teacherOverlaps = await Schedule.find({
      ...query,
      $or: [{ teacher: teacherId }, { lab_assistant: teacherId }],
    }).lean();
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

  // Check lab assistant teacher conflicts (must not be busy at same time)
  if (labAssistantId) {
    if (teacherId && String(labAssistantId) === String(teacherId)) {
      return {
        type: 'TEACHER_CONFLICT',
        message: 'Lab In-Charge and Lab Assistant cannot be the same teacher',
        conflict_id: '',
      };
    }
    const assistantOverlaps = await Schedule.find({
      ...query,
      $or: [{ teacher: labAssistantId }, { lab_assistant: labAssistantId }],
    }).lean();
    for (const s of assistantOverlaps) {
      const sStart = timeToMinutes(s.start_time);
      const sEnd = timeToMinutes(s.end_time);
      if (minutesOverlap(startMin, endMin, sStart, sEnd)) {
        return {
          type: 'TEACHER_CONFLICT',
          message: 'Lab Assistant already assigned at this time',
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

  return null;
}
