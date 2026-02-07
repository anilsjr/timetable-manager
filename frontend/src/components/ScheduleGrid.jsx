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
                  const subjectCode = sched?.subject?.code || sched?.subject?.short_name;
                  const facultyName = sched?.teacher?.short_abbr || sched?.teacher?.name || '';
                  const fillColors = ['bg-blue-50', 'bg-violet-50', 'bg-sky-50', 'bg-indigo-50'];
                  const fillClass = isFilled
                    ? fillColors[(subjectCode?.length || 0) % fillColors.length]
                    : 'bg-white hover:bg-gray-50';

                  return (
                    <td
                      key={key}
                      className={`border border-gray-200 align-top ${fillClass}`}
                    >
                      <button
                        type="button"
                        onClick={() => onCellClick(day, slot, sched)}
                        className="w-full min-h-[52px] p-2 text-left text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                      >
                        {isFilled ? (
                          <span className="block">
                            <span className="font-medium text-gray-900">{subjectCode}</span>
                            <br />
                            <span className="text-gray-600 text-xs">{facultyName}</span>
                          </span>
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
