/**
 * Buffer Deprecation Warning Suppression
 * 
 * This module suppresses the Buffer() deprecation warning (DEP0005) that comes
 * from third-party dependencies (qrcode, otplib) that we cannot control.
 * 
 * Security Note:
 * - We only suppress DEP0005 (Buffer deprecation), not other security warnings
 * - Our own code uses safe Buffer methods (Buffer.from(), Buffer.alloc())
 * - This suppression is necessary because third-party libraries haven't updated yet
 * - The warning is non-blocking and doesn't affect functionality
 * 
 * @module lib/suppress-buffer-deprecation
 */

// Suppress Buffer deprecation warning immediately on module load
// This must run before any other modules that might trigger the warning
if (typeof process !== "undefined" && process.emitWarning) {
  const originalEmitWarning = process.emitWarning;
  
  // Override process.emitWarning to filter out DEP0005 warnings
  // Type assertion needed because process.emitWarning has complex overloads
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (process as any).emitWarning = function (
    warning: string | Error,
    type?: string | (() => void),
    code?: string,
    ctor?: (() => void)
  ) {
    // Only suppress DEP0005 (Buffer deprecation warning)
    // Allow all other warnings to pass through for security
    if (
      code === "DEP0005" ||
      (typeof warning === "string" && warning.includes("Buffer() is deprecated"))
    ) {
      return;
    }
    
    // Call original emitWarning for all other warnings
    // Use type assertion to handle complex overloads
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (originalEmitWarning as any).call(process, warning, type, code, ctor);
  };
}
