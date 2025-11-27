/**
 * Date Utilities
 * 
 * Provides functions for date formatting and locale-aware date handling.
 */

/**
 * Gets the locale-specific date format string for display
 * 
 * @returns Format string like "DD/MM/YYYY" or "MM/DD/YYYY" based on locale
 * 
 * @internal - Only used internally by getDateInputFormatHint
 */
function getLocaleDateFormat(): string {
  if (typeof window === "undefined" || typeof Intl === "undefined") {
    // Fallback to a common format
    return "DD/MM/YYYY";
  }

  try {
    // Use Intl.DateTimeFormat to get locale-specific format
    const formatter = new Intl.DateTimeFormat(navigator.language, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    // Get a sample date to determine format
    const sampleDate = new Date(2024, 0, 15); // January 15, 2024
    const formatted = formatter.format(sampleDate);

    // Determine format pattern
    // If day comes first (15/01/2024), it's DD/MM/YYYY
    // If month comes first (01/15/2024), it's MM/DD/YYYY
    const parts = formatted.split(/[/-]/);
    if (parts.length >= 3) {
      const firstPart = parts[0];
      const secondPart = parts[1];

      // Check if first part is day (15) or month (01)
      if (parseInt(firstPart) > 12) {
        // First part is day (15), so format is DD/MM/YYYY
        return "DD/MM/YYYY";
      } else if (parseInt(secondPart) > 12) {
        // Second part is day, so format is MM/DD/YYYY
        return "MM/DD/YYYY";
      }
    }

    // Default fallback
    return "DD/MM/YYYY";
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === "development") {
      console.warn("Error determining locale date format:", error);
    }
    return "DD/MM/YYYY";
  }
}

/**
 * Gets a user-friendly date format hint for input fields
 * 
 * @returns Format hint like "DD/MM/YYYY HH:MM" based on locale
 */
export function getDateInputFormatHint(): string {
  const dateFormat = getLocaleDateFormat();
  return `${dateFormat} HH:MM`;
}
