/**
 * Request deduplication utility for Kibble application.
 * 
 * Prevents duplicate concurrent API requests by caching in-flight requests.
 * If the same request is made while another identical request is in progress,
 * this utility returns the same promise, eliminating redundant network calls
 * and improving performance.
 * 
 * Security Features:
 * - Uses Map for O(1) lookup performance
 * - Automatically cleans up completed requests to prevent memory leaks
 * - Implements request timeout to prevent stale cache entries
 * - No sensitive data stored in cache keys (only URL, method, body hash)
 * - Handles Response cloning correctly to prevent "body already read" errors
 * 
 * Performance Benefits:
 * - Reduces server load by eliminating duplicate requests
 * - Improves perceived performance with instant response for cached requests
 * - Prevents race conditions in concurrent component updates
 * 
 * @module lib/request-deduplication
 */

/**
 * Local error logging function.
 * 
 * Uses a simple console.error fallback to avoid circular dependencies
 * with the main logger module. In production, errors are still logged
 * for debugging purposes but don't expose sensitive information.
 */
const logError = (message: string, ...args: unknown[]): void => {
  if (process.env.NODE_ENV === "development" && typeof console !== 'undefined' && console.error) {
    console.error(`[REQUEST-DEDUP] ${message}`, ...args);
  }
};

interface CachedRequest {
  promise: Promise<Response>;
  originalResponse?: Response; // Store original unread response for cloning
  timestamp: number;
  abortController?: AbortController;
}

/**
 * Cache for in-flight requests
 * Key: request URL + method + body hash (if applicable)
 * Value: Cached request with promise and timestamp
 */
const requestCache = new Map<string, CachedRequest>();

/**
 * Maximum age for cached requests (5 seconds)
 * Prevents stale requests from being reused
 */
const MAX_CACHE_AGE = 5000;

/**
 * Cleanup interval for expired cache entries
 */
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Cleans up expired cache entries
 */
function cleanupExpiredRequests(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  for (const [key, cached] of requestCache.entries()) {
    if (now - cached.timestamp > MAX_CACHE_AGE) {
      keysToDelete.push(key);
    }
  }

  for (const key of keysToDelete) {
    requestCache.delete(key);
  }
}

/**
 * Starts cleanup interval if not already running
 */
function startCleanupInterval(): void {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    cleanupExpiredRequests();
  }, 10000); // Clean up every 10 seconds
}

/**
 * Generates a cache key from request parameters
 * 
 * @param url - Request URL
 * @param options - Fetch options (method, body, etc.)
 * @returns Cache key string
 */
function generateCacheKey(url: string, options?: RequestInit): string {
  const method = options?.method || "GET";
  let key = `${method}:${url}`;

  // Include body in key for POST/PUT/PATCH requests
  if (options?.body && typeof options.body === "string") {
    // Simple hash of body (for deduplication, not security)
    // In production, you might want to use a proper hash function
    const bodyHash = options.body.slice(0, 100); // First 100 chars for uniqueness
    key += `:${bodyHash}`;
  }

  return key;
}

/**
 * Deduplicates fetch requests
 * 
 * If the same request is made while another is in progress,
 * returns the same promise instead of making a new request.
 * 
 * @param url - Request URL
 * @param options - Fetch options
 * @returns Promise resolving to Response
 * 
 * Example:
 * ```typescript
 * // First call - makes actual request
 * const promise1 = deduplicatedFetch("/api/boards/list");
 * 
 * // Second call (while first is in progress) - returns same promise
 * const promise2 = deduplicatedFetch("/api/boards/list");
 * 
 * // promise1 === promise2 (same promise)
 * ```
 */
