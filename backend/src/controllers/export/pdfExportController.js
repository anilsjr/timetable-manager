import PDFDocument from 'pdfkit';
import { timeSlots, days, dayLabels } from './exportConfig.js';

// Render a single class timetable page on a PDFDocument
function renderPDFPage(doc, classData) {
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

  const totalHeight = rowHeight + (days.length * rowHeight); // header + all day rows

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
    doc.text('BREAK', -40, -6, { width: 80, align: 'center' });
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
    doc.text('LUNCH', -40, -6, { width: 80, align: 'center' });
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
}

// Single class PDF export
export async function exportPDF(req, res, classData) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="timetable-${classData.class.code || classData.class.class_name}.pdf"`
  );

  doc.pipe(res);
  renderPDFPage(doc, classData);
  doc.end();
}

// Bulk PDF export
export async function exportBulkPDF(res, classesData) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="bulk-timetables.pdf"'
  );

  doc.pipe(res);

  for (let i = 0; i < classesData.length; i++) {
    if (i > 0) doc.addPage();
    renderPDFPage(doc, classesData[i]);
  }

  doc.end();
}
