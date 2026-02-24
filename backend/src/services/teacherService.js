import Teacher from '../models/Teacher.js';
import Schedule from '../models/Schedule.js';

/** Format Date to HH:mm (local hours/minutes) */
function formatTimeLocal(d) {
  const date = d instanceof Date ? d : new Date(d);
  const h = date.getHours();
  const m = date.getMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Returns teacher IDs that are already assigned at the given day + startTime.
 * When excludeScheduleId is set (e.g. when editing), that schedule's teacher is not counted as busy.
 */
export async function getBusyTeacherIdsAtSlot(day, startTime, excludeScheduleId = null) {
  const schedules = await Schedule.find({ day_of_week: day })
    .select('teacher start_time _id')
    .lean();
  const busy = schedules.filter((s) => {
    if (!s.teacher) return false;
    const timeStr = formatTimeLocal(s.start_time);
    if (timeStr !== startTime) return false;
    if (excludeScheduleId && s._id.toString() === excludeScheduleId.toString()) return false;
    return true;
  });
  return [...new Set(busy.map((s) => s.teacher.toString()))];
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
  const { day, startTime, excludeScheduleId } = options;
  let data = await Teacher.find({ subjects: subjectId })
    .populate('subjects', 'full_name short_name code')
    .populate('labs', 'name short_name code')
    .sort({ name: 1 })
    .lean();

  if (day && startTime) {
    const busyIds = await getBusyTeacherIdsAtSlot(day, startTime, excludeScheduleId);
    if (busyIds.length) {
      data = data.filter((t) => !busyIds.includes(t._id.toString()));
    }
  }

  return data;
};

export const getTeachersByLab = async (labId, options = {}) => {
  const { day, startTime, excludeScheduleId } = options;
  let data = await Teacher.find({ labs: labId })
    .populate('subjects', 'full_name short_name code')
    .populate('labs', 'name short_name code')
    .sort({ name: 1 })
    .lean();

  if (day && startTime) {
    const busyIds = await getBusyTeacherIdsAtSlot(day, startTime, excludeScheduleId);
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
