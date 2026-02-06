import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    short_abbr: { type: String, required: true },
    code: { type: String, unique: true, sparse: true },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    max_load_per_day: { type: Number },
  },
  { timestamps: true }
);

teacherSchema.index({ short_abbr: 1 });

const Teacher = mongoose.model('Teacher', teacherSchema);
export default Teacher;
