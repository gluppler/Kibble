/**
 * Alert Context Module
 * 
 * Provides a global alert management system for due date alerts and completion notifications.
 * Supports real-time updates when tasks are created or moved to Done column.
 */

"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import type { Alert } from "@/lib/alert-utils";
import {
  checkTaskAlert,
  createCompletionAlert,
  showBrowserNotification,
  formatAlertTitle,
  formatAlertMessage,
  requestNotificationPermission,
  clearNotificationTag,
} from "@/lib/alert-utils";
import { logError, logWarn } from "@/lib/logger";
import { deduplicatedFetch } from "@/lib/request-deduplication";

/**
 * Alert context type
 */
interface AlertContextType {
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  closeAlert: (alertId: string) => void;
  checkTaskForAlert: (task: any) => void;
  addCompletionAlert: (task: any) => void;
  clearAllAlerts: () => void;
  preferencesLoaded: boolean; // Indicates if notification preferences have been loaded
  notificationPreferences: {
    notificationsEnabled: boolean;
    dueDateAlertsEnabled: boolean;
    completionAlertsEnabled: boolean;
  };
}

/**
 * Alert context instance
 */
const AlertContext = createContext<AlertContextType | undefined>(undefined);

/**
 * AlertProvider component
 * 
 * Manages alert state and provides alert management functions to child components.
 * 
 * @param children - React children components
 */
