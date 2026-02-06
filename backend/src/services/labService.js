import Lab from '../models/Lab.js';

export const listLabs = async ({ page = 1, limit = 10, search = '' }) => {
  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { short_name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { room_number: { $regex: search, $options: 'i' } },
        ],
      }
    : {};
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Lab.find(query).sort({ code: 1 }).skip(skip).limit(limit).lean(),
    Lab.countDocuments(query),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getLabById = async (id) => {
  const lab = await Lab.findById(id);
  if (!lab) throw new Error('Lab not found');
  return lab;
};

export const createLab = async (payload) => Lab.create(payload);
export const updateLab = async (id, payload) => {
  const lab = await Lab.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!lab) throw new Error('Lab not found');
  return lab;
};
export const deleteLab = async (id) => {
  const lab = await Lab.findByIdAndDelete(id);
  if (!lab) throw new Error('Lab not found');
  return lab;
};
