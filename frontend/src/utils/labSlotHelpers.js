/**
 * Utilities for validating and handling lab scheduling (2-slot continuous sessions)
 */
import { TIMESLOTS } from './dateHelpers';

/**
 * Get the index of a slot time in TIMESLOTS
 */
function getSlotIndex(startTime) {
  return TIMESLOTS.findIndex((slot) => slot.type === 'slot' && slot.start === startTime);
}

/**
 * Check if a start time is valid for a 2-slot lab session
 * Returns { valid: boolean, message?: string, endTime?: string }
 */
export function isValidLabStartTime(startTime) {
  const slotIdx = getSlotIndex(startTime);
  
  if (slotIdx === -1) {
    return { valid: false, message: 'Invalid start time' };
  }
  
  // Find the next actual slot (not break/lunch)
  let nextSlotIdx = slotIdx + 1;
  while (nextSlotIdx < TIMESLOTS.length && TIMESLOTS[nextSlotIdx].type !== 'slot') {
    nextSlotIdx++;
  }
  
  if (nextSlotIdx >= TIMESLOTS.length) {
    return { valid: false, message: 'Not enough consecutive slots available for lab (needs 2 continuous slots)' };
  }
  
  const firstSlot = TIMESLOTS[slotIdx];
  const secondSlot = TIMESLOTS[nextSlotIdx];
  
  // Check if slots are truly continuous (no break/lunch between them)
  // The end of first slot should equal the start of second slot
  if (firstSlot.end !== secondSlot.start) {
    return { valid: false, message: 'Lab cannot span across breaks or lunch. Choose a different start time.' };
  }
  
  return { valid: true, endTime: secondSlot.end };
}

/**
 * Get all valid lab start times (times where 2 continuous slots are available)
 */
export function getValidLabStartTimes() {
  const validTimes = [];
  
  for (let i = 0; i < TIMESLOTS.length; i++) {
    const slot = TIMESLOTS[i];
    if (slot.type !== 'slot') continue;
    
    const validation = isValidLabStartTime(slot.start);
    if (validation.valid) {
      validTimes.push({
        start: slot.start,
        end: validation.endTime,
        label: `${slot.label} (2 slots)`,
      });
    }
  }
  
  return validTimes;
}

/**
 * Calculate end time for a lab given its start time (adds 100 minutes)
 */
export function calculateLabEndTime(startTime) {
  const validation = isValidLabStartTime(startTime);
  return validation.valid ? validation.endTime : null;
}

/**
 * Check if clicking on a cell can accommodate a lab session
 * @param {string} day - Day of week
 * @param {object} slot - The clicked slot
 * @param {array} schedules - All current schedules
 * @returns {object} { canAdd: boolean, message?: string, suggestedEndTime?: string }
 */
export function canAddLabAtSlot(day, slot, schedules) {
  if (slot.type !== 'slot') {
    return { canAdd: false, message: 'Cannot add lab to break/lunch slot' };
  }
  
  const validation = isValidLabStartTime(slot.start);
  if (!validation.valid) {
    return { canAdd: false, message: validation.message };
  }
  
  // Check if the next slot is also free
  const nextSlotIdx = getSlotIndex(slot.start) + 1;
  let actualNextIdx = nextSlotIdx;
  while (actualNextIdx < TIMESLOTS.length && TIMESLOTS[actualNextIdx].type !== 'slot') {
    actualNextIdx++;
  }
  
  if (actualNextIdx < TIMESLOTS.length) {
    const nextSlot = TIMESLOTS[actualNextIdx];
    const hasConflictInNext = schedules.some((s) => {
      return s.day_of_week === day && s.start_time && 
        timeOverlaps(nextSlot.start, nextSlot.end, formatTime(s.start_time), formatTime(s.end_time));
    });
    
    if (hasConflictInNext) {
      return { canAdd: false, message: 'Next slot is occupied. Lab needs 2 continuous slots.' };
    }
  }
  
  return { canAdd: true, suggestedEndTime: validation.endTime };
}

function formatTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function timeOverlaps(start1, end1, start2, end2) {
  return start1 < end2 && end1 > start2;
}
