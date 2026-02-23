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

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper function to get class timetable data
async function getClassTimetableData(classId) {
  const classData = await Class.findById(classId);
  if (!classData) {
    throw new Error('Class not found');
  }

  const schedules = await Schedule.find({ class: classId })
    .populate('subject', 'subject_name subject_code')
    .populate('teacher', 'first_name last_name')
    .populate('room', 'room_number lab_name')
    .lean();

  // Create timetable grid
  const timetableGrid = {};
  
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

  // Fill in schedules
  schedules.forEach(schedule => {
    const day = schedule.day_of_week;
    const startTime = schedule.start_time;
    
    if (timetableGrid[day] && timetableGrid[day][startTime] !== undefined) {
      timetableGrid[day][startTime] = {
        subject: schedule.subject?.subject_name || 'N/A',
        subjectCode: schedule.subject?.subject_code || '',
        teacher: schedule.teacher ? `${schedule.teacher.first_name} ${schedule.teacher.last_name}` : 'N/A',
        room: schedule.room?.room_number || schedule.room?.lab_name || 'N/A',
        type: schedule.type || 'LECTURE'
      };
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

  // Add data
  days.forEach(day => {
    const rowData = [day];
    timeSlots.forEach(slot => {
      const cell = classData.timetable[day][slot.start];
      if (cell && cell.type === 'BREAK') {
        rowData.push('BREAK');
      } else if (cell && cell.type === 'LUNCH') {
        rowData.push('LUNCH');
      } else if (cell) {
        rowData.push(`${cell.subject}\n${cell.teacher}\n${cell.room}`);
      } else {
        rowData.push('');
      }
    });
    const row = worksheet.addRow(rowData);
    
    // Color code break and lunch
    rowData.forEach((cellValue, index) => {
      if (cellValue === 'BREAK') {
        row.getCell(index + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFA500' } };
      } else if (cellValue === 'LUNCH') {
        row.getCell(index + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } };
      }
    });
  });

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

  // Time slot headers
  timeSlots.forEach(slot => {
    doc.rect(currentX, tableTop, columnWidth, rowHeight).stroke();
    doc.text(slot.label, currentX + 5, tableTop + 20, { width: columnWidth - 10, align: 'center' });
    currentX += columnWidth;
  });

  // Draw data rows
  let currentY = tableTop + rowHeight;
  days.forEach(day => {
    currentX = tableLeft;
    
    // Day column
    doc.rect(currentX, currentY, columnWidth, rowHeight).stroke();
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(day, currentX + 5, currentY + 25, { width: columnWidth - 10, align: 'center' });
    currentX += columnWidth;

    // Time slot columns
    timeSlots.forEach(slot => {
      doc.rect(currentX, currentY, columnWidth, rowHeight).stroke();
      
      const cell = classData.timetable[day][slot.start];
      doc.fontSize(8).font('Helvetica');
      
      if (cell && cell.type === 'BREAK') {
        doc.fillColor('#FFA500').rect(currentX, currentY, columnWidth, rowHeight).fill();
        doc.fillColor('#000000').text('BREAK', currentX + 5, currentY + 25, { width: columnWidth - 10, align: 'center' });
      } else if (cell && cell.type === 'LUNCH') {
        doc.fillColor('#90EE90').rect(currentX, currentY, columnWidth, rowHeight).fill();
        doc.fillColor('#000000').text('LUNCH', currentX + 5, currentY + 25, { width: columnWidth - 10, align: 'center' });
      } else if (cell) {
        doc.fillColor('#000000');
        const cellText = `${cell.subject}\n${cell.teacher}\n${cell.room}`;
        doc.text(cellText, currentX + 5, currentY + 10, { width: columnWidth - 10, align: 'center' });
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

// Single class export endpoint
export async function exportTimetable(req, res) {
  try {
    const { classId, format } = req.query;

    if (!classId || !format) {
      return res.status(400).json({ error: 'Class ID and format are required' });
    }

    if (!['excel', 'pdf'].includes(format.toLowerCase())) {
      return res.status(400).json({ error: 'Format must be either excel or pdf' });
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
    } else {
      const doc = await generatePDF(classData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="timetable-${classData.class.code || classData.class.class_name}.pdf"`
      );

      doc.pipe(res);
      doc.end();
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

    if (!format || !['excel', 'pdf'].includes(format.toLowerCase())) {
      return res.status(400).json({ error: 'Format must be either excel or pdf' });
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

        // Add data
        days.forEach(day => {
          const rowData = [day];
          timeSlots.forEach(slot => {
            const cell = classData.timetable[day][slot.start];
            if (cell && cell.type === 'BREAK') {
              rowData.push('BREAK');
            } else if (cell && cell.type === 'LUNCH') {
              rowData.push('LUNCH');
            } else if (cell) {
              rowData.push(`${cell.subject}\n${cell.teacher}\n${cell.room}`);
            } else {
              rowData.push('');
            }
          });
          const row = worksheet.addRow(rowData);
          
          rowData.forEach((cellValue, index) => {
            if (cellValue === 'BREAK') {
              row.getCell(index + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFA500' } };
            } else if (cellValue === 'LUNCH') {
              row.getCell(index + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } };
            }
          });
        });

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
    } else {
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

        timeSlots.forEach(slot => {
          doc.rect(currentX, tableTop, columnWidth, rowHeight).stroke();
          doc.text(slot.label, currentX + 5, tableTop + 20, { width: columnWidth - 10, align: 'center' });
          currentX += columnWidth;
        });

        // Draw data rows
        let currentY = tableTop + rowHeight;
        days.forEach(day => {
          currentX = tableLeft;
          
          doc.rect(currentX, currentY, columnWidth, rowHeight).stroke();
          doc.fontSize(10).font('Helvetica-Bold');
          doc.text(day, currentX + 5, currentY + 25, { width: columnWidth - 10, align: 'center' });
          currentX += columnWidth;

          timeSlots.forEach(slot => {
            doc.rect(currentX, currentY, columnWidth, rowHeight).stroke();
            
            const cell = classData.timetable[day][slot.start];
            doc.fontSize(8).font('Helvetica');
            
            if (cell && cell.type === 'BREAK') {
              doc.fillColor('#FFA500').rect(currentX, currentY, columnWidth, rowHeight).fill();
              doc.fillColor('#000000').text('BREAK', currentX + 5, currentY + 25, { width: columnWidth - 10, align: 'center' });
            } else if (cell && cell.type === 'LUNCH') {
              doc.fillColor('#90EE90').rect(currentX, currentY, columnWidth, rowHeight).fill();
              doc.fillColor('#000000').text('LUNCH', currentX + 5, currentY + 25, { width: columnWidth - 10, align: 'center' });
            } else if (cell) {
              doc.fillColor('#000000');
              const cellText = `${cell.subject}\n${cell.teacher}\n${cell.room}`;
              doc.text(cellText, currentX + 5, currentY + 10, { width: columnWidth - 10, align: 'center' });
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
    }
  } catch (error) {
    console.error('Bulk export error:', error);
    res.status(500).json({ error: error.message || 'Failed to export timetables' });
  }
}