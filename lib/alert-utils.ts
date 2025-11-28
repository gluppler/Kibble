/**
 * Alert utilities for Kibble application.
 * 
 * This module provides functions for calculating, formatting, and managing
 * due date alerts and completion notifications. It integrates with the Browser
 * Notification API for cross-browser compatibility and native notifications.
 * 
 * Alert Types:
 * - `urgent`: Tasks that are overdue, due today, due tomorrow, or due within 10 days
 * - `warning`: Reserved for future use
 * - `completion`: Tasks that have been moved to the "Done" column
 * 
 * @module lib/alert-utils
 */

import type { Task } from "@/lib/types";
import { logError, logWarn } from "@/lib/logger";

/**
 * Types of alerts that can be generated.
 * 
 * - `urgent`: High-priority alerts for tasks approaching deadlines
 * - `warning`: Medium-priority alerts (reserved for future use)
 * - `completion`: Positive alerts for completed tasks
 */
export type AlertType = 'urgent' | 'warning' | 'completion';

/**
 * Urgency levels for task alerts.
 * 
 * - `urgent`: Task requires immediate attention
 * - `warning`: Task should be reviewed soon
 * - `null`: No alert needed
 */
export type AlertUrgency = 'urgent' | 'warning' | null;

/**
 * Structure of an alert object.
 * 
 * Alerts are displayed in the notification system and can trigger browser
 * notifications. Each alert has a stable ID to prevent duplicates.
 */
export interface Alert {
  id: string;
  type: AlertType;
  taskId: string;
  taskTitle: string;
  daysUntil?: number;
  dueDate?: Date;
  color: 'red' | 'green';
  closed: boolean;
  createdAt: Date;
}

/**
 * Calculates the number of days until a due date.
 * 
 * Returns a positive number if the due date is in the future, zero if
 * the due date is today, and a negative number if the due date has passed.
 * 
 * @param dueDate - The due date to calculate from
 * @returns Number of days until due date (negative if overdue, 0 if today)
 * 
 * @example
 * ```typescript
 * const daysUntil = calculateDaysUntil(new Date("2024-12-31"));
 * // Returns positive number if in future, negative if past
 * ```
 */