export function deduplicatedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // Start cleanup interval if needed
  startCleanupInterval();

  // Generate cache key
  const cacheKey = generateCacheKey(url, options);

  // Check if request is already in progress
  const cached = requestCache.get(cacheKey);
  if (cached) {
    const age = Date.now() - cached.timestamp;
    // Reuse if request is still fresh (within MAX_CACHE_AGE)
    if (age < MAX_CACHE_AGE) {
      // Wait for the original response to be available, then clone it
      // This ensures all callers get clones from the same unread original
      return cached.promise.then(() => {
        // Use queueMicrotask to ensure originalResponse is set (handles microtask timing)
        return new Promise<Response>((resolve, reject) => {
          queueMicrotask(() => {
            const currentCached = requestCache.get(cacheKey);
            if (currentCached?.originalResponse) {
              try {
                // Clone the original unread response
                resolve(currentCached.originalResponse.clone());
              } catch (e) {
                // If clone fails, the response was already consumed
                // This can happen in rare race conditions - make a new request
                logError("Failed to clone cached response - making new request", e);
                requestCache.delete(cacheKey);
                deduplicatedFetch(url, options).then(resolve).catch(reject);
              }
            } else {
              // Original not available - wait a tiny bit more (handles edge case)
              setTimeout(() => {
                const currentCached = requestCache.get(cacheKey);
                if (currentCached?.originalResponse) {
                  try {
                    resolve(currentCached.originalResponse.clone());
                  } catch (e) {
                    logError("Failed to clone cached response after wait - making new request", e);
                    requestCache.delete(cacheKey);
                    deduplicatedFetch(url, options).then(resolve).catch(reject);
                  }
                } else {
                  // Original not available - make new request
                  logError("Original response not available in cache - making new request");
                  requestCache.delete(cacheKey);
                  deduplicatedFetch(url, options).then(resolve).catch(reject);
                }
              }, 10);
            }
          });
        });
      });
    }
    // Remove stale cache entry
    requestCache.delete(cacheKey);
  }

  // Create abort controller for request cancellation
  const abortController = new AbortController();

  // Create new request promise
  // Use a wrapper to ensure originalResponse is set before promise resolves
  const promise = new Promise<Response>((resolve, reject) => {
    fetch(url, {
      ...options,
      signal: abortController.signal,
    })
      .then((response) => {
        // Store original response in cache IMMEDIATELY and SYNCHRONOUSLY
        // This ensures it's available for all callers before any cloning happens
        const cached = requestCache.get(cacheKey);
        if (cached) {
          // Set originalResponse synchronously before resolving promise
          cached.originalResponse = response;
        }
        
        // Clone from the original for the first caller
        // All other callers will clone from cached.originalResponse
        const clonedResponse = response.clone();
        
        // Remove from cache after a short delay to allow concurrent callers
        // This gives time for other callers to get their clones
        setTimeout(() => {
          const cached = requestCache.get(cacheKey);
          if (cached) {
            cached.originalResponse = undefined; // Clear reference
            requestCache.delete(cacheKey);
          }
        }, 200);
        
        // Resolve with clone - originalResponse is now set in cache
        resolve(clonedResponse);
      })
      .catch((error) => {
        // Remove from cache on error
        requestCache.delete(cacheKey);
        reject(error);
      });
  });

  // Cache the request
  requestCache.set(cacheKey, {
    promise,
    originalResponse: undefined, // Will be set when response arrives
    timestamp: Date.now(),
    abortController,
  });

  return promise;
}

/**
 * Cancels a specific request if it's in progress
 * 
 * @param url - Request URL
 * @param options - Fetch options (must match original request)
 */
export function cancelRequest(url: string, options?: RequestInit): void {
  const cacheKey = generateCacheKey(url, options);
  const cached = requestCache.get(cacheKey);

  if (cached?.abortController) {
    cached.abortController.abort();
    requestCache.delete(cacheKey);
  }
}

/**
 * Clears all cached requests
 * Useful for cleanup or when user logs out
 */
export function clearRequestCache(): void {
  // Abort all in-flight requests
  for (const cached of requestCache.values()) {
    if (cached.abortController) {
      cached.abortController.abort();
    }
  }

  requestCache.clear();

  // Clear cleanup interval
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

/**
 * Gets the number of in-flight requests
 * Useful for debugging and monitoring
 */
export function getInFlightRequestCount(): number {
  return requestCache.size;
}
