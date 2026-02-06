import Subject from '../models/Subject.js';

/**
 * List subjects with server-side pagination and search
 */
export const listSubjects = async ({ page = 1, limit = 10, search = '' }) => {
  const query = search
    ? {
        $or: [
          { full_name: { $regex: search, $options: 'i' } },
          { short_name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
        ],
      }
    : {};
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Subject.find(query).sort({ code: 1 }).skip(skip).limit(limit).lean(),
    Subject.countDocuments(query),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get single subject by ID
 */
export const getSubjectById = async (id) => {
  const subject = await Subject.findById(id);
  if (!subject) throw new Error('Subject not found');
  return subject;
};

/**
 * Create subject
 */
export const createSubject = async (payload) => {
  return Subject.create(payload);
};

/**
 * Update subject
 */
export const updateSubject = async (id, payload) => {
  const subject = await Subject.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!subject) throw new Error('Subject not found');
  return subject;
};

/**
 * Delete subject
 */
export const deleteSubject = async (id) => {
  const subject = await Subject.findByIdAndDelete(id);
  if (!subject) throw new Error('Subject not found');
  return subject;
};
