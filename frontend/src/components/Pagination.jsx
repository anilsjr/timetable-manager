/**
 * Reusable Pagination component with page numbers, prev/next, and records-per-page
 */
export default function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions = [5, 10, 20, 50],
}) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Rows per page:</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange?.(Number(e.target.value))}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          {limitOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <span>
          {total > 0 ? `${start}-${end} of ${total}` : '0 of 0'}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange?.(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          &lt;
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let p;
          if (totalPages <= 5) p = i + 1;
          else if (page <= 3) p = i + 1;
          else if (page >= totalPages - 2) p = totalPages - 4 + i;
          else p = page - 2 + i;
          return (
            <button
              key={p}
              onClick={() => onPageChange?.(p)}
              className={`px-3 py-1 border rounded text-sm ${
                page === p ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange?.(page + 1)}
          disabled={page >= totalPages || totalPages === 0}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
