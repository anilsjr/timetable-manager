import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import Schedule from '../models/Schedule.js';
import Class from '../models/Class.js';

// Time slots configuration
const timeSlots = [
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

const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const dayLabels = {
  'MON': 'Monday',
  'TUE': 'Tuesday', 
  'WED': 'Wednesday',
  'THU': 'Thursday',
  'FRI': 'Friday',
  'SAT': 'Saturday'
};

// Helper function to get class timetable data
async function getClassTimetableData(classId) {
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

// Generate Excel export
async function generateExcel(classData) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Timetable');

  // Add header
  worksheet.mergeCells('A1:J1');
  worksheet.getCell('A1').value = 'IPS Academy Timetable Management';
  worksheet.getCell('A1').font = { bold: true, size: 16 };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:J2');
  worksheet.getCell('A2').value = `Class: ${classData.class.code || `${classData.class.class_name}-${classData.class.year}${classData.class.section}`}`;
  worksheet.getCell('A2').font = { bold: true, size: 14 };
  worksheet.getCell('A2').alignment = { horizontal: 'center' };

  // Add empty row
  worksheet.addRow([]);

  // Add table headers
  const headers = ['Day', ...timeSlots.map(slot => slot.label)];
  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

  // Find BREAK and LUNCH column indices
  const breakSlotIdx = timeSlots.findIndex(s => s.start === 'BREAK');
  const lunchSlotIdx = timeSlots.findIndex(s => s.start === 'LUNCH');
  const breakColIdx = breakSlotIdx + 2; // +2 for Day column offset
  const lunchColIdx = lunchSlotIdx + 2;
  const headerRowNum = headerRow.number;

  // Add data
  days.forEach(day => {
    const rowData = [dayLabels[day]];
    const labMerges = []; // Track columns to merge for labs
    timeSlots.forEach((slot, slotIndex) => {
      const cell = classData.timetable[day][slot.start];
      const colIndex = slotIndex + 2; // +2 because Day is col 1, slots start at col 2
      if (cell && cell.type === 'BREAK') {
        rowData.push(''); // Will be vertically merged
      } else if (cell && cell.type === 'LUNCH') {
        rowData.push(''); // Will be vertically merged
      } else if (cell && cell.isLabContinuation) {
        rowData.push(''); // Empty - will be merged with lab cell
      } else if (cell && cell.type === 'LAB') {
        const teacherDisplay = cell.teacherAbbr || cell.teacher;
        const line = teacherDisplay && teacherDisplay !== 'N/A'
          ? `${cell.subject} (${teacherDisplay})\n${cell.room}`
          : `${cell.subject}\n${cell.room}`;
        rowData.push(line);
        labMerges.push(colIndex);
      } else if (cell) {
        const teacherCode = cell.teacherAbbr || cell.teacher;
        rowData.push(`${cell.subject}\n${teacherCode}\n${cell.room}`);
      } else {
        rowData.push('');
      }
    });
    const row = worksheet.addRow(rowData);

    // Merge lab cells spanning 2 slots
    labMerges.forEach(colIndex => {
      const rowNumber = row.number;
      worksheet.mergeCells(rowNumber, colIndex, rowNumber, colIndex + 1);
      row.getCell(colIndex).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });
  });

  // Vertically merge BREAK column (header row through last data row)
  const lastDataRow = headerRowNum + days.length;
  if (breakSlotIdx >= 0) {
    worksheet.mergeCells(headerRowNum, breakColIdx, lastDataRow, breakColIdx);
    const breakCell = worksheet.getCell(headerRowNum, breakColIdx);
    breakCell.value = 'SHORT BREAK';
    breakCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFA500' } };
    breakCell.alignment = { textRotation: 90, horizontal: 'center', vertical: 'middle' };
    breakCell.font = { bold: true, size: 11 };
  }

  // Vertically merge LUNCH column (header row through last data row)
  if (lunchSlotIdx >= 0) {
    worksheet.mergeCells(headerRowNum, lunchColIdx, lastDataRow, lunchColIdx);
    const lunchCell = worksheet.getCell(headerRowNum, lunchColIdx);
    lunchCell.value = 'LUNCH BREAK';
    lunchCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } };
    lunchCell.alignment = { textRotation: 90, horizontal: 'center', vertical: 'middle' };
    lunchCell.font = { bold: true, size: 11 };
  }

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const length = cell.value ? cell.value.toString().length : 0;
      if (length > maxLength) {
        maxLength = length;
      }
    });
    column.width = Math.min(Math.max(maxLength + 2, 12), 30);
  });

  // Add footer
  const footerRow = worksheet.rowCount + 2;
  worksheet.mergeCells(`A${footerRow}:J${footerRow}`);
  worksheet.getCell(`A${footerRow}`).value = `Generated on ${new Date().toLocaleString()}`;
  worksheet.getCell(`A${footerRow}`).font = { italic: true };
  worksheet.getCell(`A${footerRow}`).alignment = { horizontal: 'center' };

  return workbook;
}

