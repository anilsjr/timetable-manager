import mongoose from 'mongoose';

const SECTION_ENUM = ['F', 'S', 'T', 'L'];

const classSchema = new mongoose.Schema(
  {
    class_name: { type: String, required: true },
    year: { type: Number, required: true },
    section: { type: String, required: true, enum: SECTION_ENUM },
    code: { type: String, unique: true },
    student_count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

classSchema.pre('save', function (next) {
  if (!this.isModified('class_name') && !this.isModified('year') && !this.isModified('section')) {
    return next();
  }
  this.code = `${this.class_name}-${this.year}${this.section}`;
  next();
});

classSchema.index({ code: 1 }, { unique: true });
classSchema.index({ class_name: 1, year: 1, section: 1 });

const Class = mongoose.model('Class', classSchema);
export default Class;
