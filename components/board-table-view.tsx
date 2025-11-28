/**
 * Board Table View Component
 * 
 * Displays kanban board tasks in a table/spreadsheet format.
 * Columns become table columns, tasks become rows.
 */

"use client";

import { useMemo, memo } from "react";
import { motion } from "framer-motion";
import { Calendar, AlertCircle, Edit2, Trash2, Lock, Archive } from "lucide-react";
import type { Task, Board, Column } from "@/lib/types";
import { formatDateToDDMMYYYY, getDueDateStatus } from "@/lib/date-formatters";
import { PriorityTag } from "@/components/priority-tag";

/**
 * Props for BoardTableView component
 */
interface BoardTableViewProps {
  board: Board;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  onTaskArchive?: (task: Task) => void;
}

/**
 * BoardTableView Component
 * 
 * Renders board tasks in a table format with columns as table columns.
 * Memoized to prevent unnecessary re-renders.
 */
export const BoardTableView = memo(function BoardTableView({ board, onTaskEdit, onTaskDelete, onTaskArchive }: BoardTableViewProps) {
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
    <div className="w-full overflow-x-auto -webkit-overflow-scrolling-touch overscroll-x-contain">
      <div className="min-w-full inline-block align-middle">
        <div className="overflow-hidden border border-black/10 dark:border-white/10 rounded-lg">
          <table className="min-w-full divide-y divide-black/10 dark:divide-white/10">
            <thead className="bg-black/5 dark:bg-white/5">
              <tr>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider min-w-[120px] sm:min-w-[150px]">
                  Task
                </th>
                {sortedColumns.map((column) => (
                  <th
                    key={column.id}
                    className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-bold text-black dark:text-white uppercase tracking-wider min-w-[60px] sm:min-w-[80px]"
                  >
                    <span className="hidden sm:inline">{column.title}</span>
                    <span className="sm:hidden text-[10px]">{column.title.substring(0, 3)}</span>
                  </th>
                ))}
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider min-w-[90px] sm:min-w-[110px]">
                  Due Date
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-bold text-black dark:text-white uppercase tracking-wider min-w-[80px] sm:min-w-[100px]">
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
                  const dueDateStatus = getDueDateStatus(task.dueDate);
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
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {task.locked && (
                            <Lock size={12} className="text-black/40 dark:text-white/40 flex-shrink-0" />
                          )}
                          <span className={`text-xs sm:text-sm font-bold ${
                            task.locked
                              ? "text-black/40 dark:text-white/40 line-through"
                              : "text-black dark:text-white"
                          }`}>
                            {task.title}
                          </span>
                        </div>
                        <div className="mt-1">
                          <PriorityTag 
                            priority={(task.priority as "normal" | "high") || "normal"} 
                            size="sm"
                          />
                        </div>
                        {task.description && (
                          <p className="text-[10px] sm:text-xs text-black/60 dark:text-white/60 mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </td>
                      {sortedColumns.map((column) => {
                        // Use actualColumnId (where task was found) as source of truth
                        // This ensures correct alignment even after drag operations
                        const isInColumn = task.actualColumnId === column.id;
                        return (
                          <td key={column.id} className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex items-center justify-center w-full">
                            {isInColumn && (
                              <span className="inline-flex items-center justify-center px-1.5 sm:px-2 py-1 rounded text-[10px] sm:text-xs font-bold bg-black dark:bg-white text-white dark:text-black min-w-[20px] sm:min-w-[24px] min-h-[20px] sm:min-h-[24px]">
                                ✓
                              </span>
                            )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        {dueDate ? (
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            {dueDateStatus.status === "overdue" && (
                              <AlertCircle size={12} className="text-black dark:text-white flex-shrink-0 hidden sm:block" />
                            )}
                            {dueDateStatus.status === "overdue" && (
                              <AlertCircle size={10} className="text-black dark:text-white flex-shrink-0 sm:hidden" />
                            )}
                            <span className={`text-[10px] sm:text-xs font-bold ${
                              dueDateStatus.status === "overdue"
                                ? "text-black dark:text-white"
                                : "text-black/60 dark:text-white/60"
                            }`}>
                              {formatDateToDDMMYYYY(dueDate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] sm:text-xs text-black/40 dark:text-white/40 font-bold">—</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          {onTaskEdit && !task.locked && (
                            <button
                              onClick={() => onTaskEdit(task)}
                              className="p-2 sm:p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                              aria-label="Edit task"
                              type="button"
                            >
                              <Edit2 size={14} className="text-black dark:text-white hidden sm:block" />
                              <Edit2 size={16} className="text-black dark:text-white sm:hidden" />
                            </button>
                          )}
                          {onTaskArchive && (
                            <button
                              onClick={() => onTaskArchive(task)}
                              className="p-2 sm:p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                              aria-label="Archive task"
                              type="button"
                            >
                              <Archive size={14} className="text-black dark:text-white hidden sm:block" />
                              <Archive size={16} className="text-black dark:text-white sm:hidden" />
                            </button>
                          )}
                          {onTaskDelete && (
                            <button
                              onClick={() => onTaskDelete(task)}
                              className="p-2 sm:p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                              aria-label="Delete task"
                              type="button"
                            >
                              <Trash2 size={14} className="text-black dark:text-white hidden sm:block" />
                              <Trash2 size={16} className="text-black dark:text-white sm:hidden" />
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
