/**
 * Notification System Component
 * 
 * Displays due date alerts and completion notifications with:
 * - RED alerts for urgent tasks (overdue, due today, due tomorrow, due in 10 days)
 * - GREEN alerts for completed tasks
 * - Individual alert close functionality
 * - Real-time updates
 * - Browser Notification API integration
 */

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, AlertCircle, Calendar, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAlerts } from "@/contexts/alert-context";
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
   */
  useEffect(() => {
    if (!session) return;

    const checkDueDates = async () => {
      try {
        // Get all user's boards and tasks
        // Permission: API route ensures only user's own boards are returned
        const boardsRes = await fetch("/api/boards/list");
        if (!boardsRes.ok) {
          // If unauthorized, stop checking
          if (boardsRes.status === 401 || boardsRes.status === 403) {
            console.warn("Unauthorized access to boards list - stopping alert checks");
            return;
          }
          return;
        }

        const { boards } = await boardsRes.json();

        for (const board of boards) {
          // Permission: API route ensures only user's own board is returned
          const boardRes = await fetch(`/api/boards/${board.id}`);
          if (!boardRes.ok) {
            // If unauthorized, skip this board
            if (boardRes.status === 401 || boardRes.status === 403) {
              console.warn(`Unauthorized access to board ${board.id} - skipping`);
              continue;
            }
            continue;
          }

          const boardData = await boardRes.json();

          for (const column of boardData.columns || []) {
            for (const task of column.tasks || []) {
              if (!task.dueDate || task.locked) continue; // Skip tasks without due dates or locked tasks
              
              // Check task for alerts using alert context
              // Permission: Task already belongs to user's board (verified by API)
              // Duplicate detection in alert context prevents duplicate alerts
              checkTaskForAlert(task);
            }
          }
        }

        setHasChecked(true);
      } catch (error) {
        console.error("Failed to check due dates:", error);
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

  if (alerts.length === 0) return null;

  // Separate alerts by type for better organization
  const urgentAlerts = alerts.filter((a) => a.color === 'red' && !a.closed);
  const completionAlerts = alerts.filter((a) => a.color === 'green' && !a.closed);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  urgentAlerts.length > 0 
                    ? 'bg-red-100 dark:bg-red-900/30' 
                    : 'bg-green-100 dark:bg-green-900/30'
                }`}>
                  <Bell className={
                    urgentAlerts.length > 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-green-600 dark:text-green-400'
                  } size={16} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  {urgentAlerts.length > 0 ? 'Due Date Alerts' : 'Completion Alerts'}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close notifications"
              >
                <X className="text-gray-500 dark:text-gray-400" size={16} />
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
                className="w-full text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-center py-1"
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
          className={`fixed bottom-4 right-4 w-12 h-12 sm:w-14 sm:h-14 rounded-full text-white shadow-lg hover:shadow-xl flex items-center justify-center z-50 ${
            urgentAlerts.length > 0
              ? 'bg-gradient-to-r from-red-500 to-orange-500'
              : 'bg-gradient-to-r from-green-500 to-emerald-500'
          }`}
          aria-label={`${alerts.length} alert${alerts.length !== 1 ? "s" : ""}`}
        >
          <Bell size={20} />
          {alerts.length > 0 && (
            <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
              urgentAlerts.length > 0
                ? 'bg-white text-red-600'
                : 'bg-white text-green-600'
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
 * 
 * @param alert - Alert to display
 * @param onClose - Callback when alert is closed
 */
function AlertItem({ alert, onClose }: { alert: Alert; onClose: () => void }) {
  const getAlertContent = () => {
    if (alert.type === 'completion') {
      return {
        icon: CheckCircle2,
        iconColor: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        message: `Congratulations! "${alert.taskTitle}" has been moved to Done`,
      };
    }

    // Urgent/Warning alerts
    const isOverdue = alert.daysUntil !== undefined && alert.daysUntil < 0;
    const isDueToday = alert.daysUntil === 0;
    const isDueTomorrow = alert.daysUntil === 1;

    let message = '';
    if (isOverdue) {
      message = `"${alert.taskTitle}" is overdue by ${Math.abs(alert.daysUntil!)} day${Math.abs(alert.daysUntil!) !== 1 ? 's' : ''}`;
    } else if (isDueToday) {
      message = `"${alert.taskTitle}" is due today`;
    } else if (isDueTomorrow) {
      message = `"${alert.taskTitle}" is due tomorrow`;
    } else {
      message = `"${alert.taskTitle}" is due in ${alert.daysUntil} days`;
    }

    return {
      icon: isOverdue ? AlertCircle : Calendar,
      iconColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
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
      className={`p-3 rounded-lg border ${content.bgColor} ${content.borderColor}`}
    >
      <div className="flex items-start gap-2">
        <Icon className={`${content.iconColor} flex-shrink-0 mt-0.5`} size={16} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {alert.taskTitle}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            {content.message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          aria-label="Close alert"
        >
          <X className="text-gray-400 dark:text-gray-500" size={12} />
        </button>
      </div>
    </motion.div>
  );
}
