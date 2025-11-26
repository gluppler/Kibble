/**
 * Kanban Board Component
 * 
 * Main component that manages the entire kanban board with drag-and-drop functionality.
 * Handles:
 * - Board data fetching and state management
 * - Task and column drag-and-drop operations
 * - Task locking/unlocking when moved to/from Done column
 * - Optimistic UI updates for real-time feedback
 * - Automatic cleanup of tasks in Done column (24-hour deletion)
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
  useSensor,
  useSensors,
  rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Column, Task } from "@/lib/types";
import { KanbanColumn } from "./kanban-column";
import { EditTaskDialog } from "./edit-task-dialog";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { LayoutSelector } from "./layout-selector";
import { useLayout } from "@/contexts/layout-context";
import { BoardTableView } from "./board-table-view";
import { BoardGridView } from "./board-grid-view";
import { BoardListView } from "./board-list-view";
import { useAlerts } from "@/contexts/alert-context";

/**
 * Board interface - represents a complete kanban board with columns and tasks
 */
interface Board {
  id: string;
  title: string;
  columns: (Column & { tasks: Task[] })[];
}

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
 */
function findTaskInBoard(
  board: Board,
  taskId: string
): { task: Task; column: Column & { tasks: Task[] } } | null {
  for (const column of board.columns) {
    const task = column.tasks.find((t: Task) => t.id === taskId);
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
   * Uses pointer sensor with 8px activation distance to prevent accidental drags
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  /**
   * Fetches board data from the API
   * 
   * Memoized with useCallback to prevent infinite loops and stale closures.
   * Fetches complete board structure including columns and tasks.
   */
  const fetchBoard = useCallback(async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}`);
      if (res.ok) {
        const data = await res.json();
        setBoard(data);
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (process.env.NODE_ENV === "development") {
          console.error("[BOARD FETCH] Failed to fetch board:", errorData);
        }
      }
    } catch (error) {
      console.error("[BOARD FETCH] Error fetching board:", error);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  /**
   * Auto-cleanup effect for tasks in Done column
   * 
   * Runs cleanup every 5 minutes to delete tasks that have been in Done column
   * for more than 24 hours. Also runs immediately on component mount.
   */
  useEffect(() => {
    // Periodic cleanup interval
    const cleanupInterval = setInterval(async () => {
      try {
        await fetch("/api/tasks/cleanup", {
          method: "POST",
        });
        // Refetch board after cleanup to reflect changes
        await fetchBoard();
      } catch (error) {
        console.error("Failed to cleanup tasks:", error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    // Initial cleanup on mount
    const initialCleanup = async () => {
      try {
        await fetch("/api/tasks/cleanup", {
          method: "POST",
        });
        await fetchBoard();
      } catch (error) {
        console.error("Failed to cleanup tasks:", error);
      }
    };
    initialCleanup();

    // Cleanup interval on unmount
    return () => clearInterval(cleanupInterval);
  }, [fetchBoard]);

  /**
   * Handles drag start event
   * 
   * @param event - Drag start event from dnd-kit
   * 
   * Sets the active task for drag overlay display.
   * Prevents dragging locked tasks (tasks in Done column).
   */
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (!board) return;

    // Check if dragging a task
    const result = findTaskInBoard(board, active.id as string);
    if (result) {
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

    if (!over || !board) {
      // If dropped outside, revert by refetching
      await fetchBoard();
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dragging a column (not a task)
    const isDraggingColumn = board.columns.some(col => col.id === activeId);
    
    if (isDraggingColumn) {
      // Handle column reordering
      const draggedColumn = board.columns.find(col => col.id === activeId);
      if (!draggedColumn) {
        await fetchBoard();
        return;
      }

      // Find the new position based on where it was dropped
      const overColumn = board.columns.find(col => col.id === overId);
      if (!overColumn || draggedColumn.id === overColumn.id) {
        // No change or dropped on itself
        await fetchBoard();
        return;
      }

      // Calculate new order based on the column it was dropped on
      const sortedCols = [...board.columns].sort((a, b) => a.order - b.order);
      const draggedIndex = sortedCols.findIndex(col => col.id === activeId);
      const overIndex = sortedCols.findIndex(col => col.id === overId);

      if (draggedIndex === -1 || overIndex === -1) {
        await fetchBoard();
        return;
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
      
      // If no change in position, return early
      if (draggedIndex === overIndex) {
        await fetchBoard();
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
          console.error("[COLUMN DRAG END] Failed to update column:", errorData);
          throw new Error(errorData.error || "Failed to update column order");
        }

        // Refetch to get updated order
        await fetchBoard();
      } catch (error) {
        console.error("[COLUMN DRAG END] Failed to update column order:", error);
        // Revert on error by refetching
        await fetchBoard();
      }
      return;
    }

    // ========== TASK DRAGGING LOGIC ==========
    
    // Find the task being dragged
    const taskId = activeId;
    const result = findTaskInBoard(board, taskId);
    if (!result) {
      // Task not found, revert by refetching
      await fetchBoard();
      return;
    }

    const { task, column: currentColumn } = result;

    // Initialize with current values (will be updated based on drop target)
    let newColumnId = currentColumn.id;
    let newOrder = task.order;

    // Determine target column and position based on drop target
    const targetColumn = board.columns.find(col => col.id === overId);
    
    if (targetColumn) {
      // Dropped directly on a column
      newColumnId = targetColumn.id;
      // Get max order in target column (excluding the task being moved)
      const targetTasks = targetColumn.tasks.filter((t: Task) => t.id !== taskId);
      if (targetTasks.length > 0) {
        const orders = targetTasks.map(t => t.order);
        const maxOrder = Math.max(...orders);
        newOrder = maxOrder + 1; // Place at end
      } else {
        // Empty column, start at 0
        newOrder = 0;
      }
    } else {
      // Dropped on another task - find that task's column and position
      const overTaskResult = findTaskInBoard(board, overId);
      if (overTaskResult) {
        newColumnId = overTaskResult.column.id;
        
        // Get sorted tasks in target column (excluding the task being moved)
        const targetTasks = overTaskResult.column.tasks
          .filter((t: Task) => t.id !== taskId)
          .sort((a, b) => a.order - b.order);
        
        const overTaskIndex = targetTasks.findIndex((t: Task) => t.id === overId);
        
        if (overTaskIndex !== -1) {
          // Insert at the position of the over task
          const overTask = targetTasks[overTaskIndex];
          newOrder = overTask.order;
        } else {
          // Fallback: add to end if target task not found
          if (targetTasks.length > 0) {
            const orders = targetTasks.map(t => t.order);
            const maxOrder = Math.max(...orders);
            newOrder = maxOrder + 1;
          } else {
            newOrder = 0;
          }
        }
      } else {
        // Invalid drop target, revert
        await fetchBoard();
        return;
      }
    }

    // Early return if no change in position
    if (currentColumn.id === newColumnId && task.order === newOrder) {
      return;
    }

    // ========== OPTIMISTIC UI UPDATE ==========
    // Update local state immediately for real-time UI feedback
    if (board) {
      // Find target column to determine if task should be locked
      const targetColumn = board.columns.find(col => col.id === newColumnId);
      const isMovingToDone = targetColumn?.title === "Done";
      const wasInDone = currentColumn.title === "Done";
      
      // Create deep copy of board structure to ensure React detects the change
      const updatedBoard: Board = {
        ...board,
        columns: board.columns.map(col => {
          if (col.id === currentColumn.id) {
            // Remove task from source column and reorder remaining tasks
            const updatedTasks = col.tasks
              .filter(t => t.id !== taskId)
              .map((t, index) => ({ ...t, order: index }));
            return { ...col, tasks: updatedTasks };
          } else if (col.id === newColumnId) {
            // Add task to target column with correct locked status
            const updatedTask: Task = {
              ...task,
              columnId: newColumnId,
              order: newOrder,
              // Lock only if moving TO Done column, unlock if moving FROM Done
              locked: isMovingToDone,
              movedToDoneAt: isMovingToDone ? new Date() : (wasInDone ? null : task.movedToDoneAt),
            };
            
            const targetTasks = col.tasks.filter(t => t.id !== taskId);
            
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
      
      setBoard(updatedBoard);
    }

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
      const targetColumn = board?.columns.find(col => col.id === newColumnId);
      if (targetColumn?.title === "Done" && updatedTask.locked) {
        addCompletionAlert(updatedTask);
      }
      
      // Refetch immediately to ensure consistency and get updated data (including locked status)
      // No delay needed - the optimistic update already shows the change
      await fetchBoard();
    } catch (error) {
      console.error("[DRAG END] Failed to update task:", error);
      // Revert optimistic update on error by refetching
      await fetchBoard();
    }
  };

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
      console.error("Failed to delete task:", error);
      alert(error instanceof Error ? error.message : "Failed to delete task");
    }
  }, [deletingTask, fetchBoard]);

  /**
   * Memoized sorted columns array
   * Sorts columns by their order property to maintain correct display order
   */
  const sortedColumns = useMemo(() => {
    if (!board) return [];
    return [...board.columns].sort((a, b) => a.order - b.order);
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
   * Note: This hook must be called before any conditional returns
   * to maintain consistent hook order across all renders.
   */
  const columnWidthStyle = useMemo(() => {
    if (columnCount === 0) return { width: '100%' };
    
    // For 4 or fewer columns, use equal distribution with flex
    // This ensures all columns fit on one page and scale proportionally
    // The parent container uses flexbox, so flex: 1 will distribute space equally
    if (columnCount <= 4) {
      return { 
        flex: '1 1 0%', // Equal distribution
        minWidth: 0, // Allow shrinking
        maxWidth: '100%', // Prevent overflow
      };
    }
    
    // For more than 4 columns, use calculated width with horizontal scroll
    // Parent container already accounts for sidebar via margin, so use 100% of container
    // Account for: padding (~2.5rem total), gaps between columns
    const totalGaps = columnCount - 1;
    // Calculate based on container width (100%) minus padding and gaps
    // Minimum 200px per column for readability, maximum 350px
    return {
      width: `clamp(200px, calc((100% - 2.5rem - ${totalGaps}rem) / ${columnCount}), 350px)`,
      minWidth: '200px',
      maxWidth: '350px',
      flexShrink: 0
    };
  }, [columnCount]);

  // Early returns AFTER all hooks have been called
  // This ensures hooks are always called in the same order
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen-responsive w-full">
        <div className="text-black dark:text-white font-bold">Loading board...</div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center min-h-screen-responsive w-full">
        <div className="text-black dark:text-white font-bold">Board not found</div>
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
              className="w-full"
              style={{
                display: 'flex',
                gap: 'clamp(0.5rem, 1.5vw, 1rem)',
                overflowX: columnCount > 4 ? 'auto' : 'hidden',
                overflowY: 'auto',
                width: '100%',
                minWidth: 0,
                maxWidth: '100%',
                alignItems: 'flex-start',
              }}
            >
              <SortableContext
                items={columnIds}
                strategy={horizontalListSortingStrategy}
              >
                {sortedColumns.map((column, index) => (
                  <motion.div
                    key={column.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    className="flex-shrink-0"
                    style={columnWidthStyle}
                  >
                    <KanbanColumn
                      column={column}
                      onTaskAdded={fetchBoard}
                      onTaskEdit={handleTaskEdit}
                      onTaskDelete={handleTaskDelete}
                    />
                  </motion.div>
                ))}
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
            />
          </div>
        ) : layout === "grid" ? (
          <div className="h-full overflow-auto">
            <BoardGridView
              board={board}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
            />
          </div>
        ) : layout === "list" ? (
          <div className="h-full overflow-auto">
            <BoardListView
              board={board}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
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
