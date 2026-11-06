import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce values (e.g. search queries) to reduce API request churn.
 * Adheres to WasteWise Rule 6.2 (minimum 300ms debounce).
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

