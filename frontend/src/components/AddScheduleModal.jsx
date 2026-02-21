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

const schema = z
  .object({
    classId: z.string().min(1, 'Class required'),
    subjectId: z.string(),
    teacherId: z.string(),
    labId: z.string(),
    type: z.enum(['LECTURE', 'LAB']),
    day: z.enum(DAYS),
    startTime: z.string().min(1, 'Start time required'),
    endTime: z.string().min(1, 'End time required'),
  })
  .refine((data) => data.type !== 'LECTURE' || (data.subjectId && data.subjectId.length > 0), {
    message: 'Subject required',
    path: ['subjectId'],
  })
  .refine((data) => data.type !== 'LECTURE' || (data.teacherId && data.teacherId.length > 0), {
    message: 'Teacher required',
    path: ['teacherId'],
  })
  .refine((data) => data.type !== 'LAB' || (data.labId && data.labId.length > 0), {
    message: 'Lab required',
    path: ['labId'],
  });

export default function AddScheduleModal({
  open,
  onClose,
  initialValues,
  editing = null,
  classes = [],
  onSuccess,
  slotLabWarning = null,
}) {
  const [classSubjects, setClassSubjects] = useState([]);
  const [classLabs, setClassLabs] = useState([]);
  const [teachersBySubject, setTeachersBySubject] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [labsLoading, setLabsLoading] = useState(false);
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
      labId: '',
      type: 'LECTURE',
      day: 'MON',
      startTime: '09:45',
      endTime: '10:35',
    },
  });

  const type = watch('type');
  const classId = watch('classId');
  const subjectId = watch('subjectId');
  const day = watch('day');
  const startTime = watch('startTime');

  const isSubjectType = type === 'LECTURE';
  const subjectEnabled = isSubjectType;
  const teacherEnabled = isSubjectType && !!subjectId;
  const currentClassId = watch('classId');
  const displayClasses = currentClassId
    ? classes.filter((c) => c._id === currentClassId)
    : classes;
  const classOptions = displayClasses.length ? displayClasses : classes;

  // Auto-calculate end time for labs (2 continuous slots = 100 minutes)
  useEffect(() => {
    if (type === 'LAB' && startTime) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + 100;
      const endHours = Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;
      const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
      setValue('endTime', endTimeStr);
    }
  }, [type, startTime, setValue]);

  useEffect(() => {
    if (!open) return;
    if (initialValues) {
      reset({
        classId: initialValues.classId ?? '',
        subjectId: initialValues.subjectId ?? '',
        teacherId: initialValues.teacherId ?? '',
        labId: initialValues.labId ?? '',
        type: initialValues.type ?? 'LECTURE',
        day: initialValues.day ?? 'MON',
        startTime: initialValues.startTime ?? '09:45',
        endTime: initialValues.endTime ?? '10:35',
      });
    }
  }, [open, initialValues, reset]);

  useEffect(() => {
    if (!classId || !isSubjectType) {
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
  }, [classId, isSubjectType, setValue]);

  const isLabType = type === 'LAB';
  useEffect(() => {
    if (!classId || !isLabType) {
      setClassLabs([]);
      setValue('labId', '');
      return;
    }
    setLabsLoading(true);
    classApi
      .getClassLabs(classId)
      .then((list) => setClassLabs(Array.isArray(list) ? list : []))
      .catch(() => {
        toast.error('Failed to load labs');
        setClassLabs([]);
      })
      .finally(() => setLabsLoading(false));
  }, [classId, isLabType, setValue]);

  useEffect(() => {
    if (!subjectId || !teacherEnabled) {
      setTeachersBySubject([]);
      setValue('teacherId', '');
      return;
    }
    setTeachersLoading(true);
    const params = { day, startTime };
    if (editing?._id) params.excludeScheduleId = editing._id;
    teacherApi
      .getTeachersBySubject(subjectId, params)
      .then((list) => setTeachersBySubject(Array.isArray(list) ? list : []))
      .catch(() => {
        toast.error('Failed to load teachers');
        setTeachersBySubject([]);
      })
      .finally(() => setTeachersLoading(false));
  }, [subjectId, teacherEnabled, day, startTime, editing, setValue]);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const payload = (values) => {
    const p = {
      classId: values.classId,
      day: values.day,
      startTime: values.startTime,
      endTime: values.endTime,
      type: values.type,
    };
    if (values.type === 'LECTURE' && values.subjectId && values.teacherId) {
      p.subjectId = values.subjectId;
      p.teacherId = values.teacherId;
    }
    if (values.type === 'LAB' && values.labId) {
      p.room = values.labId;
      p.roomModel = 'Lab';
    }
    return p;
  };

  const onSubmit = async (values) => {
    if (values.type === 'LECTURE' && (!values.subjectId || !values.teacherId)) {
      toast.error('Please select subject and teacher');
      return;
    }
    if (values.type === 'LAB' && !values.labId) {
      toast.error('Please select a lab');
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
            {startTime && (
              <p className="text-xs text-gray-500 mt-1">
                Selected: {startTime}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              {...register('endTime')}
              type="time"
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100"
            />
            {type === 'LAB' && (
              <p className="text-xs text-blue-600 mt-1">
                Auto-calculated (2 slots)
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          {editing ? (
            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-700">
              {type === 'LAB' ? 'Lab (2 slots)' : 'Subject'}
            </div>
          ) : (
            <>
              <div className="flex gap-4">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="radio" {...register('type')} value="LECTURE" className="rounded" />
                  <span>Subject</span>
                </label>
                <label className={`inline-flex items-center gap-2 ${slotLabWarning ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                  <input 
                    type="radio" 
                    {...register('type')} 
                    value="LAB" 
                    className="rounded" 
                    disabled={!!slotLabWarning}
                    title={slotLabWarning || 'Lab session (2 continuous slots)'}
                  />
                  <span>Lab (2 slots)</span>
                </label>
              </div>
              {type === 'LAB' && !slotLabWarning && (
                <p className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                  ℹ️ Lab sessions occupy 2 continuous slots (100 minutes total). End time is auto-calculated.
                </p>
              )}
              {slotLabWarning && (
                <div className="mt-2 text-sm text-amber-700 bg-amber-50 p-3 rounded border border-amber-300">
                  <p className="font-medium mb-1">⚠️ Cannot schedule lab at this time</p>
                  <p className="text-xs">{slotLabWarning}</p>
                  <p className="text-xs mt-1">Valid lab times: 09:45, 11:30, 13:40, 14:30</p>
                </div>
              )}
            </>
          )}
        </div>

        {isLabType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lab</label>
            <select
              {...register('labId')}
              disabled={labsLoading}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select lab</option>
              {classLabs.map((lab) => (
                <option key={lab._id} value={lab._id}>
                  {lab.short_name || lab.name} ({lab.code})
                </option>
              ))}
            </select>
            {classLabs.length === 0 && !labsLoading && (
              <p className="text-amber-600 text-sm mt-1">No labs assigned to this class. Assign labs in Class settings.</p>
            )}
            {errors.labId && (
              <p className="text-red-500 text-sm mt-1">{errors.labId.message}</p>
            )}
          </div>
        )}

        {isSubjectType && (
          <>
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
              {subjectId && teachersBySubject.length === 0 && !teachersLoading && (
                <p className="text-amber-600 text-sm mt-1">No teachers available for this slot. All teachers who can teach this subject are already assigned at this day and time.</p>
              )}
              {errors.teacherId && (
                <p className="text-red-500 text-sm mt-1">{errors.teacherId.message}</p>
              )}
            </div>
          </>
        )}

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
            disabled={
              isSubmitting ||
              (isSubjectType && (teachersBySubject.length === 0 || !watch('teacherId')))
            }
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
