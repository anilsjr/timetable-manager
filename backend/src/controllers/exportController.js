import { getClassTimetableData } from './export/exportConfig.js';
import { exportExcel, exportBulkExcel } from './export/excelExportController.js';
import { exportPDF, exportBulkPDF } from './export/pdfExportController.js';
import { exportJSON, exportBulkJSON } from './export/jsonExportController.js';

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
      await exportExcel(req, res, classData);
    } else if (format.toLowerCase() === 'pdf') {
      await exportPDF(req, res, classData);
    } else {
      await exportJSON(req, res, classData);
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
      await exportBulkExcel(res, classesData);
    } else if (format.toLowerCase() === 'pdf') {
      await exportBulkPDF(res, classesData);
    } else {
      await exportBulkJSON(res, classesData);
    }
  } catch (error) {
    console.error('Bulk export error:', error);
    res.status(500).json({ error: error.message || 'Failed to export timetables' });
  }
}
