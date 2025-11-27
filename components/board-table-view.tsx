/**
 * Board Table View Component
 * 
 * Displays kanban board tasks in a table/spreadsheet format.
 * Columns become table columns, tasks become rows.
 */

"use client";

import { useMemo, memo } from "react";
import { motion } from "framer-motion";
import { Calendar, AlertCircle, Edit2, Trash2, Lock } from "lucide-react";
import type { Task, Column } from "@/lib/types";
import { formatDateToDDMMYYYY, getDueDateStatus } from "@/lib/date-formatters";

/**
 * Board interface - represents a complete kanban board with columns and tasks
 */
interface Board {
  id: string;
  title: string;
  columns: (Column & { tasks: Task[] })[];
}

/**
 * Props for BoardTableView component
 */
interface BoardTableViewProps {
  board: Board;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
}

/**
 * BoardTableView Component
 * 
 * Renders board tasks in a table format with columns as table columns.
 * Memoized to prevent unnecessary re-renders.
 */
export const BoardTableView = memo(function BoardTableView({ board, onTaskEdit, onTaskDelete }: BoardTableViewProps) {
  const sortedColumns = useMemo(() => {
    return [...board.columns].sort((a, b) => a.order - b.order);
  }, [board.columns]);

  // Flatten all tasks with their column information
  // Use the column the task is found in as the source of truth to avoid misalignment
  const allTasks = useMemo(() => {
    const tasks: Array<Task & { column: Column; actualColumnId: string }> = [];
    sortedColumns.forEach((column) => {
      column.tasks.forEach((task) => {
        // Use the column.id where the task was found as the source of truth
        // This ensures correct alignment even if task.columnId is stale after drag
        tasks.push({ ...task, column, actualColumnId: column.id });
      });
    });
    return tasks;
  }, [sortedColumns]);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-full inline-block align-middle">
        <div className="overflow-hidden border border-black/10 dark:border-white/10 rounded-lg">
          <table className="min-w-full divide-y divide-black/10 dark:divide-white/10">
            <thead className="bg-black/5 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">
                  Task
                </th>
                {sortedColumns.map((column) => (
                  <th
                    key={column.id}
                    className="px-4 py-3 text-center text-xs font-bold text-black dark:text-white uppercase tracking-wider"
                  >
                    {column.title}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-black dark:text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-black divide-y divide-black/10 dark:divide-white/10">
              {allTasks.length === 0 ? (
                <tr>
                  <td colSpan={sortedColumns.length + 3} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm text-black/60 dark:text-white/60 font-bold">No tasks found</p>
                      <p className="text-xs text-black/40 dark:text-white/40 font-bold">Create your first task in the To-Do column</p>
                    </div>
                  </td>
                </tr>
              ) : (
                allTasks.map((task) => {
                  const dueDateStatus = getDueDateStatus(task.dueDate || null);
                  const dueDate = task.dueDate
                    ? (task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate))
                    : null;

                  return (
                    <motion.tr
                      key={task.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {task.locked && (
                            <Lock size={12} className="text-black/40 dark:text-white/40 flex-shrink-0" />
                          )}
                          <span className={`text-sm font-bold ${
                            task.locked
                              ? "text-black/40 dark:text-white/40 line-through"
                              : "text-black dark:text-white"
                          }`}>
                            {task.title}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-black/60 dark:text-white/60 mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </td>
                      {sortedColumns.map((column) => {
                        // Use actualColumnId (where task was found) as source of truth
                        // This ensures correct alignment even after drag operations
                        const isInColumn = task.actualColumnId === column.id;
                        return (
                          <td key={column.id} className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center justify-center w-full">
                            {isInColumn && (
                              <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold bg-black dark:bg-white text-white dark:text-black min-w-[24px]">
                                ✓
                              </span>
                            )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {dueDate ? (
                          <div className="flex items-center gap-1.5">
                            {dueDateStatus.status === "overdue" && (
                              <AlertCircle size={12} className="text-black dark:text-white" />
                            )}
                            <span className={`text-xs font-bold ${
                              dueDateStatus.status === "overdue"
                                ? "text-black dark:text-white"
                                : "text-black/60 dark:text-white/60"
                            }`}>
                              {formatDateToDDMMYYYY(dueDate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-black/40 dark:text-white/40 font-bold">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
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
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
