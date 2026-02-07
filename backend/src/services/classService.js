import ClassModel from '../models/Class.js';

export const listClasses = async ({ page = 1, limit = 10, search = '' }) => {
  const query = search
    ? {
        $or: [
          { class_name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
        ],
      }
    : {};
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    ClassModel.find(query)
      .populate('subjects', 'code short_name full_name')
      .populate('labs', 'code short_name name')
      .sort({ class_name: 1, year: 1, section: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ClassModel.countDocuments(query),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getClassById = async (id) => {
  const cls = await ClassModel.findById(id)
    .populate('subjects', 'code short_name full_name')
    .populate('labs', 'code short_name name');
  if (!cls) throw new Error('Class not found');
  return cls;
};

export const getClassSubjects = async (classId) => {
  const cls = await ClassModel.findById(classId)
    .populate('subjects', 'code short_name full_name')
    .lean();
  if (!cls) throw new Error('Class not found');
  return cls.subjects || [];
};

export const createClass = async (payload) => {
  const { subjects, labs, ...rest } = payload;
  const doc = { ...rest, subjects: subjects || [], labs: labs || [] };
  const created = await ClassModel.create(doc);
  return ClassModel.findById(created._id)
    .populate('subjects', 'code short_name full_name')
    .populate('labs', 'code short_name name')
    .lean();
};

export const updateClass = async (id, payload) => {
  const { subjects, labs, ...rest } = payload;
  const update = { ...rest };
  if (Array.isArray(subjects)) update.subjects = subjects;
  if (Array.isArray(labs)) update.labs = labs;
  const cls = await ClassModel.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  })
    .populate('subjects', 'code short_name full_name')
    .populate('labs', 'code short_name name');
  if (!cls) throw new Error('Class not found');
  return cls;
};
export const deleteClass = async (id) => {
  const cls = await ClassModel.findByIdAndDelete(id);
  if (!cls) throw new Error('Class not found');
  return cls;
};
