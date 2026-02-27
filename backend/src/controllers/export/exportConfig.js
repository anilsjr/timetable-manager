import Schedule from '../../models/Schedule.js';
import Class from '../../models/Class.js';

// Time slots configuration
export const timeSlots = [
  { start: '09:45', end: '10:35', label: '9:45 AM - 10:35 AM' },
  { start: '10:35', end: '11:25', label: '10:35 AM - 11:25 AM' },
  { start: 'BREAK', end: 'BREAK', label: 'BREAK' },
  { start: '11:30', end: '12:20', label: '11:30 AM - 12:20 PM' },
  { start: '12:20', end: '13:10', label: '12:20 PM - 1:10 PM' },
  { start: 'LUNCH', end: 'LUNCH', label: 'LUNCH' },
  { start: '13:40', end: '14:30', label: '1:40 PM - 2:30 PM' },
  { start: '14:30', end: '15:20', label: '2:30 PM - 3:20 PM' },
  { start: '15:20', end: '16:10', label: '3:20 PM - 4:10 PM' }
];

export const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const dayLabels = {
  'MON': 'Monday',
  'TUE': 'Tuesday',
  'WED': 'Wednesday',
  'THU': 'Thursday',
  'FRI': 'Friday',
  'SAT': 'Saturday'
};

// Helper function to get class timetable data
export async function getClassTimetableData(classId) {
  const classData = await Class.findById(classId);
  if (!classData) {
    throw new Error('Class not found');
  }

  const schedules = await Schedule.find({ class: classId })
    .populate('subject', 'full_name short_name code')
    .populate('lab', 'name short_name code')
    .populate('teacher', 'name short_abbr')
    .populate('room', 'name short_name code type')
    .lean();

  const timetableGrid = {};
  const regularSlots = timeSlots.filter(s => s.start !== 'BREAK' && s.start !== 'LUNCH');

  days.forEach(day => {
    timetableGrid[day] = {};
    timeSlots.forEach(slot => {
      if (slot.start === 'BREAK' || slot.start === 'LUNCH') {
        timetableGrid[day][slot.start] = { type: slot.start };
      } else {
        timetableGrid[day][slot.start] = null;
      }
    });
  });

  schedules.forEach(schedule => {
    const day = schedule.day_of_week;
    let startTime = null;
    if (schedule.start_time) {
      if (typeof schedule.start_time === 'string') {
        startTime = schedule.start_time;
      } else {
        const date = new Date(schedule.start_time);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        startTime = `${hours}:${minutes}`;
      }
    }

    let matchedSlot = null;
    if (timetableGrid[day] && startTime && timetableGrid[day][startTime] !== undefined) {
      matchedSlot = startTime;
    } else if (timetableGrid[day] && startTime) {
      const availableSlots = Object.keys(timetableGrid[day]).filter(s => s !== 'BREAK' && s !== 'LUNCH');
      matchedSlot = availableSlots.find(slot => {
        const [slotH, slotM] = slot.split(':').map(Number);
        const [schedH, schedM] = startTime.split(':').map(Number);
        return Math.abs((slotH * 60 + slotM) - (schedH * 60 + schedM)) <= 5;
      }) || null;
    }

    if (!matchedSlot || !timetableGrid[day]) return;

    const isLab = schedule.type === 'LAB';
    const labData = schedule.lab;
    const roomData = schedule.room;

    let subjectName, subjectCode, roomDisplay;
    if (isLab) {
      subjectName = labData?.name || roomData?.name || 'N/A';
      subjectCode = labData?.code || roomData?.code || '';
      roomDisplay = roomData?.code || roomData?.name || 'N/A';
    } else {
      subjectName = schedule.subject?.short_name || schedule.subject?.full_name || 'N/A';
      subjectCode = schedule.subject?.code || '';
      roomDisplay = roomData?.code || 'N/A';
    }

    const teacherName = schedule.teacher?.name || 'N/A';
    const teacherAbbr = schedule.teacher?.short_abbr || '';

    const cellData = {
      subject: subjectName,
      subjectCode,
      teacher: teacherName,
      teacherAbbr,
      room: roomDisplay,
      type: schedule.type || 'LECTURE',
      durationSlots: schedule.duration_slots || 1
    };

    timetableGrid[day][matchedSlot] = cellData;

    if (isLab) {
      const currentIdx = regularSlots.findIndex(s => s.start === matchedSlot);
      if (currentIdx >= 0 && currentIdx + 1 < regularSlots.length) {
        const nextSlotKey = regularSlots[currentIdx + 1].start;
        if (timetableGrid[day][nextSlotKey] === null) {
          timetableGrid[day][nextSlotKey] = { ...cellData, isLabContinuation: true };
        }
      }
    }
  });

  return {
    class: classData,
    timetable: timetableGrid
  };
}
