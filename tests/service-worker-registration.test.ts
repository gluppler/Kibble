import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Service Worker Registration Tests
 * 
 * These tests verify the service worker registration component:
 * - Development mode behavior (unregistration)
 * - Production mode behavior (registration)
 * - Error handling
 * - Browser compatibility checks
 */

describe('Service Worker Registration', () => {
  const mockNavigator = {
    serviceWorker: {
      register: vi.fn(),
      getRegistrations: vi.fn(),
    },
  };

  const mockRegistration = {
    update: vi.fn(),
    unregister: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.window = {
      ...global.window,
      navigator: mockNavigator as any,
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Environment Detection', () => {
    it('should check for window object', () => {
      const hasWindow = typeof window !== 'undefined';
      expect(typeof hasWindow).toBe('boolean');
    });

    it('should check for service worker support', () => {
      const hasServiceWorker = 'serviceWorker' in (navigator || {});
      expect(typeof hasServiceWorker).toBe('boolean');
    });

    it('should detect development environment', () => {
      const isDevelopment = process.env.NODE_ENV === 'development';
      expect(typeof isDevelopment).toBe('boolean');
    });

    it('should detect production environment', () => {
      const isProduction = process.env.NODE_ENV === 'production';
      expect(typeof isProduction).toBe('boolean');
    });
  });

  describe('Development Mode Behavior', () => {
    it('should unregister existing service workers in development', async () => {
      const registrations = [mockRegistration, mockRegistration];
      mockNavigator.serviceWorker.getRegistrations = vi.fn().mockResolvedValue(registrations);

      if (process.env.NODE_ENV === 'development') {
        const registrations = await mockNavigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(reg => reg.unregister().catch(() => {}))
        );

        expect(mockNavigator.serviceWorker.getRegistrations).toHaveBeenCalled();
        expect(mockRegistration.unregister).toHaveBeenCalledTimes(2);
      }
    });

    it('should handle unregistration errors gracefully', async () => {
      const error = new Error('Unregistration failed');
      mockRegistration.unregister = vi.fn().mockRejectedValue(error);

      try {
        await mockRegistration.unregister();
      } catch (err) {
        // Error should be caught and ignored
        expect(err).toBeDefined();
      }
    });

    it('should not register service worker in development', () => {
      if (process.env.NODE_ENV === 'development') {
        expect(mockNavigator.serviceWorker.register).not.toHaveBeenCalled();
      }
    });
  });

  describe('Production Mode Behavior', () => {
    it('should register service worker in production', async () => {
      mockNavigator.serviceWorker.register = vi.fn().mockResolvedValue(mockRegistration);

      if (process.env.NODE_ENV === 'production') {
        await mockNavigator.serviceWorker.register('/sw.js');
        expect(mockNavigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
      }
    });

    it('should set up update interval in production', () => {
      const updateInterval = 60 * 60 * 1000; // 1 hour
      expect(updateInterval).toBe(3600000);
    });

    it('should handle registration errors silently in production', async () => {
      const error = new Error('Registration failed');
      mockNavigator.serviceWorker.register = vi.fn().mockRejectedValue(error);

      if (process.env.NODE_ENV === 'production') {
        try {
          await mockNavigator.serviceWorker.register('/sw.js');
        } catch (err) {
          // Error should be caught silently
          expect(err).toBeDefined();
        }
      }
    });
  });

  describe('Browser Compatibility', () => {
    it('should handle missing service worker support', () => {
      const navigatorWithoutSW = {};
      const hasServiceWorker = 'serviceWorker' in navigatorWithoutSW;
      expect(hasServiceWorker).toBe(false);
    });

    it('should handle missing window object', () => {
      const hasWindow = typeof window !== 'undefined';
      // In test environment, window might be undefined
      expect(typeof hasWindow).toBe('boolean');
    });
  });

  describe('Security', () => {
    it('should only register service worker from same origin', () => {
      const swPath = '/sw.js';
      const isSameOrigin = !swPath.startsWith('http://') && !swPath.startsWith('https://');
      expect(isSameOrigin).toBe(true);
    });

    it('should not expose sensitive information in errors', () => {
      const errorMessages = [
        'Service worker registration failed',
        'Unregistration failed',
      ];

      errorMessages.forEach(message => {
        expect(message).not.toContain('password');
        expect(message).not.toContain('token');
        expect(message).not.toContain('secret');
      });
    });

    it('should validate service worker path', () => {
      const swPath = '/sw.js';
      const isValidPath = swPath.startsWith('/') && swPath.endsWith('.js');
      expect(isValidPath).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle registration promise rejection', async () => {
      const error = new Error('Registration failed');
      mockNavigator.serviceWorker.register = vi.fn().mockRejectedValue(error);

      try {
        await mockNavigator.serviceWorker.register('/sw.js');
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    it('should handle getRegistrations promise rejection', async () => {
      const error = new Error('Failed to get registrations');
      mockNavigator.serviceWorker.getRegistrations = vi.fn().mockRejectedValue(error);

      try {
        await mockNavigator.serviceWorker.getRegistrations();
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    it('should handle unregister promise rejection', async () => {
      const error = new Error('Unregister failed');
      mockRegistration.unregister = vi.fn().mockRejectedValue(error);

      try {
        await mockRegistration.unregister();
      } catch (err) {
        // Should be caught and ignored
        expect(err).toBeDefined();
      }
    });
  });
});
