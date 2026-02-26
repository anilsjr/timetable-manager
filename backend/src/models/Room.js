import mongoose from 'mongoose';

const TYPE_ENUM = ['class', 'lab'];

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    type: { type: String, required: true, enum: TYPE_ENUM },
    capacity: { type: Number, required: true },
  },
  { timestamps: true }
);


const Room = mongoose.model('Room', roomSchema);
export default Room;
