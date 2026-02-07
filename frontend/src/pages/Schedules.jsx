import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import ModalForm from '../components/ModalForm';
import ConfirmDialog from '../components/ConfirmDialog';
import ScheduleGrid from '../components/ScheduleGrid';
import FacultyAssignmentsTable from '../components/FacultyAssignmentsTable';
import * as scheduleApi from '../services/scheduleApi';
import * as classApi from '../services/classApi';
import * as facultyAssignmentsApi from '../services/facultyAssignmentsApi';
import * as subjectApi from '../services/subjectApi';
import * as teacherApi from '../services/teacherApi';
import * as labApi from '../services/labApi';
import * as roomApi from '../services/roomApi';
import { DAYS, formatTime } from '../utils/dateHelpers';

const schema = z.object({
  class: z.string().min(1, 'Class required'),
  subject: z.string().min(1, 'Subject required'),
  teacher: z.string().min(1, 'Teacher required'),
  room: z.string().min(1, 'Room required'),
  roomModel: z.enum(['Room', 'Lab']),
  type: z.enum(['LECTURE', 'LAB']),
  day_of_week: z.enum(DAYS),
  start_time: z.string().min(1, 'Start time required'),
  end_time: z.string().min(1, 'End time required'),
  semester_start: z.string().min(1, 'Semester start required'),
  semester_end: z.string().min(1, 'Semester end required'),
});

