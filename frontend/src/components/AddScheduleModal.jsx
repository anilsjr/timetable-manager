import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import ModalForm from './ModalForm';
import ConfirmDialog from './ConfirmDialog';
import * as classApi from '../services/classApi';
import * as scheduleApi from '../services/scheduleApi';
import * as teacherApi from '../services/teacherApi';
import { DAYS, getDayLabel } from '../utils/dateHelpers';

const schema = z.object({
  classId: z.string().min(1, 'Class required'),
  subjectId: z.string().min(1, 'Subject required'),
  teacherId: z.string().min(1, 'Teacher required'),
  type: z.enum(['LECTURE', 'LAB']),
  day: z.enum(DAYS),
  startTime: z.string().min(1, 'Start time required'),
  endTime: z.string().min(1, 'End time required'),
});

export default function AddScheduleModal({
  open,
  onClose,
  initialValues,
  editing = null,
  classes = [],
  onSuccess,
}) {
  const [classSubjects, setClassSubjects] = useState([]);
  const [teachersBySubject, setTeachersBySubject] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [teachersLoading, setTeachersLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      classId: '',
      subjectId: '',
      teacherId: '',
      type: 'LECTURE',
      day: 'MON',
      startTime: '09:45',
      endTime: '10:35',
    },
  });

  const type = watch('type');
  const classId = watch('classId');
  const subjectId = watch('subjectId');

  const subjectEnabled = !!type;
  const teacherEnabled = !!subjectId;
  const currentClassId = watch('classId');
  const displayClasses = currentClassId
    ? classes.filter((c) => c._id === currentClassId)
    : classes;
  const classOptions = displayClasses.length ? displayClasses : classes;

  useEffect(() => {
    if (!open) return;
    if (initialValues) {
      reset({
        classId: initialValues.classId ?? '',
        subjectId: initialValues.subjectId ?? '',
        teacherId: initialValues.teacherId ?? '',
        type: initialValues.type ?? 'LECTURE',
        day: initialValues.day ?? 'MON',
        startTime: initialValues.startTime ?? '09:45',
        endTime: initialValues.endTime ?? '10:35',
      });
    }
  }, [open, initialValues, reset]);

  useEffect(() => {
    if (!classId || !subjectEnabled) {
      setClassSubjects([]);
      setValue('subjectId', '');
      setValue('teacherId', '');
      setTeachersBySubject([]);
      return;
    }
    setSubjectsLoading(true);
    classApi
      .getClassSubjects(classId)
      .then((list) => setClassSubjects(Array.isArray(list) ? list : []))
      .catch(() => {
        toast.error('Failed to load subjects');
        setClassSubjects([]);
      })
      .finally(() => setSubjectsLoading(false));
  }, [classId, subjectEnabled, setValue]);

  useEffect(() => {
    if (!subjectId || !teacherEnabled) {
      setTeachersBySubject([]);
      setValue('teacherId', '');
      return;
    }
    setTeachersLoading(true);
    teacherApi
      .getTeachersBySubject(subjectId)
      .then((list) => setTeachersBySubject(Array.isArray(list) ? list : []))
      .catch(() => {
        toast.error('Failed to load teachers');
        setTeachersBySubject([]);
      })
      .finally(() => setTeachersLoading(false));
  }, [subjectId, teacherEnabled, setValue]);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const payload = (values) => ({
    classId: values.classId,
    subjectId: values.subjectId,
    teacherId: values.teacherId,
    day: values.day,
    startTime: values.startTime,
    endTime: values.endTime,
    type: values.type,
  });

  const onSubmit = async (values) => {
    if (!values.subjectId || !values.teacherId) {
      toast.error('Please select subject and teacher');
      return;
    }
    try {
      if (editing) {
        await scheduleApi.updateSchedule(editing._id, payload(values));
        toast.success('Schedule updated');
      } else {
        await scheduleApi.createSchedule(payload(values));
        toast.success('Schedule added');
      }
      onClose();
      onSuccess?.();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await scheduleApi.deleteSchedule(deleteTarget._id);
      toast.success('Schedule deleted');
      setDeleteTarget(null);
      onClose();
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
    <ModalForm open={open} onClose={onClose} title={editing ? 'Edit Schedule' : 'Add Schedule'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              {...register('classId')}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-gray-100"
            >
              {classOptions.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code || `${c.class_name}-${c.year}${c.section}`}
                </option>
              ))}
            </select>
            {errors.classId && (
              <p className="text-red-500 text-sm mt-1">{errors.classId.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
            <select
              {...register('day')}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-gray-100"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {getDayLabel(d)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              {...register('startTime')}
              type="time"
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              {...register('endTime')}
              type="time"
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="radio" {...register('type')} value="LECTURE" className="rounded" />
              <span>Subject</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="radio" {...register('type')} value="LAB" className="rounded" />
              <span>Lab</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select
            {...register('subjectId')}
            disabled={!subjectEnabled || subjectsLoading}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select subject</option>
            {classSubjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.short_name} ({s.code})
              </option>
            ))}
          </select>
          {errors.subjectId && (
            <p className="text-red-500 text-sm mt-1">{errors.subjectId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
          <select
            {...register('teacherId')}
            disabled={!teacherEnabled || teachersLoading}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select teacher</option>
            {teachersBySubject.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} ({t.short_abbr})
              </option>
            ))}
          </select>
          {errors.teacherId && (
            <p className="text-red-500 text-sm mt-1">{errors.teacherId.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => setDeleteTarget(editing)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
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
    </>
  );
}
