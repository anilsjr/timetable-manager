import { useDebounce } from '../hooks/useDebounce';

/**
 * Debounced search input (300-500ms)
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 400,
}) {
  const [localValue, setLocalValue] = useDebounce(value, onChange, debounceMs);

  return (
    <input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      placeholder={placeholder}
      className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  );
}
