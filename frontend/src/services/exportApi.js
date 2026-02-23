import api from './api.js';

// Export single class timetable
export async function exportTimetable(classId, format) {
  try {
    const response = await api.get(`/timetable/export`, {
      params: { classId, format },
      responseType: 'blob'
    });
    
    // Create download link
    const blob = new Blob([response.data], {
      type: format === 'excel' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf'
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from response headers or create default
    const contentDisposition = response.headers['content-disposition'];
    let filename = `timetable.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return response;
  } catch (error) {
    console.error('Export timetable error:', error);
    throw error;
  }
}

// Export multiple class timetables
export async function exportBulkTimetables(classIds, format) {
  try {
    const response = await api.post('/timetable/export/bulk', 
      { classIds, format },
      { responseType: 'blob' }
    );
    
    // Create download link
    const blob = new Blob([response.data], {
      type: format === 'excel' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf'
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from response headers or create default
    const contentDisposition = response.headers['content-disposition'];
    let filename = `bulk-timetables.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return response;
  } catch (error) {
    console.error('Bulk export timetables error:', error);
    throw error;
  }
}