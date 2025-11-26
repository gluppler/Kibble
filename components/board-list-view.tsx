/**
 * Board List View Component
 * 
 * Displays kanban board tasks in a simple list format.
 * All tasks are shown in a vertical list regardless of column.
 */

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, AlertCircle, Edit2, Trash2, Lock } from "lucide-react";
import type { Task, Column } from "@/lib/types";

/**
 * Board interface - represents a complete kanban board with columns and tasks
 */
interface Board {
  id: string;
  title: string;
  columns: (Column & { tasks: Task[] })[];
}

/**
 * Props for BoardListView component
 */
interface BoardListViewProps {
  board: Board;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
}

/**
 * Formats a date to dd/mm/yyyy format
 */
function formatDateToDDMMYYYY(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Calculates due date status
 */
function getDueDateStatus(dueDate: Date | null | undefined): {
  status: "overdue" | "due-soon" | "upcoming" | null;
  daysUntil: number | null;
} {
  if (!dueDate) return { status: null, daysUntil: null };

  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: "overdue", daysUntil: Math.abs(diffDays) };
  } else if (diffDays === 0) {
    return { status: "due-soon", daysUntil: 0 };
  } else if (diffDays <= 3) {
    return { status: "due-soon", daysUntil: diffDays };
  } else {
    return { status: "upcoming", daysUntil: diffDays };
  }
}

/**
 * BoardListView Component
 * 
 * Renders board tasks in a simple vertical list layout.
 */
export function BoardListView({ board, onTaskEdit, onTaskDelete }: BoardListViewProps) {
  // Flatten all tasks with their column information
  const allTasks = useMemo(() => {
    const tasks: Array<Task & { column: Column }> = [];
    board.columns.forEach((column) => {
      column.tasks.forEach((task) => {
        tasks.push({ ...task, column });
      });
    });
    return tasks;
  }, [board.columns]);

  return (
    <div className="w-full">
      {allTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-black/60 dark:text-white/60 font-bold">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allTasks.map((task) => {
            const dueDateStatus = getDueDateStatus(task.dueDate || null);
            const dueDate = task.dueDate
              ? (task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate))
              : null;

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`bg-white dark:bg-black p-3 sm:p-4 rounded-lg border transition-all ${
                  task.locked
                    ? "border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/5 opacity-70"
                    : dueDateStatus.status === "overdue"
                    ? "border-black dark:border-white bg-black/10 dark:bg-white/10"
                    : "border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {task.locked && (
                      <Lock size={14} className="text-black/40 dark:text-white/40 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-sm sm:text-base flex-1 ${
                        task.locked
                          ? "text-black/40 dark:text-white/40 line-through"
                          : "text-black dark:text-white"
                      }`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs sm:text-sm text-black/60 dark:text-white/60 mt-1 line-clamp-2 font-bold">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-black/50 dark:text-white/50 font-bold">
                        <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5">
                          {task.column.title}
                        </span>
                        {dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>{formatDateToDDMMYYYY(dueDate)}</span>
                          </div>
                        )}
                        {dueDateStatus.status === "overdue" && (
                          <div className="flex items-center gap-1 text-black dark:text-white">
                            <AlertCircle size={12} />
                            <span>Overdue</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {dueDateStatus.status && dueDateStatus.status !== "overdue" && (
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                          dueDateStatus.status === "due-soon"
                            ? "text-black dark:text-white bg-black/10 dark:bg-white/10"
                            : "text-black dark:text-white bg-black/5 dark:bg-white/5"
                        }`}
                      >
                        {dueDateStatus.daysUntil === 0
                          ? "Today"
                          : dueDateStatus.daysUntil !== null
                          ? `${dueDateStatus.daysUntil}d`
                          : ""}
                      </div>
                    )}
                    {(onTaskEdit || onTaskDelete) && (
                      <div className="flex items-center gap-1">
                        {onTaskEdit && !task.locked && (
                          <button
                            onClick={() => onTaskEdit(task)}
                            className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                            aria-label="Edit task"
                            type="button"
                          >
                            <Edit2 size={14} className="text-black dark:text-white" />
                          </button>
                        )}
                        {onTaskDelete && (
                          <button
                            onClick={() => onTaskDelete(task)}
                            className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                            aria-label="Delete task"
                            type="button"
                          >
                            <Trash2 size={14} className="text-black dark:text-white" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
