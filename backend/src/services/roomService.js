import Room from '../models/Room.js';

export const listRooms = async ({ page = 1, limit = 10, search = '' }) => {
  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
        ],
      }
    : {};
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Room.find(query).sort({ code: 1 }).skip(skip).limit(limit).lean(),
    Room.countDocuments(query),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getRoomById = async (id) => {
  const room = await Room.findById(id);
  if (!room) throw new Error('Room not found');
  return room;
};

export const createRoom = async (payload) => Room.create(payload);
export const updateRoom = async (id, payload) => {
  const room = await Room.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!room) throw new Error('Room not found');
  return room;
};
export const deleteRoom = async (id) => {
  const room = await Room.findByIdAndDelete(id);
  if (!room) throw new Error('Room not found');
  return room;
};
