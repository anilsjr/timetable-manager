import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import ModalForm from '../components/ModalForm';
import ConfirmDialog from '../components/ConfirmDialog';
import * as scheduleApi from '../services/scheduleApi';
import * as classApi from '../services/classApi';
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

const columns = [
  { key: 'class', label: 'Class', render: (v) => v?.code || v?.class_name || v },
  { key: 'subject', label: 'Subject', render: (v) => v?.short_name || v?.code || v },
  { key: 'teacher', label: 'Teacher', render: (v) => v?.short_abbr || v?.name || v },
  { key: 'day_of_week', label: 'Day' },
  { key: 'start_time', label: 'Start', render: (v) => formatTime(v) },
  { key: 'end_time', label: 'End', render: (v) => formatTime(v) },
  { key: 'type', label: 'Type' },
];

export default function Schedules() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [conflictError, setConflictError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [labs, setLabs] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await scheduleApi.getSchedules({ page, limit, search });
      setData(res.data);
      setTotal(res.total);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    Promise.all([
      classApi.getClasses({ page: 1, limit: 200 }).then((r) => setClasses(r.data || [])),
      subjectApi.getSubjects({ page: 1, limit: 200 }).then((r) => setSubjects(r.data || [])),
      teacherApi.getTeachers({ page: 1, limit: 200 }).then((r) => setTeachers(r.data || [])),
      roomApi.getRooms({ page: 1, limit: 200 }).then((r) => setRooms(r.data || [])),
      labApi.getLabs({ page: 1, limit: 200 }).then((r) => setLabs(r.data || [])),
    ]).catch(() => {});
  }, []);

  const handleSearch = useCallback((val) => {
    setSearch(val);
    setPage(1);
  }, []);

  const getSemesterDefaults = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const start = month < 6 ? `${year}-01-01` : `${year}-07-01`;
    const end = month < 6 ? `${year}-06-30` : `${year}-12-31`;
    return { semester_start: start, semester_end: end };
  };

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

  const openCreate = () => {
    setConflictError(null);
    setEditing(null);
    reset({
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
    });
    setModalOpen(true);
  };

  const toISO = (dateStr, timeStr) => {
    const [h, m] = (timeStr || '09:00').split(':').map(Number);
    const d = new Date(dateStr || new Date().toISOString().slice(0, 10));
    d.setHours(h || 0, m || 0, 0, 0);
    return d.toISOString();
  };

  const openEdit = (row) => {
    setConflictError(null);
    setEditing(row);
    const startStr = row.start_time ? formatTime(row.start_time) : '09:45';
    const endStr = row.end_time ? formatTime(row.end_time) : '10:35';
    const classId = typeof row.class === 'object' ? row.class._id : row.class;
    const subjectId = typeof row.subject === 'object' ? row.subject._id : row.subject;
    const teacherId = typeof row.teacher === 'object' ? row.teacher._id : row.teacher;
    reset({
      class: classId,
      subject: subjectId,
      teacher: teacherId,
      room: row.room?._id || row.room,
      roomModel: row.roomModel || 'Room',
      type: row.type || 'LECTURE',
      day_of_week: row.day_of_week || 'MON',
      start_time: startStr,
      end_time: endStr,
      semester_start: row.semester_start ? new Date(row.semester_start).toISOString().slice(0, 10) : getSemesterDefaults().semester_start,
      semester_end: row.semester_end ? new Date(row.semester_end).toISOString().slice(0, 10) : getSemesterDefaults().semester_end,
    });
    setModalOpen(true);
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
        toast.success('Schedule created');
      }
      setModalOpen(false);
      fetchData();
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await scheduleApi.deleteSchedule(deleteTarget._id);
      toast.success('Schedule deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleteLoading(false);
    }
  };

  const tableData = data.map((row) => ({
    ...row,
    _actions: (
      <div className="flex gap-2">
        <button
          onClick={() => openEdit(row)}
          className="px-2 py-1 bg-amber-500 text-white text-xs rounded hover:bg-amber-600"
        >
          Edit
        </button>
        <button
          onClick={() => setDeleteTarget(row)}
          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    ),
  }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-xl font-bold text-gray-800">Schedules</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <SearchBar value={search} onChange={handleSearch} placeholder="Search by day.." />
          <button
            onClick={openCreate}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 shrink-0"
            title="Add Schedule"
          >
            +
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={tableData} loading={loading} emptyMessage="No schedules" />

      <Pagination
        page={page}
        totalPages={Math.ceil(total / limit)}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
      />

      <ModalForm open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Schedule' : 'Add Schedule'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {conflictError && (
            <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{conflictError}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select {...register('class')} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
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
