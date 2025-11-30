/**
 * Kanban Task Component
 * 
 * Displays an individual task card within a kanban column. Supports:
 * - Drag and drop functionality (disabled for locked tasks)
 * - Due date status indicators (overdue, due soon, upcoming)
 * - Task editing and deletion
 * - Visual feedback for locked tasks (Done column)
 * - Auto-archive countdown for tasks in Done column
 */

"use client";

import { useState, useEffect, useRef, memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Calendar, AlertCircle, Edit2, Trash2, MoreVertical, Lock, Clock, Archive } from "lucide-react";
import type { Task } from "@/lib/types";
import { formatDateToDDMMYYYY, getDueDateStatus } from "@/lib/date-formatters";
import { PriorityTag } from "@/components/priority-tag";

/**
 * Props for KanbanTask component
 */
interface KanbanTaskProps {
  task: Task;
  columnTitle?: string;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onArchive?: (task: Task) => void;
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
 * - Auto-archive countdown timer
 * - Edit and delete actions
 */
export const KanbanTask = memo(function KanbanTask({ task, columnTitle, onEdit, onDelete, onArchive }: KanbanTaskProps) {
  // State for menu visibility
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // State for auto-archive countdown
  const [timeUntilArchive, setTimeUntilArchive] = useState<string | null>(null);
  
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
    zIndex: showMenu ? 100 : undefined,
  };

  // Calculate due date status for visual indicators
  const dueDateStatus = getDueDateStatus(task.dueDate);
  
  // Parse dueDate correctly - handle both string and Date objects
  const dueDate = task.dueDate 
    ? (task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate))
    : null;

  /**
   * Calculate and update time until auto-archive for locked tasks
   * 
   * Tasks in Done column are automatically archived after 24 hours.
   * This effect updates the countdown display every minute.
   */
  useEffect(() => {
    // Only run for locked tasks with a movedToDoneAt timestamp that aren't already archived
    if (!task.locked || !task.movedToDoneAt || task.archived) {
      setTimeUntilArchive(null);
      return;
    }

    /**
     * Updates the countdown display
     * Calculates time remaining until 24 hours after task was moved to Done
     */
    const updateTime = () => {
      const movedAt = new Date(task.movedToDoneAt!);
      const archiveTime = new Date(movedAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      const now = new Date();
      const diff = archiveTime.getTime() - now.getTime();

      // If time has passed, show "Archiving soon..."
      if (diff <= 0) {
        setTimeUntilArchive("Archiving soon...");
        return;
      }

      // Calculate hours and minutes remaining
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      // Format display string
      if (hours > 0) {
        setTimeUntilArchive(`${hours}h ${minutes}m`);
      } else {
        setTimeUntilArchive(`${minutes}m`);
      }
    };

    // Initial update
    updateTime();
    // Update every minute
    const interval = setInterval(updateTime, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [task.locked, task.movedToDoneAt, task.archived]);

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

  /**
   * Handles archive button click
   * 
   * @param e - Mouse event
   * 
   * Closes menu and calls onArchive callback
   */
  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowMenu(false);
    onArchive?.(task);
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={{
        ...style,
        // Consistent border width across themes
        borderWidth: '1px',
        // Ensure proper touch handling for drag-and-drop on mobile
        touchAction: isLocked ? 'auto' : 'none', // Prevent default touch behaviors to allow drag
      }}
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
      className={`bg-white dark:bg-black p-3 sm:p-3.5 rounded-lg border transition-all group relative mb-2 ${
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
        <div className="flex items-baseline gap-2 flex-1 min-w-0">
          {isLocked && (
            <Lock size={12} className="text-black/40 dark:text-white/40 flex-shrink-0" style={{ marginTop: '2px' }} />
          )}
          <h3 className={`font-bold text-xs sm:text-sm flex-1 truncate leading-tight ${
            isLocked 
              ? "text-black/40 dark:text-white/40 line-through" 
              : "text-black dark:text-white"
          }`}>
            {task.title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <PriorityTag 
            priority={(task.priority as "normal" | "high") || "normal"} 
            size="sm"
          />
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
              <div className="relative" ref={menuRef}>
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
                <div className="absolute right-0 top-6 z-[100] bg-white dark:bg-black rounded-lg shadow-xl border border-black/10 dark:border-white/10 py-1 min-w-[120px]">
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
                  {onArchive && (
                    <button
                      onClick={handleArchive}
                      className="w-full text-left px-3 py-2 text-xs sm:text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 flex items-center gap-2 font-bold"
                      type="button"
                    >
                      <Archive size={12} />
                      Archive
                    </button>
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
      <div className="mb-2">
        {task.description && (
          <p className="text-xs text-black/60 dark:text-white/60 line-clamp-2 leading-relaxed mb-1.5 font-bold">
            {task.description}
          </p>
        )}
      </div>
      {dueDate && (
        <div className="flex items-center gap-1.5 text-xs text-black dark:text-white mt-2 pt-2 border-t border-black/10 dark:border-white/10 font-bold">
          <Calendar size={14} className="text-black dark:text-white flex-shrink-0" style={{ width: '14px', height: '14px' }} />
          <span className="leading-tight">{formatDateToDDMMYYYY(dueDate)}</span>
        </div>
      )}
      {isLocked && timeUntilArchive && (
        <div className="flex items-center gap-1.5 text-xs text-black dark:text-white mt-2 pt-2 border-t border-black/10 dark:border-white/10 font-bold">
          <Clock size={14} className="text-black dark:text-white flex-shrink-0" style={{ width: '14px', height: '14px' }} />
          <span className="leading-tight">Auto-archive in: {timeUntilArchive}</span>
        </div>
      )}
    </motion.div>
  );
});
