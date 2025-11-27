/**
 * Security Event Logger
 * 
 * Logs security-critical events for audit and monitoring.
 * 
 * Events logged:
 * - Account deletions
 * - Password resets
 * - MFA enable/disable
 * - Failed authentication attempts
 * - Permission violations
 */

/**
 * Security event types
 */
export type SecurityEventType =
  | "account_deleted"
  | "password_reset_requested"
  | "password_reset_completed"
  | "password_reset_failed"
  | "mfa_enabled"
  | "mfa_disabled"
  | "mfa_verification_failed"
  | "authentication_failed"
  | "permission_denied"
  | "unauthorized_access_attempt";

/**
 * Security event data
 */
export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

/**
 * Logs a security event
 * 
 * @param event - Security event to log
 * 
 * In production, this should be sent to a logging service.
 * For now, it logs to console with structured format.
 */
export function logSecurityEvent(event: SecurityEvent): void {
  const logEntry = {
    type: event.type,
    userId: event.userId || "unknown",
    email: event.email || "unknown",
    timestamp: event.timestamp.toISOString(),
    ipAddress: event.ipAddress || "unknown",
    userAgent: event.userAgent || "unknown",
    details: event.details || {},
  };

  // Log to console (in production, send to logging service)
  console.log("[SECURITY EVENT]", JSON.stringify(logEntry, null, 2));

  // In production, you would send this to:
  // - CloudWatch (AWS)
  // - Logtail (Better Stack)
  // - Datadog
  // - Custom logging service
}

/**
 * Helper to get client IP from request headers
 * 
 * @param headers - Request headers
 * @returns IP address or undefined
 */
export function getClientIP(headers: Headers): string | undefined {
  // Check various headers for IP (in order of preference)
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return undefined;
}

/**
 * Helper to get user agent from request headers
 * 
 * @param headers - Request headers
 * @returns User agent or undefined
 */
export function getUserAgent(headers: Headers): string | undefined {
  return headers.get("user-agent") || undefined;
}
