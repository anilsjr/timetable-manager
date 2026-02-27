import Teacher from '../models/Teacher.js';
import Schedule from '../models/Schedule.js';

/** Format Date to HH:mm (local hours/minutes) */
function formatTimeLocal(d) {
  const date = d instanceof Date ? d : new Date(d);
  const h = date.getHours();
  const m = date.getMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeStrToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function dateToMinutes(d) {
  const date = d instanceof Date ? d : new Date(d);
  return date.getHours() * 60 + date.getMinutes();
}

function minutesOverlap(start1, end1, start2, end2) {
  return start1 < end2 && end1 > start2;
}

/**
 * Returns teacher IDs that are busy (overlap with the given time range) on the given day.
 * Checks both teacher (In-Charge) and lab_assistant fields.
 * When excludeScheduleId is set the excluded schedule is ignored.
 */
export async function getBusyTeacherIdsAtSlot(day, startTime, excludeScheduleId = null, endTime = null) {
  // Calculate end time: if not provided, assume a 50-min lecture slot
  const startMin = timeStrToMinutes(startTime);
  const endMin = endTime ? timeStrToMinutes(endTime) : startMin + 50;

  const schedules = await Schedule.find({ day_of_week: day })
    .select('teacher lab_assistant start_time end_time _id')
    .lean();

  const busyIds = new Set();
  schedules.forEach((s) => {
    if (excludeScheduleId && s._id.toString() === excludeScheduleId.toString()) return;
    const sStart = dateToMinutes(s.start_time);
    const sEnd = dateToMinutes(s.end_time);
    if (!minutesOverlap(startMin, endMin, sStart, sEnd)) return;
    if (s.teacher) busyIds.add(s.teacher.toString());
    if (s.lab_assistant) busyIds.add(s.lab_assistant.toString());
  });

  return [...busyIds];
}

export const listTeachers = async ({ page = 1, limit = 10, search = '' }) => {
  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { short_abbr: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
        ],
      }
    : {};
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Teacher.find(query).populate('subjects', 'full_name short_name code').populate('labs', 'name short_name code').sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Teacher.countDocuments(query),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getTeacherById = async (id) => {
  const teacher = await Teacher.findById(id).populate('subjects', 'full_name short_name code').populate('labs', 'name short_name code');
  if (!teacher) throw new Error('Teacher not found');
  return teacher;
};

export const getTeachersBySubject = async (subjectId, options = {}) => {
  const { day, startTime, endTime, excludeScheduleId } = options;
  let data = await Teacher.find({ subjects: subjectId })
    .populate('subjects', 'full_name short_name code')
    .populate('labs', 'name short_name code')
    .sort({ name: 1 })
    .lean();

  if (day && startTime) {
    const busyIds = await getBusyTeacherIdsAtSlot(day, startTime, excludeScheduleId, endTime);
    if (busyIds.length) {
      data = data.filter((t) => !busyIds.includes(t._id.toString()));
    }
  }

  return data;
};

export const getTeachersByLab = async (labId, options = {}) => {
  const { day, startTime, endTime, excludeScheduleId } = options;
  let data = await Teacher.find({ labs: labId })
    .populate('subjects', 'full_name short_name code')
    .populate('labs', 'name short_name code')
    .sort({ name: 1 })
    .lean();

  if (day && startTime) {
    const busyIds = await getBusyTeacherIdsAtSlot(day, startTime, excludeScheduleId, endTime);
    if (busyIds.length) {
      data = data.filter((t) => !busyIds.includes(t._id.toString()));
    }
  }

  return data;
};

export const createTeacher = async (payload) => Teacher.create(payload);
export const updateTeacher = async (id, payload) => {
  const teacher = await Teacher.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).populate('subjects', 'full_name short_name code').populate('labs', 'name short_name code');
  if (!teacher) throw new Error('Teacher not found');
  return teacher;
};
export const deleteTeacher = async (id) => {
  const teacher = await Teacher.findByIdAndDelete(id);
  if (!teacher) throw new Error('Teacher not found');
  return teacher;
};
