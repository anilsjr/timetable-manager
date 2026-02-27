import { useMemo } from 'react';
import { DAYS, TIMESLOTS, getDayLabel } from '../utils/dateHelpers';

// Helper to format time for break/lunch display
function formatTimeSlot(start, end) {
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  };
  return `${formatTime(start)} - ${formatTime(end)}`;
}

function formatTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function overlaps(slotStart, slotEnd, schedStart, schedEnd) {
  return slotStart < schedEnd && slotEnd > schedStart;
}

/** First letters of each word, uppercase (e.g. "Natural Language Processing" -> "NLP") */
function shortNameFromFullName(fullName) {
  if (!fullName || typeof fullName !== 'string') return '';
  return fullName
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

/**
 * Returns { content: JSX, cellClass: string } for the timetable cell.
 * Subject/Lecture: two-line, blue. Lab: single-line, purple.
 */
function renderCellContent(schedule) {
  if (!schedule) return { content: null, cellClass: 'bg-white hover:bg-gray-50' };

  const type = schedule.type || 'LECTURE';
  const isLab = type === 'LAB';

  if (isLab) {
    const room = schedule.room;
    // Use lab document's short_name/code as label (populated via lab field)
    const labDoc = schedule.lab;
    const labName =
      labDoc?.short_name ||
      labDoc?.code ||
      room?.short_name ||
      room?.code ||
      'Lab';
    const inchargeAbbr = schedule.teacher?.short_abbr || schedule.teacher?.name || '';
    const assistantAbbr = schedule.lab_assistant?.short_abbr || schedule.lab_assistant?.name || '';
    const roomNo = room?.room_number || room?.code || room?.short_name || '';

    // Line 1: LabName (RoomNo) — omit room if not available
    const line1 = roomNo ? `${labName} (${roomNo})` : labName;
    // Line 2: Incharge / Assistant — omit assistant if not set
    const line2 = inchargeAbbr
      ? assistantAbbr
        ? `${inchargeAbbr} / ${assistantAbbr}`
        : inchargeAbbr
      : '';

    return {
      content: (
        <div className="pointer-events-none">
          <span className="block font-semibold text-purple-900 text-sm leading-tight">
            {line1}
          </span>
          <span className="block text-xs text-purple-700 mt-0.5">
            {line2 || '\u00A0'}
          </span>
        </div>
      ),
      cellClass: 'bg-purple-100 hover:bg-purple-200',
    };
  }

  // LECTURE / SUBJECT
  const subjectShortName =
    schedule.subject?.short_name ||
    schedule.subject?.code ||
    (schedule.subject?.full_name ? shortNameFromFullName(schedule.subject.full_name) : null) ||
    '—';
  const teacherShortName = schedule.teacher?.short_abbr || schedule.teacher?.name || '';
  const roomCode = schedule.roomModel === 'Room' && schedule.room?.code ? schedule.room.code : '';

  return {
    content: (
      <span className="block text-blue-900 pointer-events-none">
        <span className="font-semibold block">{subjectShortName} (L)</span>
        <span className="text-xs text-blue-800/90">{teacherShortName}{roomCode ? ` / ${roomCode}` : ''}</span>
      </span>
    ),
    cellClass: 'bg-blue-100 hover:bg-blue-200',
  };
}

export default function ScheduleGrid({ schedules = [], onCellClick }) {
  const cellMap = useMemo(() => {
    const map = new Map();
    const spannedCells = new Set(); // Track cells that are part of a 2-slot lab
    const labCells = new Map(); // Track lab schedule for spanned cells too
    
    for (const day of DAYS) {
      for (let slotIdx = 0; slotIdx < TIMESLOTS.length; slotIdx++) {
        const slot = TIMESLOTS[slotIdx];
        if (slot.type !== 'slot') continue;
        
        const key = `${day}_${slot.start}_${slot.end}`;
        
        // Skip if already marked as spanned
        if (spannedCells.has(key)) {
          continue;
        }
        
        const sched = schedules.find((s) => {
          const start = formatTime(s.start_time);
          const end = formatTime(s.end_time);
          return s.day_of_week === day && overlaps(slot.start, slot.end, start, end);
        });
        
        if (sched) {
          map.set(key, sched);
          
          // If it's a LAB (duration_slots === 2), mark the next slot as spanned
          if (sched.type === 'LAB' || sched.duration_slots === 2) {
            // Find the next actual slot (skip breaks/lunches)
            let actualNextIdx = slotIdx + 1;
            while (actualNextIdx < TIMESLOTS.length && TIMESLOTS[actualNextIdx].type !== 'slot') {
              actualNextIdx++;
            }
            if (actualNextIdx < TIMESLOTS.length) {
              const nextSlot = TIMESLOTS[actualNextIdx];
              const nextKey = `${day}_${nextSlot.start}_${nextSlot.end}`;
              spannedCells.add(nextKey);
              labCells.set(nextKey, sched); // Also store lab reference for the spanned cell
            }
          }
        } else {
          map.set(key, null);
        }
      }
    }
    return { map, spannedCells, labCells };
  }, [schedules]);

  return (
    <div className="rounded-xl border border-black/80 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black/80 px-3 py-2 text-left text-sm font-semibold text-gray-700 w-28">
                Day/TIME
              </th>
              {TIMESLOTS.map((slot) => (
                <th
                  key={`${slot.start}-${slot.end}`}
                  className="border border-black/80 px-1 py-1 text-center text-[10px] font-bold text-gray-700 leading-tight uppercase"
                  style={{ minWidth: slot.type === 'slot' ? 120 : 35 }}
                >
                  <div className="whitespace-pre-line">
                    {slot.label.replace('-', '-\n')}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => (
              <tr key={day} className="bg-white">
                <td className="border border-black/80 px-3 py-2 text-sm font-medium text-gray-800">
                  {getDayLabel(day)}
                </td>
                {TIMESLOTS.map((slot) => {
                  const key = `${day}_${slot.start}_${slot.end}`;
                  
                  // Skip this cell if it's part of a spanned lab (it's rendered as part of previous cell)
                  if (cellMap.spannedCells.has(key)) {
                    return null;
                  }
                  
                  if (slot.type === 'break') {
                    // Only render break cell for the first day, span all days
                    if (day === DAYS[0]) {
                      return (
                        <td
                          key={key}
                          rowSpan={DAYS.length}
                          className="border border-black/80 bg-amber-50 align-middle w-10 text-center"
                          style={{ minWidth: 35 }}
                        >
                          <div className="flex items-center justify-center h-full min-h-[52px] py-4">
                            <span className="text-amber-800 font-bold text-xl uppercase tracking-[0.2em] [writing-mode:vertical-lr] -rotate-180 scale-y-100">
                              SHORT BREAK
                            </span>
                          </div>
                        </td>
                      );
                    } else {
                      // Skip break cells for other days since first day spans all rows
                      return null;
                    }
                  }
                  if (slot.type === 'lunch') {
                    // Only render lunch cell for the first day, span all days
                    if (day === DAYS[0]) {
                      return (
                        <td
                          key={key}
                          rowSpan={DAYS.length}
                          className="border border-black/80 bg-emerald-50 align-middle w-10 text-center"
                          style={{ minWidth: 35 }}
                        >
                          <div className="flex items-center justify-center h-full min-h-[52px] py-4">
                            <span className="text-emerald-800 font-bold text-xl uppercase tracking-[0.2em] [writing-mode:vertical-lr] -rotate-180 scale-y-100">
                              LUNCH BREAK
                            </span>
                          </div>
                        </td>
                      );
                    } else {
                      // Skip lunch cells for other days since first day spans all rows
                      return null;
                    }
                  }
                  
                  const sched = cellMap.map.get(key);
                  const isFilled = !!sched;
                  const isLab = sched?.type === 'LAB' || sched?.duration_slots === 2;
                  const { content, cellClass } = renderCellContent(sched);
                  const fillClass = isFilled ? cellClass : 'bg-white hover:bg-gray-50';

                  return (
                    <td
                      key={key}
                      colSpan={isLab ? 2 : 1}
                      className={`border border-black/80 align-top ${fillClass} p-0`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          console.log('Cell clicked:', { 
                            day, 
                            slotStart: slot.start, 
                            hasSchedule: !!sched, 
                            schedType: sched?.type, 
                            schedId: sched?._id,
                            isLab,
                            colSpan: isLab ? 2 : 1
                          });
                          if (onCellClick) {
                            onCellClick(day, slot, sched);
                          }
                        }}
                        className={`w-full h-full min-h-[52px] px-2 py-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-inset ${
                          isLab ? 'focus:ring-purple-500' : 'focus:ring-blue-500'
                        } ${isFilled ? 'cursor-pointer hover:opacity-90' : 'rounded-lg cursor-pointer'}`}
                        style={{ 
                          display: 'block', 
                          width: '100%', 
                          minHeight: '52px',
                          background: 'transparent',
                          border: 'none',
                          pointerEvents: 'auto'
                        }}
                      >
                        {isFilled ? (
                          content
                        ) : (
                          <span className="text-gray-400 text-2xl font-light leading-none pointer-events-none">+</span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
