/**
 * Interaction Detection Utility
 * 
 * Detects user interactions (clicks, keyboard input, form focus, etc.)
 * to pause polling and other background operations during active use.
 * 
 * This prevents disruptions when users are actively working with the application.
 */

"use client";

/**
 * Tracks whether the user is currently interacting with the application
 */
let isUserInteracting = false;
let interactionTimeout: NodeJS.Timeout | null = null;

/**
 * Duration of inactivity (in ms) before considering user as "not interacting"
 * This allows polling to resume after user stops interacting
 */
const INACTIVITY_DURATION = 8000; // 8 seconds

/**
 * Marks user as actively interacting
 * Resets the inactivity timer
 */
export function markUserInteraction(): void {
  isUserInteracting = true;
  
  // Clear existing timeout
  if (interactionTimeout) {
    clearTimeout(interactionTimeout);
  }
  
  // Set timeout to mark user as inactive after period of no interaction
  interactionTimeout = setTimeout(() => {
    isUserInteracting = false;
    interactionTimeout = null;
  }, INACTIVITY_DURATION);
}

/**
 * Checks if user is currently interacting
 * 
 * @returns true if user has interacted recently, false otherwise
 */
export function isInteracting(): boolean {
  return isUserInteracting;
}

/**
 * Initializes global interaction listeners
 * Should be called once when the app loads
 */
export function initializeInteractionDetection(): void {
  if (typeof window === "undefined") return;
  
  // Mouse/touch interactions
  const handlePointerInteraction = () => markUserInteraction();
  
  // Keyboard interactions
  const handleKeyboardInteraction = () => markUserInteraction();
  
  // Form interactions (focus on inputs, textareas, selects)
  const handleFormInteraction = (e: Event) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable
    ) {
      markUserInteraction();
    }
  };
  
  // Add event listeners
  document.addEventListener("mousedown", handlePointerInteraction, { passive: true });
  document.addEventListener("touchstart", handlePointerInteraction, { passive: true });
  document.addEventListener("keydown", handleKeyboardInteraction, { passive: true });
  document.addEventListener("focusin", handleFormInteraction, { passive: true });
}
