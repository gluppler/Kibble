/**
 * Board Grid View Component
 * 
 * Displays kanban board tasks in a grid/card layout.
 * All tasks are shown in a responsive grid regardless of column.
 */

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, AlertCircle, Edit2, Trash2, Lock, Clock } from "lucide-react";
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
 * Props for BoardGridView component
 */
interface BoardGridViewProps {
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
 * BoardGridView Component
 * 
 * Renders board tasks in a responsive grid layout.
 */
export function BoardGridView({ board, onTaskEdit, onTaskDelete }: BoardGridViewProps) {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {allTasks.map((task) => {
            const dueDateStatus = getDueDateStatus(task.dueDate || null);
            const dueDate = task.dueDate
              ? (task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate))
              : null;

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-white dark:bg-black p-3 sm:p-4 rounded-lg border transition-all ${
                  task.locked
                    ? "border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/5 opacity-70"
                    : dueDateStatus.status === "overdue"
                    ? "border-black dark:border-white bg-black/10 dark:bg-white/10"
                    : "border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white hover:shadow-lg"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {task.locked && (
                      <Lock size={12} className="text-black/40 dark:text-white/40 mt-0.5 flex-shrink-0" />
                    )}
                    <h3 className={`font-bold text-sm flex-1 truncate ${
                      task.locked
                        ? "text-black/40 dark:text-white/40 line-through"
                        : "text-black dark:text-white"
                    }`}>
                      {task.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {dueDateStatus.status && (
                      <div
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold ${
                          dueDateStatus.status === "overdue"
                            ? "text-black dark:text-white bg-black/10 dark:bg-white/10"
                            : "text-black dark:text-white bg-black/5 dark:bg-white/5"
                        }`}
                      >
                        {dueDateStatus.status === "overdue" && (
                          <AlertCircle size={10} />
                        )}
                        {dueDateStatus.status === "due-soon" && dueDateStatus.daysUntil === 0
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
                            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                            aria-label="Edit task"
                            type="button"
                          >
                            <Edit2 size={12} className="text-black dark:text-white" />
                          </button>
                        )}
                        {onTaskDelete && (
                          <button
                            onClick={() => onTaskDelete(task)}
                            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                            aria-label="Delete task"
                            type="button"
                          >
                            <Trash2 size={12} className="text-black dark:text-white" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {task.description && (
                  <p className="text-xs text-black/60 dark:text-white/60 line-clamp-2 leading-relaxed mb-2 font-bold">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-black/10 dark:border-white/10">
                  <div className="flex items-center gap-1.5 text-xs text-black/50 dark:text-white/50 font-bold">
                    <span className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5">
                      {task.column.title}
                    </span>
                  </div>
                  {dueDate && (
                    <div className="flex items-center gap-1 text-xs text-black/50 dark:text-white/50 font-bold">
                      <Calendar size={10} />
                      <span>{formatDateToDDMMYYYY(dueDate)}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
