import api from './api.js';

// Export single class timetable
export async function exportTimetable(classId, format) {
  try {
    const config = {
      params: { classId, format }
    };
    
    // For JSON format, we don't need blob response type
    if (format !== 'json') {
      config.responseType = 'blob';
    }
    
    const response = await api.get(`/api/timetable/export`, config);
    
    // Handle JSON format differently
    if (format === 'json') {
      const jsonStr = JSON.stringify(response.data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `timetable-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return response;
    }
    
    // Handle Excel and PDF formats
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
    const config = {
      responseType: format === 'json' ? undefined : 'blob'
    };
    
    const response = await api.post('/api/timetable/export/bulk', 
      { classIds, format },
      config
    );
    
    // Handle JSON format differently
    if (format === 'json') {
      const jsonStr = JSON.stringify(response.data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bulk-timetables-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return response;
    }
    
    // Handle Excel and PDF formats
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