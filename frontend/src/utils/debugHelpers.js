/**
 * Debug helper to list valid lab start times based on current TIMESLOTS
 */
import { TIMESLOTS } from './dateHelpers';

export function debugValidLabSlots() {
  console.log('=== Valid Lab Start Times ===');
  
  const slots = TIMESLOTS.filter(s => s.type === 'slot');
  
  for (let i = 0; i < slots.length - 1; i++) {
    const current = slots[i];
    const next = slots[i + 1];
    
    const isContinuous = current.end === next.start;
    const status = isContinuous ? '✅ VALID' : '❌ INVALID (break/lunch between)';
    
    console.log(`${current.start} → ${next.end} ${status}`);
    console.log(`  Slot 1: ${current.start}-${current.end}`);
    console.log(`  Slot 2: ${next.start}-${next.end}`);
    console.log(`  Gap: ${current.end !== next.start ? `${current.end} to ${next.start}` : 'None'}`);
    console.log('');
  }
  
  console.log('Valid lab start times:');
  for (let i = 0; i < slots.length - 1; i++) {
    const current = slots[i];
    const next = slots[i + 1];
    if (current.end === next.start) {
      console.log(`  - ${current.start} (ends at ${next.end})`);
    }
  }
}
