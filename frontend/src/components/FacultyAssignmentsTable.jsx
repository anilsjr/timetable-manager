export default function FacultyAssignmentsTable({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8 text-center text-gray-500">
        Loading faculty assignments…
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8 text-center text-gray-500">
        No faculty assignments for this class.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-800">Faculty Assignments</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-200 px-4 py-2.5 text-left text-sm font-semibold text-gray-700">
                Code
              </th>
              <th className="border border-gray-200 px-4 py-2.5 text-left text-sm font-semibold text-gray-700">
                Subject
              </th>
              <th className="border border-gray-200 px-4 py-2.5 text-left text-sm font-semibold text-gray-700">
                Faculty
              </th>
              <th className="border border-gray-200 px-4 py-2.5 text-left text-sm font-semibold text-gray-700">
                Coordinators
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="bg-white hover:bg-gray-50/50">
                <td className="border border-gray-200 px-4 py-2.5 text-sm text-gray-900 font-medium">
                  {row.subjectCode || '—'}
                </td>
                <td className="border border-gray-200 px-4 py-2.5 text-sm text-gray-800">
                  {row.subjectName || '—'}
                </td>
                <td className="border border-gray-200 px-4 py-2.5 text-sm text-gray-700">
                  {row.facultyName || '---'}
                </td>
                <td className="border border-gray-200 px-4 py-2.5 text-sm text-gray-700">
                  {row.coordinatorName || '---'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
