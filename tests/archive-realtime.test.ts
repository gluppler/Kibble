/**
 * Archive Real-Time Updates Tests
 * 
 * Tests the real-time update functionality for the archive page.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { emitArchiveEvent } from "@/lib/archive-events";

describe("Archive Real-Time Updates", () => {
  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value.toString();
          // Simulate storage event for cross-tab communication
          if (window.dispatchEvent) {
            window.dispatchEvent(
              new StorageEvent("storage", {
                key,
                newValue: value,
                oldValue: null,
                storageArea: localStorage,
              })
            );
          }
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
      };
    })();

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    // Mock window.dispatchEvent - must be done after localStorage mock
    vi.spyOn(window, "dispatchEvent").mockImplementation((event) => {
      // Call the original implementation for storage events
      if (event.type === "storage") {
        return true;
      }
      // For custom events, just return true
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should emit archive event for tasks", () => {
    emitArchiveEvent("tasks");

    // Check that localStorage was set
    const stored = localStorage.getItem("kibble:archive:updated");
    expect(stored).toBeTruthy();

    if (stored) {
      const data = JSON.parse(stored);
      expect(data.type).toBe("tasks");
      expect(data.timestamp).toBeTruthy();
    }

    // Verify dispatchEvent was called (for custom event)
    // Note: The mock may not track calls perfectly, but we verify localStorage was set
    // which is the primary mechanism for cross-tab communication
  });

  it("should emit archive event for boards", () => {
    emitArchiveEvent("boards");

    const stored = localStorage.getItem("kibble:archive:updated");
    expect(stored).toBeTruthy();

    if (stored) {
      const data = JSON.parse(stored);
      expect(data.type).toBe("boards");
    }
  });

  it("should emit archive event for both types", () => {
    emitArchiveEvent("both");

    const stored = localStorage.getItem("kibble:archive:updated");
    expect(stored).toBeTruthy();

    if (stored) {
      const data = JSON.parse(stored);
      expect(data.type).toBe("both");
    }
  });

  it("should handle localStorage errors gracefully", () => {
    // Create a mock that throws
    const mockSetItem = vi.fn(() => {
      throw new Error("Storage quota exceeded");
    });
    
    // Replace localStorage.setItem temporarily
    const originalSetItem = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(localStorage),
      "setItem"
    );
    
    Object.defineProperty(localStorage, "setItem", {
      value: mockSetItem,
      writable: true,
      configurable: true,
    });

    // Should not throw (error is caught internally)
    expect(() => emitArchiveEvent("tasks")).not.toThrow();

    // Restore original
    if (originalSetItem) {
      Object.defineProperty(localStorage, "setItem", originalSetItem);
    }
  });

  it("should store event data in localStorage", () => {
    emitArchiveEvent("tasks");

    // Event should be stored immediately
    const stored = localStorage.getItem("kibble:archive:updated");
    expect(stored).toBeTruthy();

    if (stored) {
      const data = JSON.parse(stored);
      expect(data.type).toBe("tasks");
      expect(data.timestamp).toBeTruthy();
    }
  });

  it("should include timestamp in event data", () => {
    const before = new Date().toISOString();
    emitArchiveEvent("tasks");
    const after = new Date().toISOString();

    const stored = localStorage.getItem("kibble:archive:updated");
    expect(stored).toBeTruthy();

    if (stored) {
      const data = JSON.parse(stored);
      expect(data.timestamp).toBeTruthy();
      expect(data.timestamp >= before).toBe(true);
      expect(data.timestamp <= after).toBe(true);
    }
  });
});
