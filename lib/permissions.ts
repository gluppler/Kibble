/**
 * Permission Utilities Module
 * 
 * Provides functions for checking user permissions for:
 * - Feature 1: Tasks, Kanban Boards, Class-based Task Categories
 * - Feature 2: Due Date Alerts, Completion Alerts
 * 
 * All permission checks ensure users can only access/modify their own resources.
 */

import { db } from "@/lib/db";
import type { Session } from "next-auth";

/**
 * Permission check result
 */
export interface PermissionResult {
  allowed: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * Checks if user is authenticated
 * 
 * @param session - User session from NextAuth
 * @returns Permission result
 */
export function checkAuthentication(session: Session | null): PermissionResult {
  if (!session?.user?.id) {
    return {
      allowed: false,
      error: "Unauthorized: Authentication required",
      statusCode: 401,
    };
  }
  return { allowed: true };
}

/**
 * Checks if user owns a board
 * 
 * @param boardId - Board ID to check
 * @param userId - User ID from session
 * @returns Permission result
 */
export async function checkBoardOwnership(
  boardId: string,
  userId: string
): Promise<PermissionResult> {
  try {
    const board = await db.board.findUnique({
      where: { id: boardId },
      select: { userId: true },
    });

    if (!board) {
      return {
        allowed: false,
        error: "Board not found",
        statusCode: 404,
      };
    }

    if (board.userId !== userId) {
      return {
        allowed: false,
        error: "Forbidden: You can only access your own boards",
        statusCode: 403,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error checking board ownership:", error);
    return {
      allowed: false,
      error: "Failed to verify board ownership",
      statusCode: 500,
    };
  }
}

/**
 * Checks if user owns a task (through board ownership)
 * 
 * @param taskId - Task ID to check
 * @param userId - User ID from session
 * @returns Permission result
 */
export async function checkTaskOwnership(
  taskId: string,
  userId: string
): Promise<PermissionResult> {
  try {
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        column: {
          include: {
            board: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!task) {
      return {
        allowed: false,
        error: "Task not found",
        statusCode: 404,
      };
    }

    if (task.column.board.userId !== userId) {
      return {
        allowed: false,
        error: "Forbidden: You can only access your own tasks",
        statusCode: 403,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error checking task ownership:", error);
    return {
      allowed: false,
      error: "Failed to verify task ownership",
      statusCode: 500,
    };
  }
}

/**
 * Checks if user owns a column (through board ownership)
 * 
 * @param columnId - Column ID to check
 * @param userId - User ID from session
 * @returns Permission result
 */
export async function checkColumnOwnership(
  columnId: string,
  userId: string
): Promise<PermissionResult> {
  try {
    const column = await db.column.findUnique({
      where: { id: columnId },
      include: {
        board: {
          select: { userId: true },
        },
      },
    });

    if (!column) {
      return {
        allowed: false,
        error: "Column not found",
        statusCode: 404,
      };
    }

    if (column.board.userId !== userId) {
      return {
        allowed: false,
        error: "Forbidden: You can only access your own columns",
        statusCode: 403,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error checking column ownership:", error);
    return {
      allowed: false,
      error: "Failed to verify column ownership",
      statusCode: 500,
    };
  }
}

/**
 * Checks if user can access alerts for their tasks
 * 
 * Alerts are automatically scoped to user's own tasks through board ownership.
 * This function verifies that a task belongs to the user before allowing alert access.
 * 
 * @param taskId - Task ID to check
 * @param userId - User ID from session
 * @returns Permission result
 */
export async function checkAlertAccess(
  taskId: string,
  userId: string
): Promise<PermissionResult> {
  // Alerts are tied to tasks, so we check task ownership
  return checkTaskOwnership(taskId, userId);
}

/**
 * Checks if user can view alerts for all their boards
 * 
 * This is used when fetching all alerts for a user.
 * The actual filtering happens at the database level.
 * 
 * @param userId - User ID from session
 * @returns Permission result
 */
export function checkAlertsListAccess(userId: string | undefined): PermissionResult {
  if (!userId) {
    return {
      allowed: false,
      error: "Unauthorized: Authentication required",
      statusCode: 401,
    };
  }
  return { allowed: true };
}

/**
 * Validates that a column belongs to the same board as a task
 * Used when moving tasks between columns
 * 
 * @param columnId - Target column ID
 * @param sourceBoardId - Source board ID (from task's current column)
 * @param userId - User ID from session
 * @returns Permission result
 */
export async function checkColumnBoardMatch(
  columnId: string,
  sourceBoardId: string,
  userId: string
): Promise<PermissionResult> {
  try {
    const column = await db.column.findUnique({
      where: { id: columnId },
      include: {
        board: {
          select: { id: true, userId: true },
        },
      },
    });

    if (!column) {
      return {
        allowed: false,
        error: "Column not found",
        statusCode: 404,
      };
    }

    if (column.board.userId !== userId) {
      return {
        allowed: false,
        error: "Forbidden: You can only move tasks within your own boards",
        statusCode: 403,
      };
    }

    if (column.board.id !== sourceBoardId) {
      return {
        allowed: false,
        error: "Forbidden: Cannot move task to different board",
        statusCode: 403,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error checking column board match:", error);
    return {
      allowed: false,
      error: "Failed to verify column board match",
      statusCode: 500,
    };
  }
}

/**
 * Comprehensive permission check for board operations
 * 
 * @param boardId - Board ID
 * @param session - User session
 * @returns Permission result
 */
export async function checkBoardPermission(
  boardId: string,
  session: Session | null
): Promise<PermissionResult> {
  const authCheck = checkAuthentication(session);
  if (!authCheck.allowed) {
    return authCheck;
  }

  return checkBoardOwnership(boardId, session!.user.id);
}

/**
 * Comprehensive permission check for task operations
 * 
 * @param taskId - Task ID
 * @param session - User session
 * @returns Permission result
 */
export async function checkTaskPermission(
  taskId: string,
  session: Session | null
): Promise<PermissionResult> {
  const authCheck = checkAuthentication(session);
  if (!authCheck.allowed) {
    return authCheck;
  }

  return checkTaskOwnership(taskId, session!.user.id);
}

/**
 * Comprehensive permission check for column operations
 * 
 * @param columnId - Column ID
 * @param session - User session
 * @returns Permission result
 */
export async function checkColumnPermission(
  columnId: string,
  session: Session | null
): Promise<PermissionResult> {
  const authCheck = checkAuthentication(session);
  if (!authCheck.allowed) {
    return authCheck;
  }

  return checkColumnOwnership(columnId, session!.user.id);
}

/**
 * Comprehensive permission check for alert operations
 * 
 * @param taskId - Task ID (alerts are tied to tasks)
 * @param session - User session
 * @returns Permission result
 */
export async function checkAlertPermission(
  taskId: string,
  session: Session | null
): Promise<PermissionResult> {
  const authCheck = checkAuthentication(session);
  if (!authCheck.allowed) {
    return authCheck;
  }

  return checkAlertAccess(taskId, session!.user.id);
}
