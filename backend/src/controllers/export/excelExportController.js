import ExcelJS from 'exceljs';
import { timeSlots, days, dayLabels, getClassTimetableData } from './exportConfig.js';

// Generate Excel workbook for a single class
export async function generateExcel(classData) {
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
    breakCell.value = 'BREAK';
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

// Helper to populate a worksheet for bulk export (same layout as single)
export function populateExcelSheet(worksheet, classData) {
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
    const labMerges = [];
    timeSlots.forEach((slot, slotIndex) => {
      const cell = classData.timetable[day][slot.start];
      const colIndex = slotIndex + 2;
      if (cell && cell.type === 'BREAK') {
        rowData.push('');
      } else if (cell && cell.type === 'LUNCH') {
        rowData.push('');
      } else if (cell && cell.isLabContinuation) {
        rowData.push('');
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

    labMerges.forEach(colIndex => {
      const rowNumber = row.number;
      worksheet.mergeCells(rowNumber, colIndex, rowNumber, colIndex + 1);
      row.getCell(colIndex).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });
  });

  // Vertically merge BREAK column
  const lastDataRow = headerRowNum + days.length;
  if (breakSlotIdx >= 0) {
    worksheet.mergeCells(headerRowNum, breakColIdx, lastDataRow, breakColIdx);
    const breakCell = worksheet.getCell(headerRowNum, breakColIdx);
    breakCell.value = 'BREAK';
    breakCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFA500' } };
    breakCell.alignment = { textRotation: 90, horizontal: 'center', vertical: 'middle' };
    breakCell.font = { bold: true, size: 11 };
  }

  // Vertically merge LUNCH column
  if (lunchSlotIdx >= 0) {
    worksheet.mergeCells(headerRowNum, lunchColIdx, lastDataRow, lunchColIdx);
    const lunchCell = worksheet.getCell(headerRowNum, lunchColIdx);
    lunchCell.value = 'LUNCH';
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

// Single class Excel export
export async function exportExcel(req, res, classData) {
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
}

// Bulk Excel export
export async function exportBulkExcel(res, classesData) {
  const workbook = new ExcelJS.Workbook();

  for (const classData of classesData) {
    const worksheet = workbook.addWorksheet(
      classData.class.code || `${classData.class.class_name}-${classData.class.year}${classData.class.section}`
    );
    populateExcelSheet(worksheet, classData);
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
}
