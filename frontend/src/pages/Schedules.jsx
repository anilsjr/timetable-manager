import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import ScheduleGrid from '../components/ScheduleGrid';
import FacultyAssignmentsTable from '../components/FacultyAssignmentsTable';
import AddScheduleModal from '../components/AddScheduleModal';
import * as scheduleApi from '../services/scheduleApi';
import * as classApi from '../services/classApi';
import * as facultyAssignmentsApi from '../services/facultyAssignmentsApi';
import { formatTime } from '../utils/dateHelpers';
import { isValidLabStartTime } from '../utils/labSlotHelpers';

export default function Schedules() {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [facultyAssignments, setFacultyAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState(null);
  const [editing, setEditing] = useState(null);
  const [slotLabWarning, setSlotLabWarning] = useState(null);

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
    fetchSchedulesForClass(selectedClassId);
    fetchFacultyForClass(selectedClassId);
  }, [selectedClassId, fetchSchedulesForClass, fetchFacultyForClass]);

  const refreshClassData = useCallback(() => {
    fetchSchedulesForClass(selectedClassId);
    fetchFacultyForClass(selectedClassId);
  }, [selectedClassId, fetchSchedulesForClass, fetchFacultyForClass]);

  const openAdd = (day, slot) => {
    setEditing(null);
    
    // Check if this slot can accommodate a lab
    const labValidation = isValidLabStartTime(slot.start);
    setSlotLabWarning(labValidation.valid ? null : labValidation.message);
    
    setModalInitial({
      classId: selectedClassId,
      subjectId: '',
      teacherId: '',
      type: 'LECTURE',
      day,
      startTime: slot.start,
      endTime: slot.end,
    });
    setModalOpen(true);
  };

  const openEdit = (sched) => {
    setSlotLabWarning(null); // Clear warning when editing
    const classId = typeof sched.class === 'object' ? sched.class._id : sched.class;
    const subjectId = typeof sched.subject === 'object' ? sched.subject._id : sched.subject;
    const teacherId = typeof sched.teacher === 'object' ? sched.teacher._id : sched.teacher;
    const labId = sched.roomModel === 'Lab' && sched.room
      ? (typeof sched.room === 'object' ? sched.room._id : sched.room)
      : '';
    setEditing(sched);
    setModalInitial({
      classId,
      subjectId,
      teacherId,
      labId,
      type: sched.type || 'LECTURE',
      day: sched.day_of_week || 'MON',
      startTime: sched.start_time ? formatTime(sched.start_time) : '09:45',
      endTime: sched.end_time ? formatTime(sched.end_time) : '10:35',
    });
    setModalOpen(true);
  };

  const handleCellClick = (day, slot, sched) => {
    if (slot.type !== 'slot') return;
    if (sched) openEdit(sched);
    else openAdd(day, slot);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-left items-start sm:items-center gap-4 mb-4">
        <h2 className="text-xl font-bold text-gray-800">Schedules</h2>
        <div className="flex items-center gap-">
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

      <AddScheduleModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSlotLabWarning(null);
        }}
        initialValues={modalInitial}
        editing={editing}
        classes={classes}
        onSuccess={refreshClassData}
        slotLabWarning={slotLabWarning}
      />
    </div>
  );
}