export default function Schedules() {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [facultyAssignments, setFacultyAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [labs, setLabs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [conflictError, setConflictError] = useState(null);

  const getSemesterDefaults = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const start = month < 6 ? `${year}-01-01` : `${year}-07-01`;
    const end = month < 6 ? `${year}-06-30` : `${year}-12-31`;
    return { semester_start: start, semester_end: end };
  };

  const fetchClasses = useCallback(async () => {
    try {
      const res = await classApi.getClasses({ page: 1, limit: 200 });
      setClasses(res.data || []);
    } catch {
      toast.error('Failed to fetch classes');
    }
  }, []);

  const fetchSchedulesForClass = useCallback(async (classId) => {
    if (!classId) {
      setSchedules([]);
      return;
    }
    setLoading(true);
    try {
      const data = await scheduleApi.getSchedulesByClass(classId);
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch timetable');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFacultyForClass = useCallback(async (classId) => {
    if (!classId) {
      setFacultyAssignments([]);
      return;
    }
    setFacultyLoading(true);
    try {
      const data = await facultyAssignmentsApi.getFacultyAssignmentsByClass(classId);
      setFacultyAssignments(Array.isArray(data) ? data : []);
    } catch {
      setFacultyAssignments([]);
    } finally {
      setFacultyLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    Promise.all([
      subjectApi.getSubjects({ page: 1, limit: 200 }).then((r) => setSubjects(r.data || [])),
      teacherApi.getTeachers({ page: 1, limit: 200 }).then((r) => setTeachers(r.data || [])),
      roomApi.getRooms({ page: 1, limit: 200 }).then((r) => setRooms(r.data || [])),
      labApi.getLabs({ page: 1, limit: 200 }).then((r) => setLabs(r.data || [])),
    ]).catch(() => {});
  }, []);

  useEffect(() => {
    fetchSchedulesForClass(selectedClassId);
    fetchFacultyForClass(selectedClassId);
  }, [selectedClassId, fetchSchedulesForClass, fetchFacultyForClass]);

  const refreshClassData = useCallback(() => {
    fetchSchedulesForClass(selectedClassId);
    fetchFacultyForClass(selectedClassId);
  }, [selectedClassId, fetchSchedulesForClass, fetchFacultyForClass]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      class: '',
      subject: '',
      teacher: '',
      room: '',
      roomModel: 'Room',
      type: 'LECTURE',
      day_of_week: 'MON',
      start_time: '09:45',
      end_time: '10:35',
      ...getSemesterDefaults(),
    },
  });

  const roomModel = watch('roomModel');
  const roomOptions = roomModel === 'Room' ? rooms : labs;

  const toISO = (dateStr, timeStr) => {
    const [h, m] = (timeStr || '09:00').split(':').map(Number);
    const d = new Date(dateStr || new Date().toISOString().slice(0, 10));
    d.setHours(h || 0, m || 0, 0, 0);
    return d.toISOString();
  };

  const openAdd = (day, slot) => {
    setConflictError(null);
    setEditing(null);
    reset({
      class: selectedClassId,
      subject: '',
      teacher: '',
      room: '',
      roomModel: 'Room',
      type: 'LECTURE',
      day_of_week: day,
      start_time: slot.start,
      end_time: slot.end,
      ...getSemesterDefaults(),
    });
    setModalOpen(true);
  };

  const openEdit = (sched) => {
    setConflictError(null);
    setEditing(sched);
    const startStr = sched.start_time ? formatTime(sched.start_time) : '09:45';
    const endStr = sched.end_time ? formatTime(sched.end_time) : '10:35';
    const classId = typeof sched.class === 'object' ? sched.class._id : sched.class;
    const subjectId = typeof sched.subject === 'object' ? sched.subject._id : sched.subject;
    const teacherId = typeof sched.teacher === 'object' ? sched.teacher._id : sched.teacher;
    reset({
      class: classId,
      subject: subjectId,
      teacher: teacherId,
      room: sched.room?._id || sched.room,
      roomModel: sched.roomModel || 'Room',
      type: sched.type || 'LECTURE',
      day_of_week: sched.day_of_week || 'MON',
      start_time: startStr,
      end_time: endStr,
      semester_start: sched.semester_start ? new Date(sched.semester_start).toISOString().slice(0, 10) : getSemesterDefaults().semester_start,
      semester_end: sched.semester_end ? new Date(sched.semester_end).toISOString().slice(0, 10) : getSemesterDefaults().semester_end,
    });
    setModalOpen(true);
  };

  const handleCellClick = (day, slot, sched) => {
    if (slot.type !== 'slot') return;
    if (sched) openEdit(sched);
    else openAdd(day, slot);
  };

  const onSubmit = async (values) => {
    setConflictError(null);
    try {
      const payload = {
        class: values.class,
        subject: values.subject,
        teacher: values.teacher,
        room: values.room,
        roomModel: values.roomModel,
        type: values.type,
        day_of_week: values.day_of_week,
        start_time: toISO(values.semester_start, values.start_time),
        end_time: toISO(values.semester_start, values.end_time),
        semester_start: new Date(values.semester_start).toISOString(),
        semester_end: new Date(values.semester_end).toISOString(),
      };
      if (editing) {
        await scheduleApi.updateSchedule(editing._id, payload);
        toast.success('Schedule updated');
      } else {
        await scheduleApi.createSchedule(payload);
        toast.success('Schedule added');
      }
      setModalOpen(false);
      refreshClassData();
    } catch (err) {
      const conflict = err.response?.data?.conflict;
      if (conflict) {
        setConflictError(`${conflict.type}: ${conflict.message}`);
        toast.error(conflict.message);
      } else {
        toast.error(err.response?.data?.error || 'Failed to save');
      }
    }
  };

  const openDelete = (sched) => {
    setModalOpen(false);
    setDeleteTarget(sched);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await scheduleApi.deleteSchedule(deleteTarget._id);
      toast.success('Schedule deleted');
      setDeleteTarget(null);
      refreshClassData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-xl font-bold text-gray-800">Schedules</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Select Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[180px]"
          >
            <option value="">Choose class...</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.code || `${c.class_name}-${c.year}${c.section}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedClassId ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8 text-center text-gray-500">
          Select a class to view and manage the timetable.
        </div>
      ) : (
        <>
          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8 text-center text-gray-500">
              Loading timetable…
            </div>
          ) : (
            <ScheduleGrid schedules={schedules} onCellClick={handleCellClick} />
          )}

          <div className="mt-8">
            <FacultyAssignmentsTable data={facultyAssignments} loading={facultyLoading} />
          </div>
        </>
      )}

      <ModalForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Schedule' : 'Add Schedule'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {conflictError && (
            <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{conflictError}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select {...register('class')} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" disabled={!!editing}>
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.code || `${c.class_name}-${c.year}${c.section}`}</option>
                ))}
              </select>
              {errors.class && <p className="text-red-500 text-sm mt-1">{errors.class.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select {...register('subject')} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>{s.short_name} ({s.code})</option>
                ))}
              </select>
              {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
            <select {...register('teacher')} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
              <option value="">Select teacher</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>{t.name} ({t.short_abbr})</option>
              ))}
            </select>
            {errors.teacher && <p className="text-red-500 text-sm mt-1">{errors.teacher.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
              <select {...register('roomModel')} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                <option value="Room">Room</option>
                <option value="Lab">Lab</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room / Lab</label>
              <select {...register('room')} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                <option value="">Select {roomModel}</option>
                {roomOptions.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name || r.code} (cap: {r.capacity})
                  </option>
                ))}
              </select>
              {errors.room && <p className="text-red-500 text-sm mt-1">{errors.room.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select {...register('type')} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                <option value="LECTURE">Lecture</option>
                <option value="LAB">Lab</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
              <select {...register('day_of_week')} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input {...register('start_time')} type="time" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" />
              {errors.start_time && <p className="text-red-500 text-sm mt-1">{errors.start_time.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input {...register('end_time')} type="time" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" />
              {errors.end_time && <p className="text-red-500 text-sm mt-1">{errors.end_time.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester Start</label>
              <input {...register('semester_start')} type="date" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" />
              {errors.semester_start && <p className="text-red-500 text-sm mt-1">{errors.semester_start.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester End</label>
              <input {...register('semester_end')} type="date" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" />
              {errors.semester_end && <p className="text-red-500 text-sm mt-1">{errors.semester_end.message}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-50">
              Cancel
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => openDelete(editing)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            )}
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </ModalForm>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Schedule"
        message="Are you sure you want to delete this schedule?"
        loading={deleteLoading}
      />
    </div>
  );
}
