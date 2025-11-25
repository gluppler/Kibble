/**
 * Kanban Task Component
 * 
 * Displays an individual task card within a kanban column. Supports:
 * - Drag and drop functionality (disabled for locked tasks)
 * - Due date status indicators (overdue, due soon, upcoming)
 * - Task editing and deletion
 * - Visual feedback for locked tasks (Done column)
 * - Auto-deletion countdown for tasks in Done column
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Calendar, AlertCircle, Edit2, Trash2, MoreVertical, Lock, Clock } from "lucide-react";
import type { Task } from "@/lib/types";

/**
 * Props for KanbanTask component
 */
interface KanbanTaskProps {
  task: Task;
  columnTitle?: string;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

/**
 * Calculates the status of a task's due date
 * 
 * @param dueDate - The task's due date (Date object, string, or null)
 * @returns Object containing status and days until/since due date
 * 
 * Status values:
 * - "overdue": Task is past due date
 * - "due-soon": Task is due today or within 3 days
 * - "upcoming": Task is due in more than 3 days
 * - null: No due date set
 */
function getDueDateStatus(dueDate: Date | null | undefined): {
  status: "overdue" | "due-soon" | "upcoming" | null;
  daysUntil: number | null;
} {
  // Return null status if no due date
  if (!dueDate) return { status: null, daysUntil: null };

  // Calculate difference between due date and now
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Determine status based on days difference
  if (diffDays < 0) {
    // Task is overdue
    return { status: "overdue", daysUntil: Math.abs(diffDays) };
  } else if (diffDays === 0) {
    // Task is due today
    return { status: "due-soon", daysUntil: 0 };
  } else if (diffDays <= 3) {
    // Task is due within 3 days
    return { status: "due-soon", daysUntil: diffDays };
  } else {
    // Task is due in more than 3 days
    return { status: "upcoming", daysUntil: diffDays };
  }
}

/**
 * Formats a date to dd/mm/yyyy format
 * 
 * @param date - Date object to format
 * @returns Formatted date string in dd/mm/yyyy format
 */
function formatDateToDDMMYYYY(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * KanbanTask Component
 * 
 * Renders a single task card with drag-and-drop support, due date indicators,
 * and action menu for editing/deleting tasks.
 * 
 * Features:
 * - Drag and drop (disabled for locked tasks)
 * - Visual status indicators (overdue, due soon)
 * - Locked task handling (Done column)
 * - Auto-deletion countdown timer
 * - Edit and delete actions
 */
export function KanbanTask({ task, columnTitle, onEdit, onDelete }: KanbanTaskProps) {
  // State for menu visibility
  const [showMenu, setShowMenu] = useState(false);
  // State for auto-deletion countdown
  const [timeUntilDeletion, setTimeUntilDeletion] = useState<string | null>(null);
  
  // Drag and drop configuration
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: task.locked || false, // Disable dragging for locked tasks
  });
  
  // Task state flags
  const isLocked = task.locked || false;
  const isInDoneColumn = columnTitle === "Done";

