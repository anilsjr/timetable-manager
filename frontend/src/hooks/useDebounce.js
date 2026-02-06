import { useState, useEffect } from 'react';

/**
 * Debounced value - local state syncs to parent via onChange after delay
 * Returns [localValue, setLocalValue] for use in controlled input
 */
export function useDebounce(initialValue, onChange, delay = 400) {
  const [value, setValue] = useState(initialValue ?? '');

  useEffect(() => {
    setValue(initialValue ?? '');
  }, [initialValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange?.(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return [value, setValue];
}
