import Schedule from '../models/Schedule.js';
import Subject from '../models/Subject.js';

/**
 * Get faculty assignments for a class: distinct subjects with faculty and coordinator.
 * Data derived from schedules for the class + subject coordinator.
 */
export async function getFacultyAssignmentsByClass(classId) {
  const schedules = await Schedule.find({ class: classId })
    .populate('subject', 'code full_name short_name coordinator')
    .populate('teacher', 'name short_abbr')
    .lean();

  const bySubjectId = new Map();
  for (const s of schedules) {
    const sub = s.subject;
    if (!sub) continue;
    const id = sub._id.toString();
    if (!bySubjectId.has(id)) {
      bySubjectId.set(id, {
        subjectId: sub._id,
        subjectCode: sub.code,
        subjectName: sub.full_name || sub.short_name,
        facultyNames: new Set(),
        coordinatorId: sub.coordinator?.toString?.(),
      });
    }
    const entry = bySubjectId.get(id);
    if (s.teacher?.name) entry.facultyNames.add(s.teacher.name);
  }

  const subjectIds = [...bySubjectId.values()].map((e) => e.subjectId);
  const subjectsWithCoordinator = await Subject.find({ _id: { $in: subjectIds } })
    .populate('coordinator', 'name')
    .lean();
  const coordinatorBySubject = new Map(
    subjectsWithCoordinator.map((s) => [s._id.toString(), s.coordinator?.name])
  );

  return Array.from(bySubjectId.entries()).map(([id, entry]) => ({
    classId,
    subjectCode: entry.subjectCode,
    subjectName: entry.subjectName,
    facultyName: entry.facultyNames.size ? [...entry.facultyNames].join(', ') : null,
    coordinatorName: coordinatorBySubject.get(id) || null,
  }));
}
