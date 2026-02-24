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

/** Timetable grid columns: editable slots + static BREAK and LUNCH */
export const TIMESLOTS = [
  { start: '09:45', end: '10:35', type: 'slot', label: '09:45-10:35' },
  { start: '10:35', end: '11:25', type: 'slot', label: '10:35-11:25' },
  { start: '11:25', end: '11:30', type: 'break', label: '11:25-11:30' },
  { start: '11:30', end: '12:20', type: 'slot', label: '11:30-12:20' },
  { start: '12:20', end: '13:10', type: 'slot', label: '12:20-01:10' },
  { start: '13:10', end: '13:40', type: 'lunch', label: '01:10-01:40' },
  { start: '13:40', end: '14:30', type: 'slot', label: '01:40-02:30' },
  { start: '14:30', end: '15:20', type: 'slot', label: '02:30-03:20' },
  { start: '15:20', end: '16:10', type: 'slot', label: '03:20-04:10' },
];

const DAY_LABELS = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday' };
export function getDayLabel(day) {
  return DAY_LABELS[day] || day;
}
