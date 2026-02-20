import api from './api';

const ENDPOINTS = {
  subjects: '/api/import/subjects',
  teachers: '/api/import/teachers',
  labs: '/api/import/labs',
  classes: '/api/import/classes',
};

/**
 * Upload a file to import data.
 * @param {'subjects'|'teachers'|'labs'|'classes'} type
 * @param {File} file - CSV, Excel (.xlsx/.xls), or JSON
 * @returns {Promise<{ success: boolean, created: number, errors: number, total: number, details?: { errors: Array<{ row: number, message: string }> } }>}
 */
export function uploadImportFile(type, file) {
  const url = ENDPOINTS[type];
  if (!url) throw new Error(`Invalid import type: ${type}`);
  const formData = new FormData();
  formData.append('file', file);
  return api.post(url, formData).then((r) => r.data);
}
