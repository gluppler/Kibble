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
      console.log(`[TASK CREATE] Creating task:`, {
        title: requestBody.title,
        description: requestBody.description,
        dueDate: requestBody.dueDate,
        columnId: requestBody.columnId,
      });

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
      console.log("[TASK CREATE] Task created successfully:", {
        id: createdTask.id,
        title: createdTask.title,
        description: createdTask.description,
        dueDate: createdTask.dueDate,
      });

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
      className={`flex flex-col w-full sm:w-80 min-w-[280px] max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 transition-all duration-200 ${
        isOver ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 shadow-md scale-[1.02]" : ""
      }`}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-base text-gray-900 dark:text-white">
          {column.title}
        </h2>
        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
          {column.tasks.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 min-h-[150px] sm:min-h-[200px] overflow-y-auto scrollbar-thin max-h-[calc(100vh-180px)] sm:max-h-[calc(100vh-200px)]">
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
        {column.tasks.length === 0 && !isAddingTask && (
          <div className="text-center text-gray-400 dark:text-gray-600 py-8 text-sm">
            Drop tasks here
          </div>
        )}
        {isAddingTask ? (
          <form onSubmit={handleAddTask} className="space-y-2">
            <motion.input
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Task title"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all text-sm"
            />
            <motion.input
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              type="datetime-local"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              placeholder="Due date (optional)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex gap-2"
            >
              <button
                type="submit"
                className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all text-sm font-medium shadow-sm hover:shadow-md"
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
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                Cancel
              </button>
            </motion.div>
          </form>
        ) : canCreateTasks ? (
          <motion.button
            onClick={() => setIsAddingTask(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all"
          >
            + Add task
          </motion.button>
        ) : (
          <div className="text-center text-gray-400 dark:text-gray-500 py-4 text-xs italic">
            Tasks can only be created in "To-Do"
          </div>
        )}
      </div>
    </motion.div>
  );
}