  // Transform style for drag and drop
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
  };

  // Calculate due date status for visual indicators
  const dueDateStatus = getDueDateStatus(task.dueDate || null);
  
  // Parse dueDate correctly - handle both string and Date objects
  const dueDate = task.dueDate 
    ? (task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate))
    : null;

  /**
   * Calculate and update time until auto-deletion for locked tasks
   * 
   * Tasks in Done column are automatically deleted after 24 hours.
   * This effect updates the countdown display every minute.
   */
  useEffect(() => {
    // Only run for locked tasks with a movedToDoneAt timestamp
    if (!task.locked || !task.movedToDoneAt) {
      setTimeUntilDeletion(null);
      return;
    }

    /**
     * Updates the countdown display
     * Calculates time remaining until 24 hours after task was moved to Done
     */
    const updateTime = () => {
      const movedAt = new Date(task.movedToDoneAt!);
      const deletionTime = new Date(movedAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      const now = new Date();
      const diff = deletionTime.getTime() - now.getTime();

      // If time has passed, show "Deleting soon..."
      if (diff <= 0) {
        setTimeUntilDeletion("Deleting soon...");
        return;
      }

      // Calculate hours and minutes remaining
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      // Format display string
      if (hours > 0) {
        setTimeUntilDeletion(`${hours}h ${minutes}m`);
      } else {
        setTimeUntilDeletion(`${minutes}m`);
      }
    };

    // Initial update
    updateTime();
    // Update every minute
    const interval = setInterval(updateTime, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [task.locked, task.movedToDoneAt]);

  /**
   * Handles edit button click
   * 
   * @param e - Mouse event
   * 
   * Prevents editing locked tasks and calls onEdit callback
   */
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowMenu(false);
    
    // Prevent editing locked tasks
    if (isLocked) {
      alert("This task is locked. Tasks in the 'Done' column cannot be edited.");
      return;
    }
    
    // Call edit callback
    onEdit?.(task);
  };

  /**
   * Handles delete button click
   * 
   * @param e - Mouse event
   * 
   * Closes menu and calls onDelete callback
   */
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowMenu(false);
    onDelete?.(task);
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...(!isLocked ? { ...attributes, ...listeners } : {})}
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: isDragging ? 0.4 : 1,
        scale: isDragging ? 0.98 : 1,
        y: 0,
      }}
      whileHover={!isDragging ? { y: -2, scale: 1.02 } : {}}
      whileTap={!isDragging ? { scale: 0.98 } : {}}
      transition={{ 
        duration: isDragging ? 0 : 0.2,
        opacity: { duration: isDragging ? 0 : 0.15 },
      }}
      className={`bg-white dark:bg-gray-800 p-3.5 rounded-lg shadow-sm border transition-all group relative ${
        isLocked
          ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 opacity-90 cursor-not-allowed"
          : isDragging
          ? "border-blue-400 dark:border-blue-500 shadow-lg cursor-grabbing"
          : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md cursor-grab active:cursor-grabbing"
      } ${
        dueDateStatus.status === "overdue"
          ? "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10"
          : dueDateStatus.status === "due-soon"
          ? "border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-900/10"
          : ""
      }`}
      onMouseLeave={() => setShowMenu(false)}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-start gap-2 flex-1">
          {isLocked && (
            <Lock size={14} className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
          )}
          <h3 className={`font-medium text-sm flex-1 ${
            isLocked 
              ? "text-gray-500 dark:text-gray-400 line-through" 
              : "text-gray-900 dark:text-gray-100"
          }`}>
            {task.title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {dueDateStatus.status && (
            <div
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                dueDateStatus.status === "overdue"
                  ? "text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30"
                  : dueDateStatus.status === "due-soon"
                  ? "text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30"
                  : "text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30"
              }`}
            >
              {dueDateStatus.status === "overdue" && (
                <AlertCircle size={12} />
              )}
              {dueDateStatus.status === "due-soon" && dueDateStatus.daysUntil === 0
                ? "Today"
                : dueDateStatus.daysUntil !== null
                ? `${dueDateStatus.daysUntil}d`
                : ""}
            </div>
          )}
            {(onEdit || onDelete) && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowMenu(!showMenu);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-opacity ${
                    isLocked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                  aria-label="Task options"
                  type="button"
                >
                  <MoreVertical size={14} className="text-gray-500 dark:text-gray-400" />
                </button>
              {showMenu && (
                <div className="absolute right-0 top-6 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[120px]">
                  {onEdit && !isLocked && (
                    <button
                      onClick={handleEdit}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      type="button"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                  )}
                  {onEdit && isLocked && (
                    <div className="w-full text-left px-3 py-2 text-sm text-gray-400 dark:text-gray-500 flex items-center gap-2 cursor-not-allowed">
                      <Edit2 size={14} />
                      Edit (Locked)
                    </div>
                  )}
                  {onDelete && (
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      type="button"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {task.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-2">
          {task.description}
        </p>
      )}
      {dueDate && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Calendar size={12} />
          <span>{formatDateToDDMMYYYY(dueDate)}</span>
        </div>
      )}
      {isLocked && timeUntilDeletion && (
        <div className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Clock size={12} />
          <span>Auto-delete in: {timeUntilDeletion}</span>
        </div>
      )}
    </motion.div>
  );
}
