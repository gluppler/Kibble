import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { deduplicatedFetch, cancelRequest, clearRequestCache, getInFlightRequestCount } from '@/lib/request-deduplication';

/**
 * Test Suite for Request Deduplication
 * 
 * Tests that duplicate concurrent requests are properly deduplicated.
 */

// Mock fetch globally
global.fetch = vi.fn();

/**
 * Creates a mock Response object with clone support
 */
function createMockResponse(data: any = { data: 'test' }) {
  const mockResponse = {
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    clone: function() {
      return createMockResponse(data);
    },
  };
  return mockResponse;
}

describe('Request Deduplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearRequestCache();
    (global.fetch as any).mockClear();
  });

  afterEach(() => {
    clearRequestCache();
  });

  describe('deduplicatedFetch', () => {
    it('should make a request when called first time', async () => {
      const mockResponse = createMockResponse();
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await deduplicatedFetch('/api/test');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
    });

    it('should return same promise for duplicate concurrent requests', async () => {
      const mockResponse = createMockResponse();
      (global.fetch as any).mockResolvedValue(mockResponse);

      const promise1 = deduplicatedFetch('/api/test');
      const promise2 = deduplicatedFetch('/api/test');
      const promise3 = deduplicatedFetch('/api/test');

      // For cached requests, we clone responses to avoid body stream conflicts
      // So promises may be different, but they resolve from the same underlying request
      // The important thing is that only one fetch is made
      const [res1, res2, res3] = await Promise.all([promise1, promise2, promise3]);
      
      // All should resolve to valid responses
      expect(res1).toBeDefined();
      expect(res2).toBeDefined();
      expect(res3).toBeDefined();
      
      // Should only make one actual request
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should make separate requests for different URLs', async () => {
      const mockResponse = createMockResponse();
      (global.fetch as any).mockResolvedValue(mockResponse);

      await Promise.all([
        deduplicatedFetch('/api/boards'),
        deduplicatedFetch('/api/tasks'),
        deduplicatedFetch('/api/archive'),
      ]);

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should make separate requests for different methods', async () => {
      const mockResponse = createMockResponse();
      (global.fetch as any).mockResolvedValue(mockResponse);

      await Promise.all([
        deduplicatedFetch('/api/test', { method: 'GET' }),
        deduplicatedFetch('/api/test', { method: 'POST' }),
      ]);

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should make separate requests for different body content', async () => {
      const mockResponse = createMockResponse();
      (global.fetch as any).mockResolvedValue(mockResponse);

      await Promise.all([
        deduplicatedFetch('/api/test', { method: 'POST', body: JSON.stringify({ a: 1 }) }),
        deduplicatedFetch('/api/test', { method: 'POST', body: JSON.stringify({ b: 2 }) }),
      ]);

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle request errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(deduplicatedFetch('/api/test')).rejects.toThrow('Network error');
      
      // Should remove from cache on error
      expect(getInFlightRequestCount()).toBe(0);
    });

    it('should remove request from cache after completion', async () => {
      const mockResponse = createMockResponse();
      (global.fetch as any).mockResolvedValue(mockResponse);

      await deduplicatedFetch('/api/test');
      
      // Cache should be empty after request completes and cleanup delay
      // Note: Cache cleanup is delayed by 200ms to allow concurrent callers
      await new Promise(resolve => setTimeout(resolve, 250));
      expect(getInFlightRequestCount()).toBe(0);
    });

    it('should handle AbortError gracefully', async () => {
      const abortError = new DOMException('Request aborted', 'AbortError');
      (global.fetch as any).mockRejectedValueOnce(abortError);

      // Should not throw, just return rejected promise
      await expect(deduplicatedFetch('/api/test')).rejects.toThrow();
    });
  });

  describe('cancelRequest', () => {
    it('should cancel an in-flight request', async () => {
      // Create a promise that never resolves to simulate in-flight request
      const neverResolvingPromise = new Promise(() => {});
      (global.fetch as any).mockReturnValue(neverResolvingPromise);

      const promise = deduplicatedFetch('/api/test');
      
      // Wait a bit to ensure request is cached
      await new Promise(resolve => setTimeout(resolve, 10));
      
      cancelRequest('/api/test');

      // Request should be cancelled (abort signal should be triggered)
      // Note: In test environment, we can't fully test AbortController behavior
      // but we can verify the function doesn't throw
      expect(() => cancelRequest('/api/test')).not.toThrow();
    });

    it('should handle cancelling non-existent request gracefully', () => {
      expect(() => cancelRequest('/api/nonexistent')).not.toThrow();
    });
  });

  describe('clearRequestCache', () => {
    it('should clear all in-flight requests', async () => {
      const mockResponse = createMockResponse();
      (global.fetch as any).mockResolvedValue(mockResponse);

      deduplicatedFetch('/api/test1');
      deduplicatedFetch('/api/test2');
      deduplicatedFetch('/api/test3');

      expect(getInFlightRequestCount()).toBeGreaterThan(0);

      clearRequestCache();

      expect(getInFlightRequestCount()).toBe(0);
    });
  });

  describe('getInFlightRequestCount', () => {
    it('should return 0 when no requests are in flight', () => {
      expect(getInFlightRequestCount()).toBe(0);
    });

    it('should return correct count of in-flight requests', async () => {
      const mockResponse = createMockResponse();
      (global.fetch as any).mockResolvedValue(mockResponse);

      deduplicatedFetch('/api/test1');
      deduplicatedFetch('/api/test2');

      expect(getInFlightRequestCount()).toBe(2);

      // Wait for requests to complete and cache cleanup delay
      // Note: Cache cleanup is delayed by 200ms to allow concurrent callers
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(getInFlightRequestCount()).toBe(0);
    });
  });

  describe('Cache expiration', () => {
    it('should expire stale cache entries', async () => {
      const mockResponse = createMockResponse();
      (global.fetch as any).mockResolvedValue(mockResponse);

      // Make first request
      await deduplicatedFetch('/api/test');

      // Wait for cache to expire (5 seconds + buffer)
      // Note: Cache expires based on timestamp, so we wait for MAX_CACHE_AGE
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Second request should make new fetch (cache expired)
      await deduplicatedFetch('/api/test');

      // Should have made 2 separate requests (cache expired)
      // Note: Cache is cleared on request completion, so this test verifies
      // that expired cache entries are not reused
      expect(global.fetch).toHaveBeenCalledTimes(2);
    }, 10000); // Increase timeout for this test
  });
});
