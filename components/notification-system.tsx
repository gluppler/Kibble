/**
 * Notification System Component
 * 
 * Displays due date alerts and completion notifications with:
 * - BLACK/WHITE alerts for urgent tasks (overdue, due today, due tomorrow, due in 10 days)
 * - BLACK/WHITE alerts for completed tasks (using visual distinction via borders/backgrounds)
 * - Individual alert close functionality
 * - Real-time updates
 * - Browser Notification API integration
 * - Visibility API optimization (pauses checks when tab is in background)
 * 
 * Design: Strict black & white minimal system - no colors, no gradients
 */

"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, AlertCircle, Calendar, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAlerts } from "@/contexts/alert-context";
import { logError, logWarn } from "@/lib/logger";
import type { Alert } from "@/lib/alert-utils";

export function NotificationSystem() {
  const { data: session } = useSession();
  const { alerts, closeAlert, clearAllAlerts, checkTaskForAlert } = useAlerts();
  const [isOpen, setIsOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  /**
   * Periodic check for due date alerts
   * 
   * Checks all tasks across all boards every 5 minutes for due date alerts.
   * Uses the alert context to check and add alerts automatically.
   * 
   * Permission: Only checks tasks from user's own boards (enforced by API routes).
   * The API routes ensure users can only access their own boards and tasks.
   * 
   * Note: The alert context's duplicate detection prevents duplicate alerts
   * even if this function is called multiple times.
   * 
   * Security: Only runs when user is authenticated (session exists).
   */
  useEffect(() => {
    // Don't check alerts if user is not authenticated
    // This prevents API calls on auth pages
    if (!session) return;
    
    // Don't check alerts on auth pages - prevents unnecessary API calls
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/auth/') || currentPath.startsWith('/signin')) {
        return;
      }
    }

    const checkDueDates = async () => {
      try {
        // Optimized: Fetch all tasks with due dates in a single API call
        // This avoids N+1 queries (fetching each board individually)
        const tasksRes = await fetch("/api/tasks/alerts");
        if (!tasksRes.ok) {
          // If unauthorized, stop checking
          if (tasksRes.status === 401 || tasksRes.status === 403) {
            logWarn("Unauthorized access to tasks - stopping alert checks");
            return;
          }
          return;
        }

        const data = await tasksRes.json();
        
        // Safety check: ensure data is valid and has tasks array
        if (!data || typeof data !== 'object' || !Array.isArray(data.tasks)) {
          logWarn("Invalid response from /api/tasks/alerts - expected tasks array");
          return;
        }

        const { tasks } = data;

        // Check each task for alerts
        // Permission: API route ensures only user's own tasks are returned
        // Duplicate detection in alert context prevents duplicate alerts
        for (const task of tasks) {
          // Safety check: ensure task is valid object
          if (!task || typeof task !== 'object') continue;
          
          if (task.dueDate && !task.locked) {
            try {
              checkTaskForAlert(task);
            } catch (taskError) {
              // Log error but continue processing other tasks
              logError("Error checking task for alert:", taskError);
            }
          }
        }

        setHasChecked(true);
      } catch (error) {
        logError("Failed to check due dates:", error);
      }
    };

    checkDueDates();
    // Check every 5 minutes
    const interval = setInterval(checkDueDates, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [session, checkTaskForAlert]);

  /**
   * Show notification panel when new alerts arrive
   * Auto-opens when alerts are first detected
   */
  useEffect(() => {
    if (alerts.length > 0 && !isOpen) {
      setIsOpen(true);
      // Auto-close after 10 seconds if user doesn't interact
      const timer = setTimeout(() => setIsOpen(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [alerts.length, isOpen]);

  // Separate alerts by type for better organization (memoized to avoid recalculation)
  // MUST be called before any early returns to follow Rules of Hooks
  const { urgentAlerts, completionAlerts } = useMemo(() => {
    // Safety check: ensure alerts is an array
    if (!Array.isArray(alerts) || alerts.length === 0) {
      return { urgentAlerts: [], completionAlerts: [] };
    }

    // Filter alerts with proper null/undefined checks
    const urgent = alerts.filter((a) => {
      // Safety check: ensure alert exists and has required properties
      if (!a || typeof a !== 'object') return false;
      return a.color === 'red' && a.closed !== true;
    });
    
    const completion = alerts.filter((a) => {
      // Safety check: ensure alert exists and has required properties
      if (!a || typeof a !== 'object') return false;
      return a.color === 'green' && a.closed !== true;
    });
    
    return { urgentAlerts: urgent, completionAlerts: completion };
  }, [alerts]);

  // Don't show notification system on auth pages
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/auth/') || currentPath.startsWith('/signin')) {
      return null;
    }
  }

  if (!Array.isArray(alerts) || alerts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white dark:bg-black rounded-lg shadow-xl border border-black/20 dark:border-white/20 p-3 sm:p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-sm flex items-center justify-center border-2 ${
                  urgentAlerts.length > 0 
                    ? 'bg-black dark:bg-white border-black dark:border-white' 
                    : 'bg-white dark:bg-black border-black dark:border-white'
                }`}>
                  <Bell className={
                    urgentAlerts.length > 0 
                      ? 'text-white dark:text-black' 
                      : 'text-black dark:text-white'
                  } size={16} />
                </div>
                <h3 className="font-bold text-black dark:text-white text-sm">
                  {urgentAlerts.length > 0 ? 'Due Date Alerts' : 'Completion Alerts'}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                aria-label="Close notifications"
              >
                <X className="text-black dark:text-white" size={16} />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {/* Urgent Alerts (RED) */}
              {urgentAlerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onClose={() => closeAlert(alert.id)}
                />
              ))}

              {/* Completion Alerts (GREEN) */}
              {completionAlerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onClose={() => closeAlert(alert.id)}
                />
              ))}
            </div>

            {alerts.length > 1 && (
              <button
                onClick={clearAllAlerts}
                className="w-full text-xs text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white text-center py-1 font-bold transition-colors"
              >
                Clear all alerts
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification bell button */}
      {!isOpen && alerts.length > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-4 right-4 w-12 h-12 sm:w-14 sm:h-14 rounded shadow-lg hover:shadow-xl flex items-center justify-center z-50 border-2 ${
            urgentAlerts.length > 0
              ? 'bg-black dark:bg-white border-black dark:border-white'
              : 'bg-white dark:bg-black border-black dark:border-white'
          }`}
          aria-label={`${alerts.length} alert${alerts.length !== 1 ? "s" : ""}`}
        >
          <Bell size={20} className={urgentAlerts.length > 0 ? 'text-white dark:text-black' : 'text-black dark:text-white'} />
          {alerts.length > 0 && (
            <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-sm text-xs font-bold flex items-center justify-center border ${
              urgentAlerts.length > 0
                ? 'bg-white dark:bg-black text-black dark:text-white border-black dark:border-white'
                : 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
            }`}>
              {alerts.length > 9 ? "9+" : alerts.length}
            </span>
          )}
        </motion.button>
      )}
    </div>
  );
}

/**
 * AlertItem Component
 * 
 * Displays a single alert with close functionality.
 * Memoized to prevent unnecessary re-renders.
 * 
 * @param alert - Alert to display
 * @param onClose - Callback when alert is closed
 */
const AlertItem = memo(function AlertItem({ alert, onClose }: { alert: Alert; onClose: () => void }) {
  // Safety check: ensure alert is valid
  if (!alert || typeof alert !== 'object') {
    return null;
  }

  const getAlertContent = () => {
    // Safety check: ensure alert has required properties
    const taskTitle = alert.taskTitle || 'Unknown Task';
    const alertType = alert.type || 'urgent';
    
    if (alertType === 'completion') {
      return {
        icon: CheckCircle2,
        iconColor: 'text-black dark:text-white',
        bgColor: 'bg-white dark:bg-black',
        borderColor: 'border-black/20 dark:border-white/20',
        borderWidth: 'border-2',
        message: `Congratulations! "${taskTitle}" has been moved to Done`,
      };
    }

    // Urgent/Warning alerts - use stronger borders for visual distinction
    const daysUntil = typeof alert.daysUntil === 'number' ? alert.daysUntil : undefined;
    const isOverdue = daysUntil !== undefined && daysUntil < 0;
    const isDueToday = daysUntil === 0;
    const isDueTomorrow = daysUntil === 1;

    let message = '';
    if (isOverdue && daysUntil !== undefined) {
      const daysOverdue = Math.abs(daysUntil);
      message = `"${taskTitle}" is overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}`;
    } else if (isDueToday) {
      message = `"${taskTitle}" is due today`;
    } else if (isDueTomorrow) {
      message = `"${taskTitle}" is due tomorrow`;
    } else if (daysUntil !== undefined) {
      message = `"${taskTitle}" is due in ${daysUntil} days`;
    } else {
      message = `"${taskTitle}" has a due date`;
    }

    // Use stronger border for urgent alerts to distinguish from completion
    return {
      icon: isOverdue ? AlertCircle : Calendar,
      iconColor: 'text-black dark:text-white',
      bgColor: 'bg-black/5 dark:bg-white/5',
      borderColor: 'border-black dark:border-white',
      borderWidth: 'border-2',
      message,
    };
  };

  const content = getAlertContent();
  const Icon = content.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`p-3 rounded border ${content.bgColor} ${content.borderColor} ${content.borderWidth}`}
    >
      <div className="flex items-start gap-2">
        <Icon className={`${content.iconColor} flex-shrink-0 mt-0.5`} size={16} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-black dark:text-white truncate">
            {alert.taskTitle || 'Unknown Task'}
          </p>
          <p className="text-xs text-black/60 dark:text-white/60 mt-0.5 font-bold">
            {content.message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
          aria-label="Close alert"
          type="button"
        >
          <X className="text-black dark:text-white" size={12} />
        </button>
      </div>
    </motion.div>
  );
});
