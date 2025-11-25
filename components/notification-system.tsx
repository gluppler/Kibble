"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, AlertCircle, Calendar } from "lucide-react";
import { useSession } from "next-auth/react";

interface Notification {
  id: string;
  type: "overdue" | "due-soon";
  taskTitle: string;
  dueDate: Date;
  daysUntil: number;
}

export function NotificationSystem() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!session) return;

    const checkDueDates = async () => {
      try {
        // Get all user's boards and tasks
        const boardsRes = await fetch("/api/boards/list");
        if (!boardsRes.ok) return;

        const { boards } = await boardsRes.json();
        const allNotifications: Notification[] = [];

        for (const board of boards) {
          const boardRes = await fetch(`/api/boards/${board.id}`);
          if (!boardRes.ok) continue;

          const boardData = await boardRes.json();
          const now = new Date();

          for (const column of boardData.columns || []) {
            for (const task of column.tasks || []) {
              if (!task.dueDate) continue;

              const dueDate = new Date(task.dueDate);
              const diffTime = dueDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays < 0) {
                // Overdue
                allNotifications.push({
                  id: `${task.id}-overdue`,
                  type: "overdue",
                  taskTitle: task.title,
                  dueDate,
                  daysUntil: Math.abs(diffDays),
                });
              } else if (diffDays <= 3) {
                // Due soon
                allNotifications.push({
                  id: `${task.id}-due-soon`,
                  type: "due-soon",
                  taskTitle: task.title,
                  dueDate,
                  daysUntil: diffDays,
                });
              }
            }
          }
        }

        setNotifications(allNotifications);
        setHasChecked(true);

        // Show notification if there are alerts (only on first check)
        if (allNotifications.length > 0 && !hasChecked) {
          setIsOpen(true);
          // Auto-close after 10 seconds
          setTimeout(() => setIsOpen(false), 10000);
        }
      } catch (error) {
        console.error("Failed to check due dates:", error);
      }
    };

    checkDueDates();
    // Check every 5 minutes
    const interval = setInterval(checkDueDates, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [session, hasChecked]);

  if (notifications.length === 0) return null;

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
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Bell className="text-red-600 dark:text-red-400" size={16} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Due Date Alerts
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="text-gray-500 dark:text-gray-400" size={16} />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg border ${
                    notification.type === "overdue"
                      ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                      : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {notification.type === "overdue" ? (
                      <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={16} />
                    ) : (
                      <Calendar className="text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" size={16} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {notification.taskTitle}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {notification.type === "overdue"
                          ? `Overdue by ${notification.daysUntil} day${notification.daysUntil !== 1 ? "s" : ""}`
                          : notification.daysUntil === 0
                          ? "Due today"
                          : `Due in ${notification.daysUntil} day${notification.daysUntil !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification bell button */}
      {!isOpen && notifications.length > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg hover:shadow-xl flex items-center justify-center z-50"
          aria-label={`${notifications.length} due date alert${notifications.length !== 1 ? "s" : ""}`}
        >
          <Bell size={20} />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-red-600 rounded-full text-xs font-bold flex items-center justify-center">
              {notifications.length > 9 ? "9+" : notifications.length}
            </span>
          )}
        </motion.button>
      )}
    </div>
  );
}
