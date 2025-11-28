/**
 * Centralized type definitions for the Kibble application.
 * 
 * This module provides a single source of truth for all type definitions,
 * re-exporting Prisma-generated types and defining application-specific
 * interfaces. This approach ensures consistency across the codebase and
 * simplifies type maintenance when the database schema changes.
 * 
 * @module lib/types
 */

import type { Column as PrismaColumn, Task as PrismaTask } from ".prisma/client";

/**
 * Represents a kanban board column.
 * 
 * Columns organize tasks into workflow stages (e.g., "To-Do", "In-Progress",
 * "Review", "Done"). Each column belongs to a board and contains an ordered
 * list of tasks.
 * 
 * @example
 * ```typescript
 * const column: Column = {
 *   id: "col-123",
 *   title: "To-Do",
 *   order: 0,
 *   boardId: "board-456",
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 * ```
 */
export type Column = PrismaColumn;

/**
 * Represents a task within a kanban column.
 * 
 * Tasks are the fundamental unit of work in Kibble. Each task belongs to
 * exactly one column and can have optional metadata like descriptions,
 * due dates, and archive status.
 * 
 * @example
 * ```typescript
 * const task: Task = {
 *   id: "task-789",
 *   title: "Complete project",
 *   description: "Finish the implementation",
 *   dueDate: new Date("2024-12-31"),
 *   order: 0,
 *   columnId: "col-123",
 *   locked: false,
 *   archived: false,
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 * ```
 */
export type Task = PrismaTask;

/**
 * Represents a complete kanban board with nested columns and tasks.
 * 
 * This interface extends the basic board structure to include fully
 * populated columns with their associated tasks. Used throughout the
 * application for board display and manipulation.
 * 
 * @example
 * ```typescript
 * const board: Board = {
 *   id: "board-456",
 *   title: "Project Alpha",
 *   columns: [
 *     {
 *       id: "col-123",
 *       title: "To-Do",
 *       order: 0,
 *       tasks: [/* task objects *\/],
 *     },
 *   ],
 * };
 * ```
 */
export interface Board {
  /** Unique identifier for the board */
  id: string;
  /** Display name of the board */
  title: string;
  /** Array of columns, each containing its associated tasks */
  columns: (Column & { tasks: Task[] })[];
}
