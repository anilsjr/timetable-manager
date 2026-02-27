import mongoose from 'mongoose';

const labSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    short_name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
    capacity: { type: Number, default: 0 },
  },
  { timestamps: true }
);


const Lab = mongoose.model('Lab', labSchema);
export default Lab;
