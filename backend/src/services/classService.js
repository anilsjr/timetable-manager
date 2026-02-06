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
    ClassModel.find(query).sort({ class_name: 1, year: 1, section: 1 }).skip(skip).limit(limit).lean(),
    ClassModel.countDocuments(query),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getClassById = async (id) => {
  const cls = await ClassModel.findById(id);
  if (!cls) throw new Error('Class not found');
  return cls;
};

export const createClass = async (payload) => ClassModel.create(payload);
export const updateClass = async (id, payload) => {
  const cls = await ClassModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!cls) throw new Error('Class not found');
  return cls;
};
export const deleteClass = async (id) => {
  const cls = await ClassModel.findByIdAndDelete(id);
  if (!cls) throw new Error('Class not found');
  return cls;
};
