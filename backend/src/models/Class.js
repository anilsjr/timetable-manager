import mongoose from 'mongoose';

const SECTION_ENUM = ['1', '2', '3', '4'];

const classSchema = new mongoose.Schema(
  {
    class_name: { type: String, required: true },
    year: { type: Number, required: true },
    section: { type: String, required: true, enum: SECTION_ENUM },
    code: { type: String, unique: true },
    student_count: { type: Number, default: 0 },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: [] }],
    labs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lab', default: [] }],
  },
  { timestamps: true }
);

classSchema.pre('save', function (next) {
  if (!this.isModified('class_name') && !this.isModified('year') && !this.isModified('section')) {
    return next();
  }
  // Year mapping: 1='', 2='S', 3='T', 4='F'
  const yearCodeMap = { 1: '', 2: 'S', 3: 'T', 4: 'F' };
  const yearCode = yearCodeMap[this.year] || '';
  // Format: class_name + year_code + section (section is 1,2,3,4)
  this.code = `${this.class_name}${yearCode}${this.section}`;
  next();
});

classSchema.index({ class_name: 1, year: 1, section: 1 });

const Class = mongoose.model('Class', classSchema);
export default Class;
