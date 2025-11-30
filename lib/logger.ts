/**
 * Centralized logging utility for Kibble application.
 * 
 * All logging functions only operate in development mode to prevent
 * information leakage in production environments. This ensures sensitive
 * data, stack traces, and internal state are never exposed to end users.
 * 
 * @module lib/logger
 */

/**
 * Logs an error message to the console.
 * 
 * Only executes in development mode. In production, errors are handled
 * silently to prevent information leakage.
 * 
 * @param message - Error message to log
 * @param error - Optional error object or additional data
 * 
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   logError("Failed to perform operation", error);
 * }
 * ```
 */
export function logError(message: string, error?: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.error(message, error);
  }
}

/**
 * Logs a warning message to the console.
 * 
 * Only executes in development mode. Use for non-critical issues
 * that should be investigated but don't prevent operation.
 * 
 * @param message - Warning message to log
 * @param data - Optional additional data for context
 * 
 * @example
 * ```typescript
 * if (deprecatedFeature) {
 *   logWarn("Deprecated feature used", { feature: deprecatedFeature });
 * }
 * ```
 */
export function logWarn(message: string, data?: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.warn(message, data);
  }
}

/**
 * Logs an informational message to the console.
 * 
 * Only executes in development mode. Use for debugging and
 * development-time information.
 * 
 * @param message - Informational message to log
 * @param data - Optional additional data for context
 * 
 * @example
 * ```typescript
 * logInfo("User authenticated", { userId: user.id });
 * ```
 */
export function logInfo(message: string, data?: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.log(message, data);
  }
}

/**
 * Logs API request/response timing for performance monitoring.
 * 
 * Only executes in development mode or when explicitly enabled in production.
 * Use to monitor cold-start delays and API performance.
 * 
 * @param route - API route path
 * @param method - HTTP method
 * @param duration - Request duration in milliseconds
 * @param status - HTTP status code
 * 
 * @example
 * ```typescript
 * const start = Date.now();
 * const response = await fetch('/api/tasks');
 * logApiTiming('/api/tasks', 'GET', Date.now() - start, response.status);
 * ```
 */
export function logApiTiming(
  route: string,
  method: string,
  duration: number,
  status?: number
): void {
  // Log in development or if explicitly enabled in production
  if (process.env.NODE_ENV === "development" || process.env.ENABLE_API_LOGGING === "true") {
    const timing = duration > 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration}ms`;
    const statusText = status ? ` [${status}]` : "";
    console.log(`[API TIMING] ${method} ${route}${statusText} in ${timing}`);
    
    // Warn about slow requests (potential cold-start)
    if (duration > 2000) {
      console.warn(`[API TIMING] Slow request detected: ${method} ${route} took ${timing}`);
    }
  }
}
