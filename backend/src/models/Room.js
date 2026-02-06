import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true },
  },
  { timestamps: true }
);

roomSchema.index({ code: 1 }, { unique: true });

const Room = mongoose.model('Room', roomSchema);
export default Room;
