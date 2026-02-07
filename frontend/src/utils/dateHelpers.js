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
  { start: '09:45', end: '10:35', type: 'slot', label: '9:45 AM - 10:35 AM' },
  { start: '10:35', end: '11:25', type: 'slot', label: '10:35 AM - 11:25 AM' },
  { start: '11:25', end: '11:30', type: 'break', label: 'Break' },
  { start: '11:30', end: '12:20', type: 'slot', label: '11:30 AM - 12:20 PM' },
  { start: '12:20', end: '13:10', type: 'slot', label: '12:20 PM - 1:10 PM' },
  { start: '13:10', end: '13:40', type: 'lunch', label: 'Lunch' },
  { start: '13:40', end: '14:30', type: 'slot', label: '1:40 PM - 2:30 PM' },
  { start: '14:30', end: '15:20', type: 'slot', label: '2:30 PM - 3:20 PM' },
  { start: '15:20', end: '16:10', type: 'slot', label: '3:20 PM - 4:10 PM' },
];

const DAY_LABELS = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday' };
export function getDayLabel(day) {
  return DAY_LABELS[day] || day;
}
