/**
 * Helpers for schedule date/time handling
 */

export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function formatTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function toISOTimeWithDate(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(dateStr);
  d.setHours(h || 0, m || 0, 0, 0);
  return d.toISOString();
}

export function dateToTimeStr(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
