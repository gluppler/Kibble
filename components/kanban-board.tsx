/**
 * Kanban Board Component
 * 
 * Main component that manages the entire kanban board with drag-and-drop functionality.
 * Handles:
 * - Board data fetching and state management
 * - Task and column drag-and-drop operations
 * - Task locking/unlocking when moved to/from Done column
 * - Optimistic UI updates for real-time feedback
 * - Automatic archiving of tasks in Done column (24-hour archive)
 * - Task editing and deletion dialogs
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Column, Task, Board } from "@/lib/types";
import { KanbanColumn } from "./kanban-column";
import { EditTaskDialog } from "./edit-task-dialog";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { LayoutSelector } from "./layout-selector";
import { useLayout } from "@/contexts/layout-context";
import { BoardTableView } from "./board-table-view";
import { BoardGridView } from "./board-grid-view";
import { BoardListView } from "./board-list-view";
import { useAlerts } from "@/contexts/alert-context";
import { logError } from "@/lib/logger";

/**
 * Props for KanbanBoard component
 */
interface KanbanBoardProps {
  boardId: string;
}

/**
 * Helper function to find a task within a board structure
 * 
 * @param board - The board object containing columns and tasks
 * @param taskId - The ID of the task to find
 * @returns Object containing the task and its parent column, or null if not found
 * 
 * This function searches through all columns to locate a specific task,
 * returning both the task and its containing column for drag-and-drop operations.
 * 
 * Fixed: Added null checks to prevent crashes with invalid board data.
 */
function findTaskInBoard(
  board: Board,
  taskId: string
): { task: Task; column: Column & { tasks: Task[] } } | null {
  if (!board || !board.columns || !Array.isArray(board.columns)) {
    return null;
  }
  
  for (const column of board.columns) {
    if (!column || !column.tasks || !Array.isArray(column.tasks)) {
      continue;
    }
    const task = column.tasks.find((t: Task) => t && t.id === taskId);
    if (task) {
      return { task, column };
    }
  }
  return null;
}

/**
 * KanbanBoard Component
 * 
 * Main board component that orchestrates all drag-and-drop operations,
 * board state management, and task/column interactions.
 */