// Generate PDF export
async function generatePDF(classData) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
  
  // Header
  doc.fontSize(16).font('Helvetica-Bold').text('IPS Academy Timetable Management', { align: 'center' });
  doc.fontSize(14).text(`Class: ${classData.class.code || `${classData.class.class_name}-${classData.class.year}${classData.class.section}`}`, { align: 'center' });
  doc.moveDown();

  // Table setup
  const tableTop = doc.y;
  const tableLeft = 30;
  const columnWidth = (doc.page.width - 60) / (timeSlots.length + 1); // +1 for day column
  const rowHeight = 60;

  // Draw headers
  let currentX = tableLeft;
  doc.fontSize(10).font('Helvetica-Bold');
  
  // Day header
  doc.rect(currentX, tableTop, columnWidth, rowHeight).stroke();
  doc.text('Day', currentX + 5, tableTop + 25, { width: columnWidth - 10, align: 'center' });
  currentX += columnWidth;

  // Track BREAK and LUNCH column X positions for merged cells
  let breakColX = null;
  let lunchColX = null;

  // Time slot headers
  timeSlots.forEach(slot => {
    if (slot.start === 'BREAK') {
      breakColX = currentX;
      currentX += columnWidth;
      return; // Skip header — will draw merged cell later
    }
    if (slot.start === 'LUNCH') {
      lunchColX = currentX;
      currentX += columnWidth;
      return; // Skip header — will draw merged cell later
    }
    doc.rect(currentX, tableTop, columnWidth, rowHeight).stroke();
    doc.text(slot.label, currentX + 5, tableTop + 20, { width: columnWidth - 10, align: 'center' });
    currentX += columnWidth;
  });

  const totalHeight = rowHeight + (days.length * rowHeight); // header + all day rows

  // Draw merged BREAK column
  if (breakColX !== null) {
    doc.save();
    doc.fillColor('#FFA500').rect(breakColX, tableTop, columnWidth, totalHeight).fill();
    doc.rect(breakColX, tableTop, columnWidth, totalHeight).stroke();
    doc.fillColor('#000000');
    doc.fontSize(10).font('Helvetica-Bold');
    // Rotate text 90 degrees for vertical label
    const centerX = breakColX + columnWidth / 2;
    const centerY = tableTop + totalHeight / 2;
    doc.save();
    doc.translate(centerX, centerY);
    doc.rotate(-90);
    doc.text('SHORT BREAK', -40, -6, { width: 80, align: 'center' });
    doc.restore();
    doc.restore();
  }

  // Draw merged LUNCH column
  if (lunchColX !== null) {
    doc.save();
    doc.fillColor('#90EE90').rect(lunchColX, tableTop, columnWidth, totalHeight).fill();
    doc.rect(lunchColX, tableTop, columnWidth, totalHeight).stroke();
    doc.fillColor('#000000');
    doc.fontSize(10).font('Helvetica-Bold');
    const centerX = lunchColX + columnWidth / 2;
    const centerY = tableTop + totalHeight / 2;
    doc.save();
    doc.translate(centerX, centerY);
    doc.rotate(-90);
    doc.text('LUNCH BREAK', -40, -6, { width: 80, align: 'center' });
    doc.restore();
    doc.restore();
  }

  // Draw data rows
  let currentY = tableTop + rowHeight;
  days.forEach(day => {
    currentX = tableLeft;
    
    // Day column
    doc.rect(currentX, currentY, columnWidth, rowHeight).stroke();
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(dayLabels[day], currentX + 5, currentY + 25, { width: columnWidth - 10, align: 'center' });
    currentX += columnWidth;

    // Time slot columns
    timeSlots.forEach(slot => {
      // Skip BREAK and LUNCH — already drawn as merged columns
      if (slot.start === 'BREAK' || slot.start === 'LUNCH') {
        currentX += columnWidth;
        return;
      }

      const cell = classData.timetable[day][slot.start];
      doc.fontSize(8).font('Helvetica');

      // Skip continuation cells - already covered by merged lab cell
      if (cell && cell.isLabContinuation) {
        currentX += columnWidth;
        return;
      }

      const isLab = cell && cell.type === 'LAB' && cell.durationSlots === 2;
      const cellWidth = isLab ? columnWidth * 2 : columnWidth;

      doc.rect(currentX, currentY, cellWidth, rowHeight).stroke();
      
      if (isLab) {
        doc.fillColor('#000000');
        const teacherDisplay = cell.teacherAbbr || cell.teacher;
        const labLine = teacherDisplay && teacherDisplay !== 'N/A'
          ? `${cell.subject} (${teacherDisplay})`
          : cell.subject;
        const cellText = `${labLine}\n${cell.room}`;
        doc.text(cellText, currentX + 5, currentY + 15, { width: cellWidth - 10, align: 'center' });
      } else if (cell) {
        doc.fillColor('#000000');
        const teacherCode = cell.teacherAbbr || cell.teacher;
        const cellText = `${cell.subject}\n${teacherCode}\n${cell.room}`;
        doc.text(cellText, currentX + 5, currentY + 10, { width: cellWidth - 10, align: 'center' });
      }
      
      currentX += columnWidth;
    });
    
    currentY += rowHeight;
  });

  // Footer
  doc.fontSize(10).font('Helvetica-Oblique');
  doc.text(`Generated on ${new Date().toLocaleString()}`, tableLeft, currentY + 20, { align: 'center' });

  return doc;
}

