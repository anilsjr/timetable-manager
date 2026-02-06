/**
 * Dashboard stat card (icon, label, value)
 */
export default function SummaryCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        {icon && (
          <div className="p-3 bg-blue-100 rounded-full text-blue-600 text-2xl">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
