/**
 * Date Formatter Utilities
 * 
 * Shared date formatting functions used across multiple components.
 * Extracted to avoid code duplication.
 */

/**
 * Formats a date to DD/MM/YYYY format
 * 
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateToDDMMYYYY(date: Date | string | null | undefined): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return "";
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Calculates due date status
 * 
 * @param dueDate - Due date to check
 * @returns Status object with status type and days until due
 */
export function getDueDateStatus(dueDate: Date | string | null | undefined): {
  status: "overdue" | "due-soon" | "upcoming" | null;
  daysUntil: number | null;
} {
  if (!dueDate) return { status: null, daysUntil: null };

  const now = new Date();
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  
  if (isNaN(due.getTime())) return { status: null, daysUntil: null };
  
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: "overdue", daysUntil: Math.abs(diffDays) };
  } else if (diffDays === 0) {
    return { status: "due-soon", daysUntil: 0 };
  } else if (diffDays <= 3) {
    return { status: "due-soon", daysUntil: diffDays };
  } else {
    return { status: "upcoming", daysUntil: diffDays };
  }
}
