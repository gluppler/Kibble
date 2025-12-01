/**
 * Debounce Utility
 * 
 * Provides debouncing functionality to limit the rate of function calls.
 * Useful for optimizing drag-and-drop operations, search inputs, and API calls.
 * 
 * @module lib/debounce
 */

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last invocation.
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function
 * 
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   performSearch(query);
 * }, 300);
 * 
 * // Only the last call within 300ms will execute
 * debouncedSearch("a");
 * debouncedSearch("ab");
 * debouncedSearch("abc"); // Only this will execute after 300ms
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

/**
 * Creates a debounced function that also returns a cancel function.
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns An object with the debounced function and a cancel function
 * 
 * @example
 * ```typescript
 * const { debounced, cancel } = debounceWithCancel((value: string) => {
 *   console.log(value);
 * }, 300);
 * 
 * debounced("test");
 * cancel(); // Cancels the pending execution
 * ```
 */
export function debounceWithCancel<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): {
  debounced: (...args: Parameters<T>) => void;
  cancel: () => void;
} {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };

  const cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return { debounced, cancel };
}
