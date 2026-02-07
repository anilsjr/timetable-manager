import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true },
    short_name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    weekly_frequency: { type: Number, required: true },
    duration: { type: Number, default: 50 },
    coordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
  },
  { timestamps: true }
);

subjectSchema.index({ short_name: 1 });

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