// Generate JSON export (v2.0 normalized format)
function generateJSON(classData) {
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
      // Find the period just before this break
      const prevSlot = timeSlots[i - 1];
      const nextSlot = timeSlots[i + 1];
      if (prevSlot && nextSlot && prevSlot.start !== 'BREAK' && prevSlot.start !== 'LUNCH') {
        const prevPeriodId = periodMap[prevSlot.start];
        // Calculate duration in minutes
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

// Single class export endpoint
export async function exportTimetable(req, res) {
  try {
    const { classId, format } = req.query;

    if (!classId || !format) {
      return res.status(400).json({ error: 'Class ID and format are required' });
    }

    if (!['excel', 'pdf', 'json'].includes(format.toLowerCase())) {
      return res.status(400).json({ error: 'Format must be excel, pdf, or json' });
    }

    const classData = await getClassTimetableData(classId);

    if (format.toLowerCase() === 'excel') {
      const workbook = await generateExcel(classData);
      
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="timetable-${classData.class.code || classData.class.class_name}.xlsx"`
      );

      await workbook.xlsx.write(res);
      res.end();
    } else if (format.toLowerCase() === 'pdf') {
      const doc = await generatePDF(classData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="timetable-${classData.class.code || classData.class.class_name}.pdf"`
      );

      doc.pipe(res);
      doc.end();
    } else {
      // JSON format
      const jsonData = generateJSON(classData);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="timetable-${classData.class.code || classData.class.class_name}.json"`
      );

      res.json(jsonData);
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message || 'Failed to export timetable' });
  }
}

// Bulk export endpoint
export async function exportBulkTimetables(req, res) {
  try {
    const { classIds, format } = req.body;

    if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
      return res.status(400).json({ error: 'Class IDs array is required' });
    }

    if (!format || !['excel', 'pdf', 'json'].includes(format.toLowerCase())) {
      return res.status(400).json({ error: 'Format must be excel, pdf, or json' });
    }

    const classesData = await Promise.all(
      classIds.map(classId => getClassTimetableData(classId))
    );

    if (format.toLowerCase() === 'excel') {
      // Create workbook with multiple sheets
      const workbook = new ExcelJS.Workbook();
      
      for (const classData of classesData) {
        const worksheet = workbook.addWorksheet(
          classData.class.code || `${classData.class.class_name}-${classData.class.year}${classData.class.section}`
        );

        // Add header for this sheet
        worksheet.mergeCells('A1:J1');
        worksheet.getCell('A1').value = 'IPS Academy Timetable Management';
        worksheet.getCell('A1').font = { bold: true, size: 16 };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        worksheet.mergeCells('A2:J2');
        worksheet.getCell('A2').value = `Class: ${classData.class.code || `${classData.class.class_name}-${classData.class.year}${classData.class.section}`}`;
        worksheet.getCell('A2').font = { bold: true, size: 14 };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };

        worksheet.addRow([]);

        // Add table headers
        const headers = ['Day', ...timeSlots.map(slot => slot.label)];
        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

        // Find BREAK and LUNCH column indices
        const breakSlotIdx = timeSlots.findIndex(s => s.start === 'BREAK');
        const lunchSlotIdx = timeSlots.findIndex(s => s.start === 'LUNCH');
        const breakColIdx = breakSlotIdx + 2;
        const lunchColIdx = lunchSlotIdx + 2;
        const headerRowNum = headerRow.number;

        // Add data
        days.forEach(day => {
          const rowData = [dayLabels[day]];
          const labMerges = []; // Track columns to merge for labs
          timeSlots.forEach((slot, slotIndex) => {
            const cell = classData.timetable[day][slot.start];
            const colIndex = slotIndex + 2; // +2 because Day is col 1, slots start at col 2
            if (cell && cell.type === 'BREAK') {
              rowData.push(''); // Will be vertically merged
            } else if (cell && cell.type === 'LUNCH') {
              rowData.push(''); // Will be vertically merged
            } else if (cell && cell.isLabContinuation) {
              rowData.push(''); // Empty - will be merged with lab cell
            } else if (cell && cell.type === 'LAB') {
              const teacherDisplay = cell.teacherAbbr || cell.teacher;
              const line = teacherDisplay && teacherDisplay !== 'N/A'
                ? `${cell.subject} (${teacherDisplay})\n${cell.room}`
                : `${cell.subject}\n${cell.room}`;
              rowData.push(line);
              labMerges.push(colIndex);
            } else if (cell) {
              const teacherCode = cell.teacherAbbr || cell.teacher;
              rowData.push(`${cell.subject}\n${teacherCode}\n${cell.room}`);
            } else {
              rowData.push('');
            }
          });
          const row = worksheet.addRow(rowData);

          // Merge lab cells spanning 2 slots
          labMerges.forEach(colIndex => {
            const rowNumber = row.number;
            worksheet.mergeCells(rowNumber, colIndex, rowNumber, colIndex + 1);
            row.getCell(colIndex).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          });
        });

        // Vertically merge BREAK column (header row through last data row)
        const lastDataRow = headerRowNum + days.length;
        if (breakSlotIdx >= 0) {
          worksheet.mergeCells(headerRowNum, breakColIdx, lastDataRow, breakColIdx);
          const breakCell = worksheet.getCell(headerRowNum, breakColIdx);
          breakCell.value = 'SHORT BREAK';
          breakCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFA500' } };
          breakCell.alignment = { textRotation: 90, horizontal: 'center', vertical: 'middle' };
          breakCell.font = { bold: true, size: 11 };
        }

        // Vertically merge LUNCH column (header row through last data row)
        if (lunchSlotIdx >= 0) {
          worksheet.mergeCells(headerRowNum, lunchColIdx, lastDataRow, lunchColIdx);
          const lunchCell = worksheet.getCell(headerRowNum, lunchColIdx);
          lunchCell.value = 'LUNCH BREAK';
          lunchCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } };
          lunchCell.alignment = { textRotation: 90, horizontal: 'center', vertical: 'middle' };
          lunchCell.font = { bold: true, size: 11 };
        }

        // Auto-fit columns
        worksheet.columns.forEach(column => {
          let maxLength = 0;
          column.eachCell({ includeEmpty: true }, cell => {
            const length = cell.value ? cell.value.toString().length : 0;
            if (length > maxLength) {
              maxLength = length;
            }
          });
          column.width = Math.min(Math.max(maxLength + 2, 12), 30);
        });

        // Add footer
        const footerRow = worksheet.rowCount + 2;
        worksheet.mergeCells(`A${footerRow}:J${footerRow}`);
        worksheet.getCell(`A${footerRow}`).value = `Generated on ${new Date().toLocaleString()}`;
        worksheet.getCell(`A${footerRow}`).font = { italic: true };
        worksheet.getCell(`A${footerRow}`).alignment = { horizontal: 'center' };
      }
      
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="bulk-timetables.xlsx"'
      );

      await workbook.xlsx.write(res);
      res.end();
    } else if (format.toLowerCase() === 'pdf') {
      // Create single PDF with multiple classes
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="bulk-timetables.pdf"'
      );

      doc.pipe(res);

      for (let i = 0; i < classesData.length; i++) {
        if (i > 0) doc.addPage();
        
        const classData = classesData[i];
        
        // Header
        doc.fontSize(16).font('Helvetica-Bold').text('IPS Academy Timetable Management', { align: 'center' });
        doc.fontSize(14).text(`Class: ${classData.class.code || `${classData.class.class_name}-${classData.class.year}${classData.class.section}`}`, { align: 'center' });
        doc.moveDown();

        // Table setup
        const tableTop = doc.y;
        const tableLeft = 30;
        const columnWidth = (doc.page.width - 60) / (timeSlots.length + 1);
        const rowHeight = 60;

        // Draw headers
        let currentX = tableLeft;
        doc.fontSize(10).font('Helvetica-Bold');
        
        doc.rect(currentX, tableTop, columnWidth, rowHeight).stroke();
        doc.text('Day', currentX + 5, tableTop + 25, { width: columnWidth - 10, align: 'center' });
        currentX += columnWidth;

        // Track BREAK and LUNCH column X positions for merged cells
        let breakColX = null;
        let lunchColX = null;

        timeSlots.forEach(slot => {
          if (slot.start === 'BREAK') {
            breakColX = currentX;
            currentX += columnWidth;
            return;
          }
          if (slot.start === 'LUNCH') {
            lunchColX = currentX;
            currentX += columnWidth;
            return;
          }
          doc.rect(currentX, tableTop, columnWidth, rowHeight).stroke();
          doc.text(slot.label, currentX + 5, tableTop + 20, { width: columnWidth - 10, align: 'center' });
          currentX += columnWidth;
        });

        const totalHeight = rowHeight + (days.length * rowHeight);

        // Draw merged BREAK column
        if (breakColX !== null) {
          doc.save();
          doc.fillColor('#FFA500').rect(breakColX, tableTop, columnWidth, totalHeight).fill();
          doc.rect(breakColX, tableTop, columnWidth, totalHeight).stroke();
          doc.fillColor('#000000');
          doc.fontSize(10).font('Helvetica-Bold');
          const centerX = breakColX + columnWidth / 2;
          const centerY = tableTop + totalHeight / 2;
          doc.save();
          doc.translate(centerX, centerY);
          doc.rotate(-90);
          doc.text('SHORT BREAK', -40, -6, { width: 80, align: 'center' });
          doc.restore();
          doc.restore();
        }

        // Draw merged LUNCH column
        if (lunchColX !== null) {
          doc.save();
          doc.fillColor('#90EE90').rect(lunchColX, tableTop, columnWidth, totalHeight).fill();
          doc.rect(lunchColX, tableTop, columnWidth, totalHeight).stroke();
          doc.fillColor('#000000');
          doc.fontSize(10).font('Helvetica-Bold');
          const centerX = lunchColX + columnWidth / 2;
          const centerY = tableTop + totalHeight / 2;
          doc.save();
          doc.translate(centerX, centerY);
          doc.rotate(-90);
          doc.text('LUNCH BREAK', -40, -6, { width: 80, align: 'center' });
          doc.restore();
          doc.restore();
        }

        // Draw data rows
        let currentY = tableTop + rowHeight;
        days.forEach(day => {
          currentX = tableLeft;
          
          doc.rect(currentX, currentY, columnWidth, rowHeight).stroke();
          doc.fontSize(10).font('Helvetica-Bold');
          doc.text(dayLabels[day], currentX + 5, currentY + 25, { width: columnWidth - 10, align: 'center' });
          currentX += columnWidth;

          timeSlots.forEach(slot => {
            // Skip BREAK and LUNCH — already drawn as merged columns
            if (slot.start === 'BREAK' || slot.start === 'LUNCH') {
              currentX += columnWidth;
              return;
            }

            const cell = classData.timetable[day][slot.start];
            doc.fontSize(8).font('Helvetica');

            // Skip continuation cells - already covered by merged lab cell
            if (cell && cell.isLabContinuation) {
              currentX += columnWidth;
              return;
            }

            const isLab = cell && cell.type === 'LAB' && cell.durationSlots === 2;
            const cellWidth = isLab ? columnWidth * 2 : columnWidth;

            doc.rect(currentX, currentY, cellWidth, rowHeight).stroke();
            
            if (isLab) {
              doc.fillColor('#000000');
              const teacherDisplay = cell.teacherAbbr || cell.teacher;
              const labLine = teacherDisplay && teacherDisplay !== 'N/A'
                ? `${cell.subject} (${teacherDisplay})`
                : cell.subject;
              const cellText = `${labLine}\n${cell.room}`;
              doc.text(cellText, currentX + 5, currentY + 15, { width: cellWidth - 10, align: 'center' });
            } else if (cell) {
              doc.fillColor('#000000');
              const teacherCode = cell.teacherAbbr || cell.teacher;
              const cellText = `${cell.subject}\n${teacherCode}\n${cell.room}`;
              doc.text(cellText, currentX + 5, currentY + 10, { width: cellWidth - 10, align: 'center' });
            }
            
            currentX += columnWidth;
          });
          
          currentY += rowHeight;
        });

        // Footer
        doc.fontSize(10).font('Helvetica-Oblique');
        doc.text(`Generated on ${new Date().toLocaleString()}`, tableLeft, currentY + 20, { align: 'center' });
      }

      doc.end();
    } else {
      // JSON format - bulk export as array of class timetables
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
  } catch (error) {
    console.error('Bulk export error:', error);
    res.status(500).json({ error: error.message || 'Failed to export timetables' });
  }
}