/**
 * Kanban Column Component
 * 
 * Displays a single column in a kanban board (e.g., "To-Do", "In-Progress", "Review", "Done").
 * Supports:
 * - Task display and sorting
 * - Task creation (only in "To-Do" column)
 * - Drag and drop target for tasks
 * - Task editing and deletion callbacks
 */

"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Column, Task } from "@/lib/types";
import { logError } from "@/lib/logger";
import { KanbanTask } from "./kanban-task";
import { useAlerts } from "@/contexts/alert-context";
import { getDateInputFormatHint } from "@/lib/date-utils";
import { deduplicatedFetch } from "@/lib/request-deduplication";

/**
 * Props for KanbanColumn component
 */
interface KanbanColumnProps {
  column: Column & { tasks: Task[] };
  onTaskAdded?: (newTask: Task) => void | Promise<void>;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  onTaskArchive?: (task: Task) => void;
}

/**
 * KanbanColumn Component
 * 
 * Renders a column container with tasks, task creation form, and drag-and-drop support.
 */
export const KanbanColumn = memo(function KanbanColumn({ column, onTaskAdded, onTaskEdit, onTaskDelete, onTaskArchive }: KanbanColumnProps) {
  // Alert context for real-time alerts
  const { checkTaskForAlert } = useAlerts();
  
  // Form state for task creation
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<"normal" | "high">("normal");
  const [taskError, setTaskError] = useState("");

  // Drag and drop configuration - makes this column a drop target
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  /**
   * Memoized sorted tasks list
   * Sorts tasks by their order property to maintain correct display order
   */
  const sortedTasks = useMemo(() => {
    return [...column.tasks].sort((a: Task, b: Task) => a.order - b.order);
  }, [column.tasks]);

  /**
   * Memoized task IDs array
   * Required by SortableContext for drag and drop functionality
   */
  const taskIds = useMemo(
    () => sortedTasks.map((task: Task) => task.id),
    [sortedTasks]
  );

  /**
   * Handles task creation form submission
   * 
   * @param e - Form submit event
   * 
   * Process:
   * 1. Validates form input (title required)
   * 2. Prepares request body with proper null handling
   * 3. Sends POST request to create task
   * 4. Resets form and triggers board refetch on success
   * 
   * Memoized with useCallback to prevent unnecessary re-renders
   */
  const handleAddTask = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate title is provided
    if (!taskTitle.trim()) return;

    // Prepare request body - handle empty strings and undefined properly
    const requestBody: {
      title: string;
      description?: string | null;
      dueDate?: string | null;
      priority?: "normal" | "high";
      columnId: string;
    } = {
      title: taskTitle.trim(),
      columnId: column.id,
      priority: taskPriority,
    };

    // Only include description if it has content
    const trimmedDescription = taskDescription?.trim();
    requestBody.description = trimmedDescription && trimmedDescription.length > 0 ? trimmedDescription : null;

    // Only include dueDate if it has a value
    const trimmedDueDate = taskDueDate?.trim();
    requestBody.dueDate = trimmedDueDate && trimmedDueDate.length > 0 ? trimmedDueDate : null;

    try {
      // Create task via API
      const response = await deduplicatedFetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      // Handle error response
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const errorMessage = data.error || "Failed to create task. Tasks can only be created in the 'To-Do' column.";
          logError("[TASK CREATE] Failed to create task:", data);
        setTaskError(errorMessage);
        return;
      }

      // Task created successfully
      const createdTask = await response.json();

      // Check for due date alert in real-time
      if (createdTask.dueDate) {
        checkTaskForAlert(createdTask);
      }

      // Reset form state
      setTaskTitle("");
      setTaskDescription("");
      setTaskDueDate("");
      setTaskPriority("normal");
      setTaskError("");
      setIsAddingTask(false);

      // Pass the new task to parent for optimistic update instead of full refetch
      // This prevents page refresh and provides instant feedback
      if (onTaskAdded) {
        await onTaskAdded(createdTask);
      }
    } catch (error) {
        logError("[TASK CREATE] Error creating task:", error);
      setTaskError(error instanceof Error ? error.message : "Failed to create task. Please try again.");
    }
  }, [taskTitle, taskDescription, taskDueDate, taskPriority, column.id, onTaskAdded, checkTaskForAlert]);

  /**
   * Determines if tasks can be created in this column
   * Only "To-Do" column allows task creation
   */
  const canCreateTasks = column.title === "To-Do";

  return (
    <motion.div
      ref={setNodeRef}
      className={`flex flex-col w-full min-w-0 bg-white dark:bg-black rounded-lg border border-black/10 dark:border-white/10 p-2 sm:p-3 md:p-4 transition-all duration-200 ${
        isOver ? "border-black dark:border-white shadow-lg scale-[1.01]" : ""
      }`}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={{ 
        maxWidth: '100%',
        width: '100%',
        minHeight: '200px',
        height: '100%',
        borderWidth: '1px', // Consistent border width across themes
        // Ensure proper touch handling for drag-and-drop
        touchAction: 'none', // Prevent default touch behaviors to allow drag
      }}
    >
      <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-black/10 dark:border-white/10 flex-shrink-0">
        <h2 className="font-bold text-sm sm:text-base text-black dark:text-white truncate flex-1 leading-tight">
          {column.title}
        </h2>
        <span className="px-2 py-0.5 text-xs font-bold bg-black dark:bg-white text-white dark:text-black rounded ml-2 flex-shrink-0 leading-tight">
          {column.tasks.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin overflow-x-hidden min-h-0">
        {sortedTasks.length === 0 && !isAddingTask ? (
          <div className="text-center py-6 px-2">
            <p className="text-xs text-black/40 dark:text-white/40 font-bold">No tasks</p>
          </div>
        ) : (
          <SortableContext 
            items={taskIds} 
            strategy={verticalListSortingStrategy}
          >
            {sortedTasks.map((task: Task) => (
              <KanbanTask
                key={task.id}
                task={task}
                columnTitle={column.title}
                onEdit={onTaskEdit}
                onDelete={onTaskDelete}
                onArchive={onTaskArchive}
              />
            ))}
          </SortableContext>
        )}
        {isAddingTask ? (
          <form onSubmit={handleAddTask} className="space-y-2 flex-shrink-0 mt-2">
            {taskError && (
              <div className="p-2 bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-lg text-xs text-black dark:text-white font-bold">
                {taskError}
              </div>
            )}
            <motion.input
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Task title"
              className="w-full px-2.5 sm:px-3 py-2 border border-black/20 dark:border-white/20 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-xs sm:text-sm font-bold"
              autoFocus
            />
            <motion.textarea
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 }}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full px-2.5 sm:px-3 py-2 border border-black/20 dark:border-white/20 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent resize-none transition-all text-xs sm:text-sm font-bold"
            />
            <div className="relative">
              <motion.input
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                type="datetime-local"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                title={`Due date (optional) - Format: ${getDateInputFormatHint()}`}
                className="w-full px-2.5 sm:px-3 py-2 pr-10 border border-black/20 dark:border-white/20 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-xs sm:text-sm font-bold [color-scheme:light] dark:[color-scheme:dark]"
                style={{
                  paddingRight: '2.5rem',
                }}
              />
              <p className="mt-1 text-xs text-black/40 dark:text-white/40 font-bold">
                Format: {getDateInputFormatHint()}
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
            >
              <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                Priority
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as "normal" | "high")}
                className="w-full px-2.5 sm:px-3 py-2 border border-black/20 dark:border-white/20 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-xs sm:text-sm font-bold transition-all [color-scheme:light] dark:[color-scheme:dark]"
                aria-label="Task priority"
              >
                <option value="normal">Normal</option>
                <option value="high">High Priority</option>
              </select>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex gap-2 items-center"
            >
              <button
                type="submit"
                className="flex-1 px-2.5 sm:px-3 py-2.5 sm:py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity text-xs sm:text-sm font-bold shadow-sm hover:shadow-md min-h-[44px] sm:min-h-[36px] flex items-center justify-center"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingTask(false);
                  setTaskTitle("");
                  setTaskDescription("");
                  setTaskDueDate("");
                  setTaskPriority("normal");
                  setTaskError("");
                }}
                className="px-2.5 sm:px-3 py-2.5 sm:py-2 bg-white dark:bg-black border border-black/20 dark:border-white/20 text-black dark:text-white rounded-lg hover:opacity-80 transition-opacity text-xs sm:text-sm font-bold min-h-[44px] sm:min-h-[36px] flex items-center justify-center"
              >
                Cancel
              </button>
            </motion.div>
          </form>
        ) : canCreateTasks ? (
          <motion.button
            onClick={() => setIsAddingTask(true)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3 sm:py-2.5 text-xs sm:text-sm text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white border-2 border-dashed border-black/20 dark:border-white/20 rounded-lg hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5 transition-all font-bold min-h-[44px] sm:min-h-0"
            type="button"
          >
            + Add task
          </motion.button>
        ) : null}
      </div>
    </motion.div>
  );
});
