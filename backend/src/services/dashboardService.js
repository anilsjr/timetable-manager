import Subject from '../models/Subject.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import Lab from '../models/Lab.js';
import Schedule from '../models/Schedule.js';

export async function getDashboardStats() {
  const [subjectsCount, teachersCount, classesCount, labsCount, schedulesCount] = await Promise.all([
    Subject.countDocuments(),
    Teacher.countDocuments(),
    Class.countDocuments(),
    Lab.countDocuments(),
    Schedule.countDocuments(),
  ]);

  return {
    subjects: subjectsCount,
    teachers: teachersCount,
    classes: classesCount,
    labs: labsCount,
    sessions: schedulesCount,
  };
}

export async function getSessionsPerWeek() {
  const result = await Schedule.aggregate([
    { $group: { _id: '$day_of_week', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const order = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return order.map((day) => ({
    day,
    count: result.find((r) => r._id === day)?.count ?? 0,
  }));
}

export async function getSubjectDistribution() {
  const result = await Schedule.aggregate([
    { $group: { _id: '$subject', count: { $sum: 1 } } },
    { $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 'subject' } },
    { $unwind: '$subject' },
    { $project: { name: '$subject.short_name', count: 1 } },
  ]);
  return result.map((r) => ({ name: r.name || 'Unknown', value: r.count }));
}

export async function getTeacherWorkload() {
  const result = await Schedule.aggregate([
    { $group: { _id: '$teacher', count: { $sum: 1 } } },
    { $lookup: { from: 'teachers', localField: '_id', foreignField: '_id', as: 'teacher' } },
    { $unwind: '$teacher' },
    { $project: { name: '$teacher.short_abbr', count: 1 } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
  return result.map((r) => ({ name: r.name || 'Unknown', sessions: r.count }));
}
