import { useMemo } from 'react';
import { DAYS, TIMESLOTS, getDayLabel } from '../utils/dateHelpers';

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
    const labName =
      room?.short_name ||
      room?.name ||
      (room?.name ? shortNameFromFullName(room.name) : null) ||
      room?.code ||
      'Lab';
    const teacherShortName = schedule.teacher?.short_abbr || schedule.teacher?.name || '';
    const roomNo = room?.room_number || room?.code || room?.short_name || '—';
    const singleLine = teacherShortName ? `${labName} (${teacherShortName}) / ${roomNo}` : `${labName} / ${roomNo}`;

    return {
      content: (
        <span className="block font-semibold text-purple-900 text-sm leading-tight">
          {singleLine}
        </span>
      ),
      cellClass: 'bg-purple-100',
    };
  }

  // LECTURE / SUBJECT
  const subjectShortName =
    schedule.subject?.short_name ||
    schedule.subject?.code ||
    (schedule.subject?.full_name ? shortNameFromFullName(schedule.subject.full_name) : null) ||
    '—';
  const teacherShortName = schedule.teacher?.short_abbr || schedule.teacher?.name || '';

  return {
    content: (
      <span className="block text-blue-900">
        <span className="font-semibold block">{subjectShortName} (L)</span>
        <span className="text-xs text-blue-800/90">{teacherShortName}</span>
      </span>
    ),
    cellClass: 'bg-blue-100',
  };
}

export default function ScheduleGrid({ schedules = [], onCellClick }) {
  const cellMap = useMemo(() => {
    const map = new Map();
    for (const day of DAYS) {
      for (const slot of TIMESLOTS) {
        if (slot.type !== 'slot') continue;
        const key = `${day}_${slot.start}_${slot.end}`;
        const sched = schedules.find((s) => {
          const start = formatTime(s.start_time);
          const end = formatTime(s.end_time);
          return s.day_of_week === day && overlaps(slot.start, slot.end, start, end);
        });
        map.set(key, sched || null);
      }
    }
    return map;
  }, [schedules]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-200 px-3 py-2 text-left text-sm font-semibold text-gray-700 w-28">
                Day
              </th>
              {TIMESLOTS.map((slot) => (
                <th
                  key={`${slot.start}-${slot.end}`}
                  className="border border-gray-200 px-2 py-2 text-center text-xs font-medium text-gray-700 whitespace-nowrap"
                >
                  {slot.type === 'slot' ? slot.label : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => (
              <tr key={day} className="bg-white">
                <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800">
                  {getDayLabel(day)}
                </td>
                {TIMESLOTS.map((slot) => {
                  const key = `${day}_${slot.start}_${slot.end}`;
                  if (slot.type === 'break') {
                    return (
                      <td
                        key={key}
                        className="border border-gray-200 bg-amber-50 align-middle w-12"
                        style={{ minWidth: 40 }}
                      >
                        <div className="flex items-center justify-center h-full min-h-[52px] py-2">
                          <span className="text-amber-800 font-medium text-xs transform -rotate-90 whitespace-nowrap tracking-wide">
                            BREAK
                          </span>
                        </div>
                      </td>
                    );
                  }
                  if (slot.type === 'lunch') {
                    return (
                      <td
                        key={key}
                        className="border border-gray-200 bg-emerald-50 align-middle w-12"
                        style={{ minWidth: 40 }}
                      >
                        <div className="flex items-center justify-center h-full min-h-[52px] py-2">
                          <span className="text-emerald-800 font-medium text-xs transform -rotate-90 whitespace-nowrap tracking-wide">
                            LUNCH
                          </span>
                        </div>
                      </td>
                    );
                  }
                  const sched = cellMap.get(key);
                  const isFilled = !!sched;
                  const { content, cellClass } = renderCellContent(sched);
                  const fillClass = isFilled ? cellClass : 'bg-white hover:bg-gray-50';

                  return (
                    <td
                      key={key}
                      className={`border border-gray-200 align-top ${fillClass}`}
                    >
                      <button
                        type="button"
                        onClick={() => onCellClick(day, slot, sched)}
                        className="w-full min-h-[52px] p-2 text-left rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                      >
                        {isFilled ? (
                          content
                        ) : (
                          <span className="text-gray-400 text-2xl font-light leading-none">+</span>
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
