/**
 * Security event logging system for Kibble application.
 * 
 * This module provides comprehensive logging of security-critical events for
 * audit, monitoring, and compliance purposes. Security events are always
 * logged, even in production, to maintain a complete audit trail.
 * 
 * Security Events Logged:
 * - Account deletions
 * - Password reset requests and completions
 * - MFA enable/disable operations
 * - Failed authentication attempts
 * - Permission violations and unauthorized access attempts
 * 
 * Production Considerations:
 * - In production, these logs should be sent to a centralized logging service
 * - Recommended services: CloudWatch, Logtail, Datadog, or custom solution
 * - Logs include IP addresses, user agents, and timestamps for forensics
 * 
 * @module lib/security-logger
 */

/**
 * Types of security events that can be logged.
 * 
 * Each event type represents a security-critical operation that requires
 * audit logging for compliance and security monitoring.
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
 * Structure of a security event log entry.
 * 
 * Contains all relevant information for security auditing, including user
 * identification, IP address, user agent, and event-specific details.
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
 * Logs a security event for audit and monitoring purposes.
 * 
 * Security events are always logged, even in production, to maintain a
 * complete audit trail. This function bypasses the normal development-only
 * logger because security events must be captured in all environments.
 * 
 * Production Integration:
 * In production environments, this function should be modified to send
 * events to a centralized logging service such as:
 * - AWS CloudWatch
 * - Better Stack (Logtail)
 * - Datadog
 * - Custom logging service
 * 
 * @param event - Security event to log with all relevant details
 * 
 * @example
 * ```typescript
 * logSecurityEvent({
 *   type: "authentication_failed",
 *   email: "user@example.com",
 *   ipAddress: "192.168.1.1",
 *   userAgent: "Mozilla/5.0...",
 *   timestamp: new Date(),
 *   details: { reason: "Invalid password" },
 * });
 * ```
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

  // Security events are always logged (even in production) for audit purposes
  // Use console.log directly for security events to ensure they're always captured
  // In production, this should be sent to a logging service instead
  if (typeof process !== "undefined" && process.stdout) {
    // Use process.stdout.write for better control in serverless environments
    process.stdout.write(
      `[SECURITY EVENT] ${JSON.stringify(logEntry)}\n`
    );
  } else {
    // Fallback to console.log if process.stdout is not available
    console.log("[SECURITY EVENT]", JSON.stringify(logEntry, null, 2));
  }

  // In production, you would send this to:
  // - CloudWatch (AWS)
  // - Logtail (Better Stack)
  // - Datadog
  // - Custom logging service
}

/**
 * Extracts the client IP address from request headers.
 * 
 * Checks multiple headers in order of preference to find the real client IP,
 * accounting for proxies, load balancers, and CDNs that may modify headers.
 * 
 * Header Priority:
 * 1. `x-forwarded-for` - Standard proxy header (takes first IP if multiple)
 * 2. `x-real-ip` - Nginx and other reverse proxies
 * 3. `cf-connecting-ip` - Cloudflare CDN
 * 
 * @param headers - Request headers object
 * @returns Client IP address if found, `undefined` otherwise
 * 
 * @example
 * ```typescript
 * const ip = getClientIP(request.headers);
 * logSecurityEvent({ ..., ipAddress: ip });
 * ```
 */
export function getClientIP(headers: Headers): string | undefined {
  // Check x-forwarded-for first (most common proxy header)
  // If multiple IPs, take the first one (original client)
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  // Check x-real-ip (Nginx and other reverse proxies)
  const realIP = headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Check Cloudflare-specific header
  const cfConnectingIP = headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return undefined;
}

/**
 * Extracts the user agent string from request headers.
 * 
 * The user agent provides information about the client's browser, operating
 * system, and device, which is useful for security logging and analytics.
 * 
 * @param headers - Request headers object
 * @returns User agent string if present, `undefined` otherwise
 * 
 * @example
 * ```typescript
 * const userAgent = getUserAgent(request.headers);
 * logSecurityEvent({ ..., userAgent });
 * ```
 */
export function getUserAgent(headers: Headers): string | undefined {
  return headers.get("user-agent") || undefined;
}