export function KanbanBoard({ boardId }: KanbanBoardProps) {
  // Alert context for completion alerts
  const { addCompletionAlert } = useAlerts();
  // Layout context for view mode
  const { layout } = useLayout();
  
  // Board state
  const [board, setBoard] = useState<Board | null>(null);
  // Active task being dragged (for drag overlay)
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  // Loading state
  const [loading, setLoading] = useState(true);
  // Task being edited
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  // Task being deleted
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  /**
   * Drag sensor configuration
   * Uses both pointer and touch sensors for optimal mobile and desktop support
   * - Pointer sensor for mouse/trackpad (8px activation distance)
   * - Touch sensor for mobile devices (5px activation distance)
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // Reduced delay for better mobile responsiveness
        tolerance: 8, // Increased tolerance to prevent accidental drags while allowing intentional drags
      },
    })
  );

  /**
   * Fetches board data from the API
   * 
   * Memoized with useCallback to prevent infinite loops and stale closures.
   * Fetches complete board structure including columns and tasks.
   * 
   * Fixed: Added proper error handling and validation.
   */
  const fetchBoard = useCallback(async () => {
    if (!boardId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}`);
      
      if (res.ok) {
        const data = await res.json();
        // Validate board data structure
        if (data && data.id && Array.isArray(data.columns)) {
          setBoard(data);
        } else {
          // Invalid board data
          setBoard(null);
        }
      } else {
        // Handle different error statuses
        const errorData = await res.json().catch(() => ({}));
        
        // If board not found or forbidden, clear board state
        if (res.status === 404 || res.status === 403) {
          setBoard(null);
        }
        
        logError("[BOARD FETCH] Failed to fetch board:", {
          status: res.status,
          error: errorData.error || "Unknown error",
        });
      }
    } catch (error) {
      // Network or other errors
      setBoard(null);
      logError("[BOARD FETCH] Error fetching board:", error);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  /**
   * Auto-archive effect for tasks in Done column
   * 
   * Runs archive cleanup every 5 minutes to archive tasks that have been in Done column
   * for more than 24 hours. Also runs immediately on component mount.
   */
  useEffect(() => {
    // Periodic archive cleanup interval
    const archiveInterval = setInterval(async () => {
      try {
        await fetch("/api/tasks/cleanup", {
          method: "POST",
        });
        // Refetch board after archive to reflect changes
        await fetchBoard();
      } catch (error) {
          logError("Failed to archive tasks:", error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    // Initial archive cleanup on mount
    const initialArchive = async () => {
      try {
        await fetch("/api/tasks/cleanup", {
          method: "POST",
        });
        await fetchBoard();
      } catch (error) {
          logError("Failed to archive tasks:", error);
      }
    };
    initialArchive();

    // Cleanup interval on unmount
    return () => clearInterval(archiveInterval);
  }, [fetchBoard]);

  /**
   * Handles drag start event
   * 
   * @param event - Drag start event from dnd-kit
   * 
   * Sets the active task for drag overlay display.
   * Prevents dragging locked tasks (tasks in Done column).
   * 
   * Fixed: Added null checks to prevent crashes.
   */
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (!board || !board.columns || !Array.isArray(board.columns)) return;

    // Check if dragging a task
    const result = findTaskInBoard(board, active.id as string);
    if (result && result.task) {
      // Prevent dragging locked tasks
      if (result.task.locked) {
        return;
      }
      setActiveTask(result.task);
    }
    // Note: Columns can also be dragged, but we don't need to track them here
  };

  /**
   * Handles drag over event
   * 
   * @param event - Drag over event from dnd-kit
   * 
   * Simplified implementation - only provides visual feedback.
   * All state updates are handled in handleDragEnd to prevent conflicts
   * between optimistic updates in dragOver and dragEnd handlers.
   */
  const handleDragOver = (event: DragOverEvent) => {
    // Simplified drag over - just visual feedback, no state updates
    // All state updates happen in handleDragEnd for consistency
    // This prevents conflicts between dragOver and dragEnd optimistic updates
  };

  /**
   * Handles drag end event - main drag-and-drop logic
   * 
   * @param event - Drag end event from dnd-kit
   * 
   * This is the core function that handles all drag-and-drop operations:
   * 
   * 1. Column Reordering:
   *    - Calculates new order based on drop position
   *    - Updates column order in database
   * 
   * 2. Task Dragging:
   *    - Determines target column and position
   *    - Performs optimistic UI update for immediate feedback
   *    - Handles task locking when moved to Done column
   *    - Updates task in database
   *    - Refetches board to ensure consistency
   * 
   * Key features:
   * - Optimistic updates for real-time UI feedback
   * - Automatic task locking when moved to Done column
   * - Task unlocking when moved from Done column
   * - Proper order recalculation for all affected tasks
   */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !board || !board.columns || !Array.isArray(board.columns)) {
      // If dropped outside or board is invalid, just return (optimistic update will remain)
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dragging a column (not a task)
    // Optimize: Use a single pass to find both columns if needed
    let draggedColumn: (Column & { tasks: Task[] }) | undefined;
    let overColumn: (Column & { tasks: Task[] }) | undefined;
    const isDraggingColumn = board.columns.some(col => {
      if (col && col.id === activeId) draggedColumn = col;
      if (col && col.id === overId) overColumn = col;
      return col && col.id === activeId;
    });
    
    if (isDraggingColumn) {
      // Handle column reordering
      if (!draggedColumn) {
        return; // Invalid drag, just return without refetch
      }
      if (!overColumn || draggedColumn.id === overColumn.id) {
        // No change or dropped on itself - no update needed
        return;
      }

      // Calculate new order based on the column it was dropped on
      const sortedCols = [...board.columns]
        .filter(col => col && typeof col.order === 'number')
        .sort((a, b) => a.order - b.order);
      const draggedIndex = sortedCols.findIndex(col => col && col.id === activeId);
      const overIndex = sortedCols.findIndex(col => col && col.id === overId);

      if (draggedIndex === -1 || overIndex === -1) {
        return; // Invalid indices, just return without refetch
      }

      // Calculate new order based on the target index
      // The order should match the position in the array (0, 1, 2, 3...)
      let newOrder: number;
      
      if (draggedIndex < overIndex) {
        // Dragging to the right - place at the target's position
        // The target column will shift left
        newOrder = overIndex;
      } else {
        // Dragging to the left - place at the target's position
        // The target column will shift right
        newOrder = overIndex;
      }
      
      // If no change in position, return early (no update needed)
      if (draggedIndex === overIndex) {
        return;
      }

      // Update column order in database
      try {
        const response = await fetch(`/api/columns/${activeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: newOrder }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          logError("[COLUMN DRAG END] Failed to update column:", errorData);
          throw new Error(errorData.error || "Failed to update column order");
        }

        // Update board state optimistically instead of refetching
        // This prevents unnecessary full board refetches
        setBoard((prevBoard) => {
          if (!prevBoard) return prevBoard;
          
          const updatedBoard: Board = {
            ...prevBoard,
            columns: [...prevBoard.columns]
              .filter(col => col && typeof col.order === 'number')
              .sort((a, b) => {
                // Re-sort columns based on new order
                if (a.id === activeId) return newOrder - b.order;
                if (b.id === activeId) return a.order - newOrder;
                return a.order - b.order;
              })
              .map((col, index) => ({ ...col, order: index })),
          };
          return updatedBoard;
        });
      } catch (error) {
        logError("[COLUMN DRAG END] Failed to update column order:", error);
        // Revert on error by refetching
        // Only refetch on actual errors - this is necessary to restore correct state
        await fetchBoard();
      }
      return;
    }

    // ========== TASK DRAGGING LOGIC ==========
    
    // Find the task being dragged
    const taskId = activeId;
    const result = findTaskInBoard(board, taskId);
    if (!result || !result.task || !result.column) {
      // Task not found, just return (no update possible)
      return;
    }

    const { task, column: currentColumn } = result;

    // Safety check: ensure task and currentColumn are valid
    if (!task || !currentColumn || !currentColumn.id || typeof task.order !== 'number') {
      return; // Invalid task/column, just return
    }

    // Initialize with current values (will be updated based on drop target)
    let newColumnId = currentColumn.id;
    let newOrder = task.order;

    // Determine target column and position based on drop target
    const targetColumn = board.columns.find(col => col && col.id === overId);
    
    if (targetColumn && targetColumn.id) {
      // Dropped directly on a column
      newColumnId = targetColumn.id;
      // Get max order in target column (excluding the task being moved)
      const tasks = Array.isArray(targetColumn.tasks) ? targetColumn.tasks : [];
      const targetTasks = tasks.filter((t: Task) => t && t.id !== taskId);
      if (targetTasks.length > 0) {
        const orders = targetTasks
          .filter(t => t && typeof t.order === 'number')
          .map(t => t.order);
        const maxOrder = orders.length > 0 ? Math.max(...orders) : 0;
        newOrder = maxOrder + 1; // Place at end
      } else {
        // Empty column, start at 0
        newOrder = 0;
      }
    } else {
      // Dropped on another task - find that task's column and position
      const overTaskResult = findTaskInBoard(board, overId);
      if (overTaskResult && overTaskResult.column && overTaskResult.column.id) {
        newColumnId = overTaskResult.column.id;
        
        // Get sorted tasks in target column (excluding the task being moved)
        const tasks = Array.isArray(overTaskResult.column.tasks) ? overTaskResult.column.tasks : [];
        const targetTasks = tasks
          .filter((t: Task) => t && t.id !== taskId)
          .sort((a, b) => a.order - b.order);
        
        const overTaskIndex = targetTasks.findIndex((t: Task) => t && t.id === overId);
        
        if (overTaskIndex !== -1 && targetTasks[overTaskIndex]) {
          // Insert at the position of the over task
          const overTask = targetTasks[overTaskIndex];
          newOrder = typeof overTask.order === 'number' ? overTask.order : 0;
        } else {
          // Fallback: add to end if target task not found
          if (targetTasks.length > 0) {
            const orders = targetTasks
              .filter(t => t && typeof t.order === 'number')
              .map(t => t.order);
            const maxOrder = orders.length > 0 ? Math.max(...orders) : 0;
            newOrder = maxOrder + 1;
          } else {
            newOrder = 0;
          }
        }
      } else {
        // Invalid drop target, just return (no update possible)
        return;
      }
    }

    // Early return if no change in position
    // Safety check: ensure currentColumn and task are valid
    if (!currentColumn || !task || !currentColumn.id) {
      return; // Invalid state, just return
    }
    
    if (currentColumn.id === newColumnId && task.order === newOrder) {
      return;
    }

    // ========== OPTIMISTIC UI UPDATE ==========
    // Update local state immediately for real-time UI feedback
    // Use functional update to ensure we're working with the latest state
    setBoard((prevBoard) => {
      if (!prevBoard || !prevBoard.columns || !Array.isArray(prevBoard.columns)) {
        return prevBoard;
      }
      
      // Find target column to determine if task should be locked
      // Optimize: Cache column lookup
      const targetColumn = prevBoard.columns.find(col => col && col.id === newColumnId);
      const isMovingToDone = targetColumn?.title === "Done";
      const wasInDone = currentColumn?.title === "Done";
      
      // Create deep copy of board structure to ensure React detects the change
      const updatedBoard: Board = {
        ...prevBoard,
        columns: prevBoard.columns.filter(col => col).map(col => {
          if (col && col.id === currentColumn.id) {
            // Remove task from source column and reorder remaining tasks
            const tasks = Array.isArray(col.tasks) ? col.tasks : [];
            const updatedTasks = tasks
              .filter(t => t && t.id !== taskId)
              .map((t, index) => ({ ...t, order: index }));
            return { ...col, tasks: updatedTasks };
          } else if (col && col.id === newColumnId) {
            // Add task to target column with correct locked status
            const updatedTask: Task = {
              ...task,
              columnId: newColumnId,
              order: newOrder,
              // Lock only if moving TO Done column, unlock if moving FROM Done
              locked: isMovingToDone,
              movedToDoneAt: isMovingToDone ? new Date() : (wasInDone ? null : task.movedToDoneAt),
            };
            
            const tasks = Array.isArray(col.tasks) ? col.tasks : [];
            const targetTasks = tasks.filter(t => t && t.id !== taskId);
            
            // Insert task at correct position
            if (newOrder >= targetTasks.length) {
              targetTasks.push(updatedTask);
            } else {
              targetTasks.splice(newOrder, 0, updatedTask);
            }
            
            // Reorder all tasks in target column (create new objects for immutability)
            const reorderedTasks = targetTasks.map((t, index) => ({ ...t, order: index }));
            
            return { ...col, tasks: reorderedTasks };
          }
          return col;
        }),
      };
      
      return updatedBoard;
    });

    // ========== DATABASE UPDATE ==========
    // Persist changes to database
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          columnId: newColumnId,
          order: newOrder,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update task");
      }
      
      const updatedTask = await response.json();
      
      // Check if task was moved to Done column - show completion alert in real-time
      // IMPORTANT: Call addCompletionAlert OUTSIDE of setBoard callback to avoid React state update errors
      // Validate task has required properties before creating alert
      if (updatedTask && updatedTask.id && updatedTask.title && updatedTask.locked) {
        // Get target column from current board state to check if it's "Done"
        const targetColumn = board?.columns?.find(col => col && col.id === newColumnId);
        if (targetColumn?.title === "Done") {
          try {
            addCompletionAlert(updatedTask);
          } catch (error) {
            // Don't break the drag operation
            logError("[DRAG END] Failed to add completion alert:", error);
          }
        }
      }
      
      // Update board state with the API response instead of refetching
      // This prevents unnecessary full board refetches and page refreshes
      // The optimistic update already shows the change, we just need to sync the locked status and any server-side changes
      setBoard((prevBoard) => {
        if (!prevBoard || !updatedTask) return prevBoard;
        
        // Create updated board with the server response merged in
        const syncedBoard: Board = {
          ...prevBoard,
          columns: prevBoard.columns.map(col => {
            if (!col) return col;
            
            // Update the task in the target column with the server response
            if (col.id === newColumnId) {
              const tasks = Array.isArray(col.tasks) ? col.tasks : [];
              const updatedTasks = tasks.map(t => {
                if (t.id === updatedTask.id) {
                  // Merge server response with existing task data, preserving column reference
                  return { 
                    ...updatedTask, 
                    column: col,
                    // Ensure all task properties are preserved
                    description: updatedTask.description ?? t.description,
                    dueDate: updatedTask.dueDate ?? t.dueDate,
                  };
                }
                return t;
              });
              return { ...col, tasks: updatedTasks };
            }
            
            // Remove task from source column if it was moved
            if (col.id === currentColumn.id && col.id !== newColumnId) {
              const tasks = Array.isArray(col.tasks) ? col.tasks : [];
              const filteredTasks = tasks.filter(t => t.id !== updatedTask.id);
              return { ...col, tasks: filteredTasks };
            }
            
            return col;
          }),
        };
        
        return syncedBoard;
      });
    } catch (error) {
      logError("[DRAG END] Failed to update task:", error);
      // Revert optimistic update on error by refetching
      // Only refetch on actual errors - this is necessary to restore correct state
      await fetchBoard();
    }
  };

  /**
   * Handles task creation completion
   * 
   * @param newTask - The newly created task from API
   * 
   * Updates board state optimistically with the new task instead of refetching.
   * This prevents page refresh and provides instant feedback.
   */
  const handleTaskAdded = useCallback((newTask: Task) => {
    if (!newTask) return;
    
    // Update board state optimistically with the new task
    setBoard((prevBoard) => {
      if (!prevBoard) {
        // If no board, trigger a refetch
        fetchBoard();
        return prevBoard;
      }
      
      // Find the column that should contain the new task
      const targetColumn = prevBoard.columns.find(
        col => col && col.id === newTask.columnId
      );
      
      if (!targetColumn) {
        // If column not found, fall back to refetch (shouldn't happen)
        fetchBoard();
        return prevBoard;
      }
      
      // Create updated board with new task added to the correct column
      const updatedBoard: Board = {
        ...prevBoard,
        columns: prevBoard.columns.map(col => {
          if (col && col.id === newTask.columnId) {
            // Add the new task to this column
            const tasks = Array.isArray(col.tasks) ? col.tasks : [];
            // Ensure task has column reference for consistency
            const taskWithColumn = { ...newTask, column: col };
            return {
              ...col,
              tasks: [...tasks, taskWithColumn].sort((a, b) => a.order - b.order),
            };
          }
          return col;
        }),
      };
      
      return updatedBoard;
    });
  }, [fetchBoard]);

  /**
   * Handles task edit action
   * 
   * @param task - Task to edit
   * 
   * Opens the edit dialog for the specified task.
   */
  const handleTaskEdit = useCallback((task: Task) => {
    setEditingTask(task);
  }, []);

  /**
   * Handles task delete action
   * 
   * @param task - Task to delete
   * 
   * Opens the delete confirmation dialog for the specified task.
   */
  const handleTaskDelete = useCallback((task: Task) => {
    setDeletingTask(task);
  }, []);

  /**
   * Handles task archive action
   * 
   * @param task - Task to archive
   * 
   * Archives the task (does not delete).
   */
  const handleTaskArchive = useCallback(async (task: Task) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}/archive`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to archive task");
      }

      // Emit archive event for real-time updates in archive page
      if (typeof window !== "undefined") {
        const { emitArchiveEvent } = await import("@/lib/archive-events");
        emitArchiveEvent("tasks");
      }

      // Refetch board to reflect changes
      await fetchBoard();
    } catch (error) {
        logError("[TASK ARCHIVE] Error archiving task:", error);
    }
  }, [fetchBoard]);

  /**
   * Handles confirmed task deletion
   * 
   * Deletes the task from the database and refetches the board.
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingTask) return;

    try {
      const response = await fetch(`/api/tasks/${deletingTask.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete task");
      }

      setDeletingTask(null);
      await fetchBoard();
    } catch (error) {
        logError("Failed to delete task:", error);
      alert(error instanceof Error ? error.message : "Failed to delete task");
    }
  }, [deletingTask, fetchBoard]);

  /**
   * Memoized sorted columns array
   * Sorts columns by their order property to maintain correct display order
   * 
   * Fixed: Added validation to prevent crashes with invalid board data.
   */
  const sortedColumns = useMemo(() => {
    if (!board || !board.columns || !Array.isArray(board.columns)) return [];
    return [...board.columns]
      .filter(col => col && typeof col.order === 'number')
      .sort((a, b) => a.order - b.order);
  }, [board]);

  /**
   * Memoized column IDs array
   * Required by SortableContext for column drag-and-drop functionality
   */
  const columnIds = useMemo(
    () => sortedColumns.map((col) => col.id),
    [sortedColumns]
  );

  // Calculate column width based on viewport and column count
  // MUST be called before any early returns to follow Rules of Hooks
  const columnCount = sortedColumns.length;
  
  /**
   * Dynamic column width calculation that scales with viewport
   * Ensures all columns fit on one page when possible
   * 
   * Fixed: Mobile-first approach with proper fixed widths for touch interaction
   * Fixed: Ensures columns are wide enough for drag-and-drop on mobile
   * 
   * Note: This hook must be called before any conditional returns
   * to maintain consistent hook order across all renders.
   * 
   * Note: Actual styling is handled by CSS classes for better responsive behavior
   */
  const columnWidthStyle = useMemo(() => {
    if (columnCount === 0) return { width: '100%' };
    
    // Mobile-first: Fixed width for optimal touch interaction
    // 280px minimum ensures columns are wide enough for drag-and-drop
    // 90vw accounts for padding, clamped to 320px max for readability
    return {
      width: 'clamp(280px, 90vw, 320px)',
      minWidth: '280px',
      maxWidth: '100%',
      flexShrink: 0,
    };
  }, [columnCount]);

  // Early returns AFTER all hooks have been called
  // This ensures hooks are always called in the same order
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen-responsive w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-black dark:text-white font-bold text-sm sm:text-base">Loading board...</p>
        </motion.div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center min-h-screen-responsive w-full">
        <div className="text-center">
          <p className="text-black dark:text-white font-bold text-sm sm:text-base mb-2">Board not found</p>
          <p className="text-xs text-black/60 dark:text-white/60 font-bold">The board may have been deleted or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-black w-full min-w-0 overflow-hidden">
      <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 border-b border-black/10 dark:border-white/10 bg-white dark:bg-black lg:pl-6 w-full flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-black dark:text-white truncate pl-10 sm:pl-12 lg:pl-0 flex-1 min-w-0"
          >
            {board.title}
          </motion.h1>
          <div className="flex-shrink-0">
            <LayoutSelector />
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden p-2 sm:p-3 md:p-4 lg:p-5 w-full min-w-0" style={{ minHeight: 0 }}>
        {layout === "kanban" ? (
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div 
              className="w-full kanban-columns-container"
              style={{
                // CSS handles flex-wrap and overflow via .kanban-columns-container class
                // Mobile: wraps vertically (2 columns per row)
                // Desktop: horizontal layout with scroll if needed
                height: '100%',
                minWidth: 0,
                maxWidth: '100%',
                // Ensure proper touch scrolling on mobile
                // Allow panning for scrolling, but let drag-and-drop handle touch events on tasks
                touchAction: 'pan-y',
              }}
            >
              <SortableContext
                items={columnIds}
                strategy={horizontalListSortingStrategy}
              >
                {sortedColumns.map((column, index) => {
                  // Safety check: ensure column is valid
                  if (!column || !column.id) return null;
                  
                  return (
                    <motion.div
                      key={column.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      className="kanban-column-wrapper"
                      // Column width is handled by CSS (.kanban-column-wrapper)
                      // Mobile: 2 columns per row (50% width each)
                      // Desktop: flexible based on column count
                    >
                      <KanbanColumn
                        column={column}
                        onTaskAdded={handleTaskAdded}
                        onTaskEdit={handleTaskEdit}
                        onTaskDelete={handleTaskDelete}
                        onTaskArchive={handleTaskArchive}
                      />
                    </motion.div>
                  );
                })}
              </SortableContext>
            </div>
            
            <DragOverlay>
              {activeTask ? (
                <div className="bg-white dark:bg-black p-3.5 rounded-lg shadow-2xl border-2 border-black dark:border-white rotate-2 opacity-95 transform scale-105">
                  <h3 className="font-bold text-black dark:text-white text-sm">
                    {activeTask.title}
                  </h3>
                  {activeTask.description && (
                    <p className="text-xs text-black/60 dark:text-white/60 mt-1 line-clamp-1">
                      {activeTask.description}
                    </p>
                  )}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : layout === "table" ? (
          <div className="h-full overflow-auto">
            <BoardTableView
              board={board}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              onTaskArchive={handleTaskArchive}
            />
          </div>
        ) : layout === "grid" ? (
          <div className="h-full overflow-auto">
            <BoardGridView
              board={board}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              onTaskArchive={handleTaskArchive}
            />
          </div>
        ) : layout === "list" ? (
          <div className="h-full overflow-auto">
            <BoardListView
              board={board}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              onTaskArchive={handleTaskArchive}
            />
          </div>
        ) : null}
      </div>

      <EditTaskDialog
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        onUpdate={fetchBoard}
      />

      <DeleteConfirmationDialog
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        itemName={deletingTask?.title || ""}
      />
    </div>
  );
}
