import Teacher from '../models/Teacher.js';

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
    Teacher.find(query).populate('subjects', 'full_name short_name code').sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Teacher.countDocuments(query),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getTeacherById = async (id) => {
  const teacher = await Teacher.findById(id).populate('subjects', 'full_name short_name code');
  if (!teacher) throw new Error('Teacher not found');
  return teacher;
};

export const createTeacher = async (payload) => Teacher.create(payload);
export const updateTeacher = async (id, payload) => {
  const teacher = await Teacher.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).populate('subjects', 'full_name short_name code');
  if (!teacher) throw new Error('Teacher not found');
  return teacher;
};
export const deleteTeacher = async (id) => {
  const teacher = await Teacher.findByIdAndDelete(id);
  if (!teacher) throw new Error('Teacher not found');
  return teacher;
};
