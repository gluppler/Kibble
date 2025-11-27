/**
 * Archive Events Utility
 * 
 * Provides functions to emit storage events when items are archived or restored.
 * These events are used by the archive page to update in real-time.
 * 
 * Uses localStorage events for cross-tab communication.
 */

/**
 * Emits a storage event to notify other tabs/pages that an archive operation occurred
 * 
 * @param type - Type of item archived: "tasks", "boards", or "both"
 * 
 * Note: Storage events only fire in OTHER tabs/windows, not the current one.
 * For same-tab updates, we rely on polling and direct state updates.
 */
export function emitArchiveEvent(type: "tasks" | "boards" | "both"): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return;
  }

  try {
    // Store event data in localStorage
    // The storage event will fire in other tabs/windows
    const eventData = {
      type,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(
      "kibble:archive:updated",
      JSON.stringify(eventData)
    );

    // For same-tab updates, we need to manually trigger a custom event
    // since storage events don't fire in the same tab
    window.dispatchEvent(
      new CustomEvent("kibble:archive:updated", {
        detail: eventData,
      })
    );

    // Clean up after a short delay to allow event processing
    setTimeout(() => {
      try {
        localStorage.removeItem("kibble:archive:updated");
      } catch (err) {
        // Ignore cleanup errors
      }
    }, 100);
  } catch (error) {
    // Silently fail if localStorage is not available (e.g., private browsing)
    // Only log in development
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to emit archive event:", error);
    }
  }
}
