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
      className={`bg-white dark:bg-black p-3 sm:p-3.5 rounded-lg border transition-all group relative ${
        isLocked
          ? "border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/5 opacity-70 cursor-not-allowed"
          : isDragging
          ? "border-black dark:border-white shadow-xl cursor-grabbing"
          : "border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white hover:shadow-lg cursor-grab active:cursor-grabbing"
      } ${
        dueDateStatus.status === "overdue"
          ? "border-black dark:border-white bg-black/10 dark:bg-white/10"
          : dueDateStatus.status === "due-soon"
          ? "border-black/30 dark:border-white/30 bg-black/5 dark:bg-white/5"
          : ""
      }`}
      onMouseLeave={() => setShowMenu(false)}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {isLocked && (
            <Lock size={12} className="text-black/40 dark:text-white/40 mt-0.5 flex-shrink-0" />
          )}
          <h3 className={`font-bold text-xs sm:text-sm flex-1 truncate ${
            isLocked 
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
                  : dueDateStatus.status === "due-soon"
                  ? "text-black dark:text-white bg-black/5 dark:bg-white/5"
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
            {(onEdit || onDelete) && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowMenu(!showMenu);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-all opacity-100"
                  aria-label="Task options"
                  type="button"
                >
                  <MoreVertical size={16} className="text-black dark:text-white" />
                </button>
              {showMenu && (
                <div className="absolute right-0 top-6 z-50 bg-white dark:bg-black rounded-lg shadow-xl border border-black/10 dark:border-white/10 py-1 min-w-[120px]">
                  {onEdit && !isLocked && (
                    <button
                      onClick={handleEdit}
                      className="w-full text-left px-3 py-2 text-xs sm:text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 flex items-center gap-2 font-bold"
                      type="button"
                    >
                      <Edit2 size={12} />
                      Edit
                    </button>
                  )}
                  {onEdit && isLocked && (
                    <div className="w-full text-left px-3 py-2 text-xs sm:text-sm text-black/40 dark:text-white/40 flex items-center gap-2 cursor-not-allowed font-bold">
                      <Edit2 size={12} />
                      Edit (Locked)
                    </div>
                  )}
                  {onDelete && (
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-3 py-2 text-xs sm:text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 flex items-center gap-2 font-bold"
                      type="button"
                    >
                      <Trash2 size={12} />
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
        <p className="text-xs text-black/60 dark:text-white/60 line-clamp-2 leading-relaxed mb-2 font-bold">
          {task.description}
        </p>
      )}
      {dueDate && (
        <div className="flex items-center gap-1.5 text-xs text-black dark:text-white mt-2 pt-2 border-t border-black/10 dark:border-white/10 font-bold">
          <Calendar size={14} className="text-black dark:text-white flex-shrink-0" />
          <span>{formatDateToDDMMYYYY(dueDate)}</span>
        </div>
      )}
      {isLocked && timeUntilDeletion && (
        <div className="flex items-center gap-1.5 text-xs text-black dark:text-white mt-2 pt-2 border-t border-black/10 dark:border-white/10 font-bold">
          <Clock size={14} className="text-black dark:text-white flex-shrink-0" />
          <span>Auto-delete in: {timeUntilDeletion}</span>
        </div>
      )}
    </motion.div>
  );
}
