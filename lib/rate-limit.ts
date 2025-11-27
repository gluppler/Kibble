/**
 * Rate Limiting Utility
 * 
 * Simple in-memory rate limiter for API routes.
 * 
 * Note: For production, consider using Redis or a database-backed rate limiter
 * for distributed systems and persistence across serverless invocations.
 * 
 * Security:
 * - Tracks attempts by IP address and email
 * - Configurable limits and window duration
 * - Cleans up expired entries periodically
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (cleared on server restart)
// In production, use Redis or database
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval: remove expired entries every 5 minutes
// Store interval ID for cleanup (though in serverless this may not be necessary)
let cleanupInterval: NodeJS.Timeout | null = null;

if (typeof setInterval !== "undefined") {
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    // Collect expired keys first to avoid modifying map during iteration
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        keysToDelete.push(key);
      }
    }
    
    // Delete expired entries
    for (const key of keysToDelete) {
      rateLimitStore.delete(key);
    }
  }, 5 * 60 * 1000);
  
  // Cleanup on process exit (if available)
  if (typeof process !== "undefined" && process.on) {
    process.on("SIGTERM", () => {
      if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
      }
    });
  }
}

export interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  error?: string;
}

/**
 * Check rate limit for a given key
 * 
 * @param key - Unique identifier (e.g., IP address, email)
 * @param options - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  }
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // No entry or expired - create new entry
    const resetAt = now + options.windowMs;
    rateLimitStore.set(key, {
      count: 1,
      resetAt,
    });

    return {
      allowed: true,
      remaining: options.maxAttempts - 1,
      resetAt,
    };
  }

  // Entry exists and is valid
  if (entry.count >= options.maxAttempts) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      error: `Too many attempts. Please try again after ${Math.ceil((entry.resetAt - now) / 1000 / 60)} minutes.`,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: options.maxAttempts - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Reset rate limit for a given key
 * 
 * @param key - Unique identifier
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
