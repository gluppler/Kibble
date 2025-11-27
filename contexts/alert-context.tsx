/**
 * Alert Context Module
 * 
 * Provides a global alert management system for due date alerts and completion notifications.
 * Supports real-time updates when tasks are created or moved to Done column.
 */

"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
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
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

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
   * Adds a new alert to the system
   * 
   * @param alert - Alert to add
   * 
   * Also shows a browser notification if permission is granted.
   * Prevents duplicate alerts for the same task and type using strict matching.
   */
  const addAlert = useCallback((alert: Alert) => {
    setAlerts((prev) => {
      // Strict duplicate check: Use alert ID (which is now stable based on taskId + type)
      // This prevents duplicates more reliably than checking multiple fields
      const exists = prev.some(
        (a) => 
          a.id === alert.id && // Same alert ID (stable ID based on taskId + type)
          !a.closed // Not already closed
      );
      
      if (exists) return prev;

      // Add new alert
      const newAlerts = [...prev, alert];

      // Show browser notification if permission granted
      // Only show if in secure context and permission is granted
      // Don't show notifications on auth pages to prevent duplicate tab opening
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
          icon: '/icon-192x192.png',
          tag: notificationTag, // Stable tag prevents duplicate browser notifications
          requireInteraction: alert.type === 'urgent' || alert.color === 'red',
          badge: '/badge-72x72.png',
        });
      }

      return newAlerts;
    });
  }, [notificationPermission]);

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
   */
  const addCompletionAlert = useCallback((task: any) => {
    const alert = createCompletionAlert(task);
    addAlert(alert);
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
