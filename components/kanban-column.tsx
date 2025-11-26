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

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Column, Task } from "@/lib/types";
import { KanbanTask } from "./kanban-task";
import { useAlerts } from "@/contexts/alert-context";

/**
 * Props for KanbanColumn component
 */
interface KanbanColumnProps {
  column: Column & { tasks: Task[] };
  onTaskAdded?: () => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
}

/**
 * KanbanColumn Component
 * 
 * Renders a column container with tasks, task creation form, and drag-and-drop support.
 */
export function KanbanColumn({ column, onTaskAdded, onTaskEdit, onTaskDelete }: KanbanColumnProps) {
  // Alert context for real-time alerts
  const { checkTaskForAlert } = useAlerts();
  
  // Form state for task creation
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

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
   */
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate title is provided
    if (!taskTitle.trim()) return;

    // Prepare request body - handle empty strings and undefined properly
    const requestBody: {
      title: string;
      description?: string | null;
      dueDate?: string | null;
      columnId: string;
    } = {
      title: taskTitle.trim(),
      columnId: column.id,
    };

    // Only include description if it has content
    if (taskDescription && taskDescription.trim().length > 0) {
      requestBody.description = taskDescription.trim();
    } else {
      requestBody.description = null;
    }

    // Only include dueDate if it has a value
    if (taskDueDate && taskDueDate.trim().length > 0) {
      requestBody.dueDate = taskDueDate.trim();
    } else {
      requestBody.dueDate = null;
    }

    try {
      // Create task via API
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      // Handle error response
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const errorMessage = data.error || "Failed to create task. Tasks can only be created in the 'To-Do' column.";
        console.error("[TASK CREATE] Failed to create task:", data);
        alert(errorMessage);
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
      setIsAddingTask(false);

      // Refetch board to get the new task - ensure it's awaited
      if (onTaskAdded) {
        await onTaskAdded();
      }
    } catch (error) {
      console.error("[TASK CREATE] Error creating task:", error);
      alert(error instanceof Error ? error.message : "Failed to create task. Please try again.");
    }
  };

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
      style={{ maxWidth: '100%' }}
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/10 dark:border-white/10 flex-shrink-0">
        <h2 className="font-bold text-sm sm:text-base text-black dark:text-white truncate flex-1">
          {column.title}
        </h2>
        <span className="px-2 py-0.5 text-xs font-bold bg-black dark:bg-white text-white dark:text-black rounded-full ml-2 flex-shrink-0">
          {column.tasks.length}
        </span>
      </div>
      <div className="space-y-2 overflow-y-auto scrollbar-thin overflow-x-hidden">
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
            />
          ))}
        </SortableContext>
        {isAddingTask ? (
          <form onSubmit={handleAddTask} className="space-y-2 flex-shrink-0">
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
            <motion.input
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              type="datetime-local"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              placeholder="Due date (optional)"
              className="w-full px-2.5 sm:px-3 py-2 border border-black/20 dark:border-white/20 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-xs sm:text-sm font-bold [color-scheme:light] dark:[color-scheme:dark]"
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex gap-2"
            >
              <button
                type="submit"
                className="flex-1 px-2.5 sm:px-3 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity text-xs sm:text-sm font-bold shadow-sm hover:shadow-md"
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
                }}
                className="px-2.5 sm:px-3 py-2 bg-white dark:bg-black border border-black/20 dark:border-white/20 text-black dark:text-white rounded-lg hover:opacity-80 transition-opacity text-xs sm:text-sm font-bold"
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
            className="w-full py-2.5 text-xs sm:text-sm text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white border-2 border-dashed border-black/20 dark:border-white/20 rounded-lg hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5 transition-all font-bold"
          >
            + Add task
          </motion.button>
        ) : null}
      </div>
    </motion.div>
  );
}
