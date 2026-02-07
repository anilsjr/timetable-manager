/**
 * Seed script - creates sample data for IPS Academy Timetable
 * Run: npm run seed
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Subject from '../src/models/Subject.js';
import Teacher from '../src/models/Teacher.js';
import Class from '../src/models/Class.js';
import Lab from '../src/models/Lab.js';
import Room from '../src/models/Room.js';
import Schedule from '../src/models/Schedule.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/timetable_ips';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Schedule.deleteMany({}),
      Subject.deleteMany({}),
      Teacher.deleteMany({}),
      Class.deleteMany({}),
      Lab.deleteMany({}),
      Room.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Admin user (email matches Postman collection)
    const admin = await User.create({
      email: 'admin@ips.academy',
      password: 'admin123',
      role: 'admin',
    });
    console.log('Created admin user:', admin.email);

    // Subjects (from IPS timetable)
    const subjects = await Subject.insertMany([
      { full_name: 'Natural Language Processing', short_name: 'NLP', code: 'PCC CL13', weekly_frequency: 2, duration: 50 },
      { full_name: 'Automata and Compiler Design', short_name: 'ACD', code: 'PCC CL15', weekly_frequency: 2, duration: 50 },
      { full_name: 'Introduction to Data Science', short_name: 'IDS', code: 'PCC CL14', weekly_frequency: 2, duration: 50 },
      { full_name: 'Software Engineering', short_name: 'SE', code: 'PEC CL02', weekly_frequency: 2, duration: 50 },
      { full_name: 'Scientific Aptitude', short_name: 'SA', code: 'IOC MA01', weekly_frequency: 2, duration: 50 },
      { full_name: 'Intellectual Property Rights', short_name: 'IPR', code: 'MLC MLC04', weekly_frequency: 1, duration: 50 },
      { full_name: 'Data Analytics using tools', short_name: 'DAT', code: 'LC CL14', weekly_frequency: 2, duration: 100 },
      { full_name: 'Japanese/French', short_name: 'LLC', code: 'HSMC HS05', weekly_frequency: 1, duration: 50 },
    ]);
    console.log('Created subjects:', subjects.length);

    // Teachers
    const teachers = await Teacher.insertMany([
      { name: 'Mr. Sachine Soni', short_abbr: 'SS', code: '1', subjects: [subjects[0]._id], max_load_per_day: 4 },
      { name: 'Mr. Prateek Nahar', short_abbr: 'PN', code: '2', subjects: [subjects[1]._id], max_load_per_day: 4 },
      { name: 'Mr. Yagyapal Yadav', short_abbr: 'YY', code: '3', subjects: [subjects[2]._id, subjects[6]._id], max_load_per_day: 4 },
      { name: 'Mr. Nayan Kumar Yadav', short_abbr: 'NKY', code: '4', subjects: [subjects[3]._id], max_load_per_day: 4 },
      { name: 'Ms. Akanksha Jatav', short_abbr: 'AJ', code: '5', subjects: [subjects[4]._id], max_load_per_day: 4 },
      { name: 'Mr. Shubham Kanungo', short_abbr: 'SK', code: '6', subjects: [subjects[5]._id], max_load_per_day: 4 },
      { name: 'Ms. Abhilasha Vyas', short_abbr: 'AV', code: '7', subjects: [subjects[7]._id], max_load_per_day: 4 },
    ]);
    console.log('Created teachers:', teachers.length);

    // Classes (code auto-generated: class_name-year+section; insertMany bypasses pre-save, so set manually)
    const classes = await Class.insertMany([
      { class_name: 'CSEAIML', year: 3, section: 'T', code: 'CSEAIML-3T', student_count: 60 },
      { class_name: 'CSEAIML', year: 3, section: 'F', code: 'CSEAIML-3F', student_count: 60 },
    ]);
    console.log('Created classes:', classes.length);

    // Rooms
    const rooms = await Room.insertMany([
      { name: 'S-202', code: 'S202', capacity: 70 },
      { name: 'N-206', code: 'N206', capacity: 70 },
      { name: 'N-202', code: 'N202', capacity: 70 },
    ]);
    console.log('Created rooms:', rooms.length);

    // Labs
    const labs = await Lab.insertMany([
      { name: 'NLP Lab', short_name: 'NLP Lab', code: 'N107', room_number: 'N-107', capacity: 60 },
      { name: 'DAT Lab', short_name: 'DAT Lab', code: 'N007', room_number: 'N-007', capacity: 60 },
    ]);
    console.log('Created labs:', labs.length);

    // Sample schedules (Jan-June 2026)
    const semesterStart = new Date('2026-01-01');
    const semesterEnd = new Date('2026-06-30');

    const createTime = (dateStr, h, m) => {
      const d = new Date(dateStr);
      d.setHours(h, m, 0, 0);
      return d;
    };

    const schedules = [
      { class: classes[0]._id, subject: subjects[3]._id, teacher: teachers[3]._id, room: rooms[0]._id, roomModel: 'Room', type: 'LECTURE', day_of_week: 'MON', start_time: createTime('2026-01-05', 9, 45), end_time: createTime('2026-01-05', 10, 35), semester_start: semesterStart, semester_end: semesterEnd },
      { class: classes[0]._id, subject: subjects[4]._id, teacher: teachers[4]._id, room: rooms[0]._id, roomModel: 'Room', type: 'LECTURE', day_of_week: 'MON', start_time: createTime('2026-01-05', 10, 35), end_time: createTime('2026-01-05', 11, 25), semester_start: semesterStart, semester_end: semesterEnd },
      { class: classes[0]._id, subject: subjects[0]._id, teacher: teachers[0]._id, room: labs[0]._id, roomModel: 'Lab', type: 'LAB', day_of_week: 'TUE', start_time: createTime('2026-01-06', 9, 45), end_time: createTime('2026-01-06', 11, 25), semester_start: semesterStart, semester_end: semesterEnd },
    ];

    await Schedule.insertMany(schedules);
    console.log('Created schedules:', schedules.length);

    console.log('Seed completed successfully!');
    console.log('\nLogin: admin@ips.academy / admin123');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seed();
