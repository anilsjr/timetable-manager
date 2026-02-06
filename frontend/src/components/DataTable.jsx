/**
 * Reusable DataTable component with configurable columns and actions
 */
export default function DataTable({ columns, data, loading, emptyMessage = 'No data found' }) {
  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded h-64 flex items-center justify-center">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="bg-white rounded border border-gray-200 p-12 text-center text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-700 text-white">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-12">
              #
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-32">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, idx) => (
            <tr key={row._id || idx} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-700">{idx + 1}</td>
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              <td className="px-4 py-3 text-sm">
                {row._actions}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
