import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import ScheduleGrid from '../components/ScheduleGrid';
import FacultyAssignmentsTable from '../components/FacultyAssignmentsTable';
import AddScheduleModal from '../components/AddScheduleModal';
import * as scheduleApi from '../services/scheduleApi';
import * as classApi from '../services/classApi';
import * as facultyAssignmentsApi from '../services/facultyAssignmentsApi';
import * as exportApi from '../services/exportApi';
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
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportDropdownOpen && !event.target.closest('.relative')) {
        setExportDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [exportDropdownOpen]);

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
      roomId: '',
      type: 'LECTURE',
      day,
      startTime: slot.start,
      endTime: slot.end,
    });
    setModalOpen(true);
  };

  const openEdit = (sched) => {
    console.log('openEdit called with schedule:', sched);
    setSlotLabWarning(null); // Clear warning when editing
    const classId = typeof sched.class === 'object' ? sched.class._id : sched.class;
    const subjectId = sched.subject 
      ? (typeof sched.subject === 'object' ? sched.subject._id : sched.subject)
      : '';
    const teacherId = sched.teacher
      ? (typeof sched.teacher === 'object' ? sched.teacher._id : sched.teacher)
      : '';
    const labId = sched.roomModel === 'Lab' && sched.room
      ? (typeof sched.room === 'object' ? sched.room._id : sched.room)
      : '';
    const roomId = sched.roomModel === 'Room' && sched.room
      ? (typeof sched.room === 'object' ? sched.room._id : sched.room)
      : '';
    console.log('Modal values:', { classId, subjectId, teacherId, labId, roomId, type: sched.type });
    setEditing(sched);
    setModalInitial({
      classId,
      subjectId,
      teacherId,
      labId,
      roomId,
      type: sched.type || 'LECTURE',
      day: sched.day_of_week || 'MON',
      startTime: sched.start_time ? formatTime(sched.start_time) : '09:45',
      endTime: sched.end_time ? formatTime(sched.end_time) : '10:35',
    });
    setModalOpen(true);
  };

  const handleCellClick = (day, slot, sched) => {
    console.log('handleCellClick:', { day, slot: slot.start, hasSched: !!sched, slotType: slot.type });
    if (slot.type !== 'slot') return;
    if (sched) openEdit(sched);
    else openAdd(day, slot);
  };

  const handleExport = async (format) => {
    if (!selectedClassId) {
      toast.error('Please select a class to export');
      return;
    }

    setExporting(true);
    setExportDropdownOpen(false);

    try {
      await exportApi.exportTimetable(selectedClassId, format);
      toast.success(`Timetable exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.error || 'Failed to export timetable');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-left items-start sm:items-center gap-4 mb-4">
        <h2 className="text-xl font-bold text-gray-800">Schedules</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
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
          
          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              disabled={!selectedClassId || exporting}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                !selectedClassId || exporting
                  ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {exporting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
            
            {exportDropdownOpen && !exporting && selectedClassId && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export as Excel (.xlsx)
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                >
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Export as PDF (.pdf)
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                >
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Export as JSON (.json)
                </button>
              </div>
            )}
          </div>
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
