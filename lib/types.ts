/**
 * Type definitions for Kibble application
 * 
 * This file re-exports Prisma-generated types for use throughout the application.
 * This provides a single source of truth for type definitions and allows for
 * easy type updates if the database schema changes.
 */

import type { Column as PrismaColumn, Task as PrismaTask } from ".prisma/client";

/**
 * Column type - represents a kanban board column (e.g., "To-Do", "In-Progress", "Review", "Done")
 * Re-exported from Prisma-generated types
 */
export type Column = PrismaColumn;

/**
 * Task type - represents a task/note within a kanban column
 * Re-exported from Prisma-generated types
 */
export type Task = PrismaTask;
