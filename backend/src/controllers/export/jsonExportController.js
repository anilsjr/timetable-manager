import { timeSlots, days, dayLabels } from './exportConfig.js';

// Generate JSON export (v2.0 normalized format)
export function generateJSON(classData) {
  const regularSlots = timeSlots.filter(s => s.start !== 'BREAK' && s.start !== 'LUNCH');

  // Build period ID map: start time -> period id
  const periodMap = {};
  regularSlots.forEach((slot, i) => {
    const id = `P${i + 1}`;
    periodMap[slot.start] = id;
  });

  // Collect unique teachers and subjects from the timetable grid
  const teachers = {};
  const subjects = {};

  Object.values(classData.timetable).forEach(daySchedule => {
    Object.values(daySchedule).forEach(cell => {
      if (!cell || cell.type === 'BREAK' || cell.type === 'LUNCH' || cell.isLabContinuation) return;
      if (!cell.subject) return;

      // Collect subject
      const subCode = cell.subjectCode;
      if (subCode && !subjects[subCode]) {
        subjects[subCode] = {
          name: cell.subject,
          type: cell.type === 'LAB' ? 'LAB' : 'LECTURE'
        };
      }

      // Collect teacher
      const abbr = cell.teacherAbbr;
      if (abbr && cell.teacher && cell.teacher !== 'N/A' && !teachers[abbr]) {
        teachers[abbr] = { name: cell.teacher };
      }
    });
  });

  // Build periods array
  const periods = regularSlots.map((slot, i) => ({
    id: `P${i + 1}`,
    start: slot.start,
    end: slot.end
  }));

  // Build breaks array by detecting BREAK/LUNCH positions
  const breaks = [];
  timeSlots.forEach((slot, i) => {
    if (slot.start === 'BREAK' || slot.start === 'LUNCH') {
      const prevSlot = timeSlots[i - 1];
      const nextSlot = timeSlots[i + 1];
      if (prevSlot && nextSlot && prevSlot.start !== 'BREAK' && prevSlot.start !== 'LUNCH') {
        const prevPeriodId = periodMap[prevSlot.start];
        const [endH, endM] = prevSlot.end.split(':').map(Number);
        const [startH, startM] = nextSlot.start.split(':').map(Number);
        const duration = (startH * 60 + startM) - (endH * 60 + endM);
        breaks.push({
          after: prevPeriodId,
          duration,
          label: slot.start === 'LUNCH' ? 'Lunch' : 'Break'
        });
      }
    }
  });

  // Build timetable: day code -> array of entries
  const timetable = {};
  days.forEach(dayCode => {
    const daySchedule = classData.timetable[dayCode];
    const entries = [];

    Object.entries(daySchedule).forEach(([slotTime, cell]) => {
      if (!cell || cell.type === 'BREAK' || cell.type === 'LUNCH' || cell.isLabContinuation) return;
      if (!cell.subject) return;

      const startPeriod = periodMap[slotTime];
      if (!startPeriod) return;

      const periodsList = [startPeriod];

      // If lab with 2 slots, add the next period
      if (cell.type === 'LAB' && cell.durationSlots === 2) {
        const startIdx = regularSlots.findIndex(s => s.start === slotTime);
        if (startIdx >= 0 && startIdx + 1 < regularSlots.length) {
          periodsList.push(`P${startIdx + 2}`);
        }
      }

      const teacherAbbr = cell.teacherAbbr && cell.teacher !== 'N/A' ? cell.teacherAbbr : null;
      const room = cell.room && cell.room !== 'N/A' ? cell.room : null;

      entries.push({
        periods: periodsList,
        subject: cell.subjectCode || null,
        teacher: teacherAbbr,
        room
      });
    });

    timetable[dayCode] = entries;
  });

  return {
    meta: {
      institute: 'IPS Academy Timetable Management',
      exportedAt: new Date().toISOString(),
      version: '2.0'
    },
    class: {
      id: classData.class._id,
      code: classData.class.code,
      name: classData.class.class_name,
      year: classData.class.year,
      section: classData.class.section
    },
    teachers,
    subjects,
    periods,
    breaks,
    timetable
  };
}

// Single class JSON export
export async function exportJSON(req, res, classData) {
  const jsonData = generateJSON(classData);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="timetable-${classData.class.code || classData.class.class_name}.json"`
  );

  res.json(jsonData);
}

// Bulk JSON export
export async function exportBulkJSON(res, classesData) {
  const bulkJsonData = {
    institute: 'IPS Academy Timetable Management',
    exportDate: new Date().toISOString(),
    exportType: 'bulk',
    totalClasses: classesData.length,
    classes: classesData.map(classData => generateJSON(classData))
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="bulk-timetables.json"'
  );

  res.json(bulkJsonData);
}
