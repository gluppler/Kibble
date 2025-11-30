/**
 * Archive event system for Kibble application.
 * 
 * Provides functions to emit storage events when items are archived or restored.
 * These events enable real-time updates across multiple browser tabs and windows
 * using localStorage events and CustomEvents.
 * 
 * Architecture:
 * - localStorage events: Fire in OTHER tabs/windows (cross-tab communication)
 * - CustomEvents: Fire in the SAME tab (same-tab updates)
 * - Polling: Fallback mechanism when events fail
 * 
 * @module lib/archive-events
 */

/**
 * Emits an archive event to notify all tabs and windows of archive operations.
 * 
 * This function uses a dual-event approach:
 * 1. localStorage.setItem() triggers 'storage' events in other tabs/windows
 * 2. CustomEvent dispatch triggers updates in the same tab
 * 
 * The event is cleaned up after a short delay to prevent localStorage pollution.
 * 
 * @param type - Type of item that was archived: "tasks", "boards", or "both"
 * 
 * @remarks
 * - Storage events only fire in OTHER tabs/windows, not the current one
 * - CustomEvents are used for same-tab updates
 * - Function fails silently if localStorage is unavailable (e.g., private browsing)
 * - Errors are only logged in development mode
 * 
 * @example
 * ```typescript
 * // After archiving a task
 * await archiveTask(taskId);
 * emitArchiveEvent("tasks");
 * 
 * // After archiving a board
 * await archiveBoard(boardId);
 * emitArchiveEvent("boards");
 * ```
 */
export function emitArchiveEvent(type: "tasks" | "boards" | "both"): void {
  // Early return if running in server environment
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return;
  }

  try {
    // Create event payload with type and timestamp
    const eventData = {
      type,
      timestamp: new Date().toISOString(),
    };

    // Store in localStorage to trigger 'storage' events in other tabs
    // The 'storage' event fires automatically in other tabs/windows
    localStorage.setItem(
      "kibble:archive:updated",
      JSON.stringify(eventData)
    );

    // Dispatch CustomEvent for same-tab updates
    // Storage events don't fire in the same tab, so we use CustomEvents
    window.dispatchEvent(
      new CustomEvent("kibble:archive:updated", {
        detail: eventData,
      })
    );

    // Clean up localStorage entry after short delay
    // This prevents localStorage from growing indefinitely
    setTimeout(() => {
      try {
        localStorage.removeItem("kibble:archive:updated");
      } catch {
        // Ignore cleanup errors silently
      }
    }, 100);
  } catch (error) {
    // Fail silently if localStorage is unavailable (e.g., private browsing mode)
    // Only log errors in development to prevent information leakage
    if (process.env.NODE_ENV === "development" && typeof console !== "undefined" && console.warn) {
      console.warn("Failed to emit archive event:", error);
    }
  }
}
