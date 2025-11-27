/**
 * Logger Utility
 * 
 * Centralized logging that only logs in development mode.
 * In production, errors are handled silently to prevent information leakage.
 */

/**
 * Logs an error message (development only)
 */
export function logError(message: string, error?: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.error(message, error);
  }
}

/**
 * Logs a warning message (development only)
 */
export function logWarn(message: string, data?: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.warn(message, data);
  }
}

/**
 * Logs an info message (development only)
 */
export function logInfo(message: string, data?: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.log(message, data);
  }
}