export function AlertProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<{
    notificationsEnabled: boolean;
    dueDateAlertsEnabled: boolean;
    completionAlertsEnabled: boolean;
  }>({
    notificationsEnabled: true,
    dueDateAlertsEnabled: true,
    completionAlertsEnabled: true,
  });

  /**
   * Initialize notification permission on mount
   */
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
      // Request permission if not already set
      if (Notification.permission === 'default') {
        requestNotificationPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
  }, []);

  /**
   * Fetch user notification preferences
   * 
   * Loads user's notification preferences from the database to determine
   * which alerts should be shown.
   * 
   * Critical: This must complete before any alert checks run to prevent
   * alerts from being shown when preferences are disabled.
   * 
   * Also listens for storage events to refresh preferences when updated in settings.
   */
  const fetchPreferences = useCallback(() => {
    if (session?.user?.id) {
      setPreferencesLoaded(false); // Reset while fetching
      deduplicatedFetch("/api/user/notifications")
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          return null;
        })
        .then((data) => {
          if (data) {
            setNotificationPreferences({
              notificationsEnabled: data.notificationsEnabled ?? true,
              dueDateAlertsEnabled: data.dueDateAlertsEnabled ?? true,
              completionAlertsEnabled: data.completionAlertsEnabled ?? true,
            });
          }
          // Mark preferences as loaded even if data is null (use defaults)
          setPreferencesLoaded(true);
        })
        .catch((err) => {
          logWarn("Error fetching notification preferences:", err);
          // Use defaults on error, but mark as loaded so checks can proceed
          setPreferencesLoaded(true);
        });
    } else {
      // No session - mark as loaded with defaults
      setPreferencesLoaded(true);
    }
  }, [session]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  /**
   * Listen for preference updates from settings page
   * 
   * When preferences are updated in settings, a storage event is emitted
   * to notify other tabs/components to refresh their preferences.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'kibble:notifications:updated' && e.newValue) {
        // Preferences were updated - refresh them
        fetchPreferences();
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.type === 'notifications:updated') {
        // Preferences were updated - refresh them
        fetchPreferences();
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('kibble:notifications:updated', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('kibble:notifications:updated', handleCustomEvent);
    };
  }, [fetchPreferences]);

  /**
   * Adds a new alert to the system
   * 
   * @param alert - Alert to add
   * 
   * Also shows a browser notification if permission is granted.
   * Prevents duplicate alerts for the same task and type using strict matching.
   */
  const addAlert = useCallback((alert: Alert) => {
    // Validate alert object before processing
    if (!alert || typeof alert !== 'object') {
      logError("[ALERT CONTEXT] Invalid alert object:", alert);
      return;
    }
    
    // Validate required alert properties
    if (!alert.id || typeof alert.id !== 'string') {
      logError("[ALERT CONTEXT] Alert missing valid id:", alert);
      return;
    }
    
    if (!alert.taskId || typeof alert.taskId !== 'string') {
      logError("[ALERT CONTEXT] Alert missing valid taskId:", alert);
      return;
    }
    
    if (!alert.taskTitle || typeof alert.taskTitle !== 'string') {
      logError("[ALERT CONTEXT] Alert missing valid taskTitle:", alert);
      return;
    }
    
    // Check user notification preferences BEFORE adding alert to state
    // This prevents the alert from being added to the UI if preferences are disabled
    // Respect user's notification settings
    const shouldShowAlert = 
      notificationPreferences.notificationsEnabled &&
      (alert.type === 'completion' 
        ? notificationPreferences.completionAlertsEnabled 
        : notificationPreferences.dueDateAlertsEnabled);

    // If user has disabled this type of alert, don't add it to state at all
    if (!shouldShowAlert) {
      // User has disabled this type of alert - don't add it to the alert system
      // This prevents both in-app alerts and browser notifications
      return;
    }

    setAlerts((prev) => {
      // Strict duplicate check: Use alert ID (which is now stable based on taskId + type)
      // This prevents duplicates more reliably than checking multiple fields
      const exists = prev.some(
        (a) => 
          a && a.id === alert.id && // Same alert ID (stable ID based on taskId + type)
          !a.closed // Not already closed
      );
      
      if (exists) return prev;

      // Add new alert to state (only if preferences allow it)
      const newAlerts = [...prev, alert];

      // Show browser notification if permission granted
      // Only show if in secure context and permission is granted
      // Don't show notifications on auth pages to prevent duplicate tab opening
      // Note: shouldShowAlert is already checked above, so we know preferences allow this alert
      if (
        notificationPermission === 'granted' && 
        typeof window !== 'undefined' && 
        'Notification' in window &&
        window.isSecureContext
      ) {
        // Check if we're on an auth page - don't show notifications on auth pages
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/auth/') || currentPath.startsWith('/signin')) {
          // Don't create notifications on auth pages to prevent duplicate tab opening
          return newAlerts;
        }
        
        const title = formatAlertTitle(alert);
        const body = formatAlertMessage(alert);
        
        // Use stable notification tag based on taskId and type
        // Format: task-{taskId}-{type} for due date alerts
        // Format: completion-{taskId} for completion alerts
        // This ensures the browser replaces existing notifications with the same tag
        const notificationTag = alert.type === 'completion' 
          ? `completion-${alert.taskId}`
          : `task-${alert.taskId}-${alert.type}`;
        
        showBrowserNotification(title, {
          body,
          icon: '/icon-192.png', // Use PNG icon for better browser notification support
          tag: notificationTag, // Stable tag prevents duplicate browser notifications
          requireInteraction: alert.type === 'urgent' || alert.color === 'red',
          badge: '/icon-192.png', // Use same icon as badge (badge is optional but improves notification appearance)
        });
      }

      return newAlerts;
    });
  }, [notificationPermission, notificationPreferences]);

  /**
   * Closes an alert by ID
   * 
   * @param alertId - ID of alert to close
   * 
   * Also clears the notification tag so a new notification can be shown
   * if the same event happens again (e.g., task moved to Done again).
   */
  const closeAlert = useCallback((alertId: string) => {
    setAlerts((prev) => {
      const alertToClose = prev.find(a => a.id === alertId);
      
      // Clear notification tag to allow new notification if event happens again
      if (alertToClose) {
        const notificationTag = alertToClose.type === 'completion' 
          ? `completion-${alertToClose.taskId}`
          : `task-${alertToClose.taskId}-${alertToClose.type}`;
        clearNotificationTag(notificationTag);
      }
      
      return prev.map((alert) =>
        alert.id === alertId ? { ...alert, closed: true } : alert
      );
    });
  }, []);

  /**
   * Checks a task and adds an alert if needed
   * 
   * @param task - Task to check
   * 
   * Automatically generates and adds an alert if the task has an urgent due date.
   */
  const checkTaskForAlert = useCallback((task: any) => {
    const alert = checkTaskAlert(task);
    if (alert) {
      addAlert(alert);
    }
  }, [addAlert]);

  /**
   * Adds a completion alert for a task moved to Done
   * 
   * @param task - Task that was completed
   * 
   * Validates task before creating alert to prevent errors.
   */
  const addCompletionAlert = useCallback((task: any) => {
    // Validate task before creating alert
    if (!task || typeof task !== 'object') {
      logError("[ALERT CONTEXT] Invalid task for completion alert:", task);
      return;
    }
    
    if (!task.id || typeof task.id !== 'string') {
      logError("[ALERT CONTEXT] Task missing valid id for completion alert:", task);
      return;
    }
    
    if (!task.title || typeof task.title !== 'string') {
      logError("[ALERT CONTEXT] Task missing valid title for completion alert:", task);
      return;
    }
    
    try {
      const alert = createCompletionAlert(task);
      // addAlert will check notification preferences internally
      addAlert(alert);
    } catch (error) {
      logError("[ALERT CONTEXT] Failed to create completion alert:", error);
    }
  }, [addAlert]);

  /**
   * Clears all alerts
   */
  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  /**
   * Cleanup old alerts (expiration)
   * 
   * Removes alerts older than 7 days to prevent memory buildup.
   * Runs periodically to clean up stale alerts.
   */
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setAlerts((prev) => {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return prev.filter((alert) => {
          const alertTime = alert.createdAt instanceof Date 
            ? alert.createdAt.getTime() 
            : new Date(alert.createdAt).getTime();
          return alertTime > sevenDaysAgo;
        });
      });
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(cleanupInterval);
  }, []);

  return (
    <AlertContext.Provider
      value={{
        alerts: alerts.filter((a) => !a.closed),
        addAlert,
        closeAlert,
        checkTaskForAlert,
        addCompletionAlert,
        clearAllAlerts,
        preferencesLoaded,
        notificationPreferences,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}

/**
 * useAlerts hook
 * 
 * Provides access to alert context in components.
 * 
 * @returns Alert context with alerts and management functions
 * @throws Error if used outside AlertProvider
 */
export function useAlerts() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlerts must be used within an AlertProvider");
  }
  return context;
}
