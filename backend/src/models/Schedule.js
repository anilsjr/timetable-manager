import mongoose from 'mongoose';

const DAY_ENUM = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const TYPE_ENUM = ['LECTURE', 'LAB'];

const scheduleSchema = new mongoose.Schema(
  {
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
    lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', default: null },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
    lab_assistant: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
    room: { type: mongoose.Schema.Types.ObjectId, refPath: 'roomModel', default: null },
    roomModel: { type: String, enum: ['Room', 'Lab'], default: null },
    type: { type: String, enum: TYPE_ENUM, required: true },
    day_of_week: { type: String, enum: DAY_ENUM, required: true },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    duration_slots: { type: Number, default: 1 }, // 1 for LECTURE, 2 for LAB
  },
  { timestamps: true }
);

scheduleSchema.index({ class: 1, day_of_week: 1, start_time: 1 });
scheduleSchema.index({ teacher: 1, day_of_week: 1, start_time: 1 });
scheduleSchema.index({ room: 1, day_of_week: 1, start_time: 1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);
export default Schedule;