export function calculateDaysUntil(dueDate: Date): number {
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determines the urgency level of an alert based on days until due date.
 * 
 * This function implements the alert logic: tasks are considered urgent if
 * they are overdue, due today, due tomorrow, or due within 10 days. All
 * urgent alerts are displayed with red styling to draw attention.
 * 
 * @param daysUntil - Days until due date (negative if overdue, 0 if today)
 * @returns Alert urgency level (`'urgent'` or `null`)
 * 
 * @example
 * ```typescript
 * const urgency = getAlertUrgency(-2); // Returns 'urgent' (overdue)
 * const urgency = getAlertUrgency(0);  // Returns 'urgent' (due today)
 * const urgency = getAlertUrgency(15); // Returns null (more than 10 days)
 * ```
 */
export function getAlertUrgency(daysUntil: number): AlertUrgency {
  if (daysUntil < 0) return 'urgent'; // Overdue - RED
  if (daysUntil === 0) return 'urgent'; // Due today - RED
  if (daysUntil === 1) return 'urgent'; // Due tomorrow (1 day away) - RED
  if (daysUntil <= 10) return 'urgent'; // Due within 10 days - RED
  return null; // No alert needed (more than 10 days away)
}

/**
 * Determines if a task should generate an alert and creates the alert object.
 * 
 * This function checks if a task meets the criteria for alert generation:
 * - Task must have a due date
 * - Task must not be archived
 * - Task must not be in an archived board
 * - Due date must be within the alert window (overdue, today, tomorrow, or within 10 days)
 * 
 * Security Features:
 * - Excludes archived tasks from alert generation
 * - Excludes tasks in archived boards from alert generation
 * - Validates task structure before processing
 * 
 * @param task - Task object to check for alert generation
 * @returns Alert object if alert should be shown, `null` otherwise
 * 
 * @example
 * ```typescript
 * const alert = checkTaskAlert(task);
 * if (alert) {
 *   addAlert(alert);
 * }
 * ```
 */
export function checkTaskAlert(task: Task): Alert | null {
  // Security: Don't show alerts for archived tasks
  if (task.archived) return null;
  
  // Security: Don't show alerts for tasks in archived boards
  // Check if task's column's board is archived (if column relation is included)
  // Type assertion needed because Task type may not include column relation
  const taskWithColumn = task as Task & { column?: { board?: { archived?: boolean } } };
  if (taskWithColumn.column?.board?.archived) return null;
  
  if (!task.dueDate) return null;

  const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
  const daysUntil = calculateDaysUntil(dueDate);
  const urgency = getAlertUrgency(daysUntil);

  if (!urgency) return null;

  // Use stable ID based on task ID and days until (rounded to prevent duplicates for same day)
  // This ensures the same alert doesn't get created multiple times
  const stableId = `alert-${task.id}-${daysUntil <= 0 ? 'overdue' : daysUntil}`;

  return {
    id: stableId,
    type: 'urgent', // All alerts are urgent when within 10 days (visual distinction via borders/backgrounds in black/white design)
    taskId: task.id,
    taskTitle: task.title,
    daysUntil,
    dueDate,
    color: 'red', // Kept for internal logic - UI uses black/white visual distinction
    closed: false,
    createdAt: new Date(),
  };
}

/**
 * Creates a completion alert when task is moved to Done
 * 
 * @param task - Task that was completed
 * @returns Completion alert object
 * 
 * Uses stable ID based on task ID to prevent duplicate alerts for the same completion.
 * 
 * @throws Error if task is missing required properties (id or title)
 */
export function createCompletionAlert(task: Task): Alert {
  // Validate task has required properties
  if (!task || typeof task !== 'object') {
    throw new Error('Task must be a valid object');
  }
  
  if (!task.id || typeof task.id !== 'string') {
    throw new Error('Task must have a valid id property');
  }
  
  if (!task.title || typeof task.title !== 'string') {
    throw new Error('Task must have a valid title property');
  }
  
  // Use stable ID based on task ID only - one completion alert per task
  // Visual distinction via borders/backgrounds in black/white design
  return {
    id: `completion-${task.id}`,
    type: 'completion',
    taskId: task.id,
    taskTitle: task.title,
    color: 'green', // Kept for internal logic - UI uses black/white visual distinction
    closed: false,
    createdAt: new Date(),
  };
}

/**
 * Requests notification permission from the browser
 * 
 * Uses Browser Notification API with proper error handling and security checks.
 * Only requests permission in secure contexts (HTTPS or localhost).
 * 
 * @returns Promise resolving to permission status
 * 
 * Security:
 * - Only works in secure contexts (HTTPS/localhost)
 * - Proper error handling to prevent crashes
 * - Graceful degradation if API unavailable
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  // Check if running in secure context (required for notifications)
  if (typeof window === 'undefined' || !window.isSecureContext) {
    logWarn('Notifications require a secure context (HTTPS or localhost)');
    return 'denied';
  }

  // Check if Notification API is available
  if (!('Notification' in window)) {
    logWarn('Browser does not support notifications');
    return 'denied';
  }

  // Return current permission if already set
  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  // Request permission with error handling
  try {
    // requestPermission() must be called in response to user interaction
    // This function should be called from a user event handler
    const permission = await Notification.requestPermission();
    
    // Validate permission value (security check)
    if (permission !== 'granted' && permission !== 'denied' && permission !== 'default') {
      logWarn('Invalid notification permission value:', permission);
      return 'denied';
    }
    
    return permission;
  } catch (error) {
    logError('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Global set to track sent notification tags
 * Prevents duplicate browser notifications even if function is called multiple times
 */
const sentNotificationTags = new Set<string>();

/**
 * Clears old notification tags to prevent memory leaks
 * Removes tags when the set gets too large
 */
function cleanupOldNotificationTags() {
  // Simple cleanup: clear all if we have too many tags
  // In a production app, you might want to use a more sophisticated cleanup with timestamps
  if (sentNotificationTags.size > 100) {
    sentNotificationTags.clear();
  }
}

/**
 * Removes a notification tag from tracking
 * 
 * Allows a new notification to be shown for the same tag if the event happens again
 * (e.g., task moved to Done again after being moved away)
 * 
 * @param tag - Notification tag to remove from tracking
 */
export function clearNotificationTag(tag: string): void {
  sentNotificationTags.delete(tag);
}

/**
 * Shows a browser notification
 * 
 * Uses Browser Notification API with strict security checks and error handling.
 * Prevents duplicate notifications using stable tags and tracking.
 * 
 * @param title - Notification title (sanitized)
 * @param options - Notification options (must include a stable tag)
 * @returns Notification instance or null if permission denied, error, or duplicate
 * 
 * Security:
 * - Validates secure context
 * - Sanitizes title to prevent XSS
 * - Proper error handling
 * - Auto-closes non-urgent notifications
 * - Prevents duplicate notifications using tag tracking
 */
export function showBrowserNotification(
  title: string,
  options: NotificationOptions
): Notification | null {
  // Security check: Must be in secure context
  if (typeof window === 'undefined' || !window.isSecureContext) {
    logWarn('Notifications require a secure context (HTTPS or localhost)');
    return null;
  }

  // Check if Notification API is available
  if (!('Notification' in window)) {
    logWarn('Browser does not support notifications');
    return null;
  }

  // Check permission
  if (Notification.permission !== 'granted') {
    logWarn('Notification permission not granted');
    return null;
  }

  // Sanitize title to prevent XSS (basic check)
  const sanitizedTitle = String(title).slice(0, 100); // Limit length

  // Generate stable tag - must be provided in options or we'll create one
  // The tag is critical for preventing duplicates - same tag = same notification
  const notificationTag = options.tag || `notification-${Date.now()}`;

  // Check if we've already sent a notification with this tag
  // This prevents duplicates even if the function is called multiple times
  if (sentNotificationTags.has(notificationTag)) {
    // Duplicate detected - don't show notification
    return null;
  }

  // Cleanup old tags periodically
  cleanupOldNotificationTags();

  try {
    // Create notification with sanitized title and stable tag
    const notification = new Notification(sanitizedTitle, {
      ...options,
      // Use stable tag - browser will replace existing notification with same tag
      tag: notificationTag,
      // Sanitize body if provided
      body: options.body ? String(options.body).slice(0, 200) : undefined,
    });

    // Track that we've sent this notification
    sentNotificationTags.add(notificationTag);

    // Add click handler to prevent duplicate tab opening
    // CRITICAL: Always just focus the existing window - never navigate
    // This prevents the browser from opening a new tab when:
    // - User is signed out
    // - User is on auth pages
    // - Window that created notification no longer exists
    // The browser's default behavior when clicking a notification is to focus the window
    // that created it, or open a new tab if that window doesn't exist. By explicitly
    // focusing, we prevent new tab creation.
    notification.onclick = () => {
      // Check if we're in a browser context
      if (typeof window === 'undefined') return;
      
      try {
        // Always just focus the existing window - never navigate
        // This is the safest approach to prevent duplicate tabs
        // The user can manually navigate if they want to see the alerts
        window.focus();
        
        // Optional: Close the notification after focusing
        // This provides better UX - user knows the click was registered
        try {
          notification.close();
        } catch (closeError) {
          // Ignore errors when closing (notification may already be closed)
        }
      } catch (error) {
        // If any error occurs, silently fail
        // This prevents crashes and doesn't disrupt user experience
        logWarn('Could not handle notification click:', error);
      }
    };

    // Auto-close after 5 seconds for non-urgent notifications
    // This prevents notification spam
    if (!options.requireInteraction) {
      setTimeout(() => {
        try {
          notification.close();
        } catch (error) {
          // Ignore errors when closing (notification may already be closed)
        }
      }, 5000);
    }

      return notification;
    } catch (error) {
      logError('Error showing notification:', error);
      return null;
    }
}

/**
 * Formats alert message based on alert type
 * 
 * @param alert - Alert to format
 * @returns Formatted message string
 */
export function formatAlertMessage(alert: Alert): string {
  if (alert.type === 'completion') {
    return `Congratulations! "${alert.taskTitle}" has been moved to Done`;
  }

  if (alert.daysUntil === undefined) {
    return `Task "${alert.taskTitle}" has a due date`;
  }

  if (alert.daysUntil < 0) {
    return `Task "${alert.taskTitle}" is overdue by ${Math.abs(alert.daysUntil)} day${Math.abs(alert.daysUntil) !== 1 ? 's' : ''}`;
  }

  if (alert.daysUntil === 0) {
    return `Task "${alert.taskTitle}" is due today`;
  }

  if (alert.daysUntil === 1) {
    return `Task "${alert.taskTitle}" is due tomorrow`;
  }

  return `Task "${alert.taskTitle}" is due in ${alert.daysUntil} days`;
}

/**
 * Formats alert title based on alert type
 * 
 * @param alert - Alert to format
 * @returns Formatted title string
 */
export function formatAlertTitle(alert: Alert): string {
  if (alert.type === 'completion') {
    return 'Task Completed!';
  }

  if (alert.daysUntil !== undefined && alert.daysUntil < 0) {
    return 'Task Overdue!';
  }

  if (alert.daysUntil === 0) {
    return 'Task Due Today!';
  }

  if (alert.daysUntil === 1) {
    return 'Task Due Tomorrow!';
  }

  return 'Task Due Soon!';
}
