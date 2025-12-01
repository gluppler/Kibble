/**
 * Permission checking utilities for Kibble application.
 * 
 * This module provides comprehensive permission checking functions that ensure
 * users can only access and modify their own resources. All permission checks
 * follow a layered security approach: authentication → input validation →
 * resource ownership verification.
 * 
 * Security Features:
 * - Input validation prevents injection attacks
 * - Resource ownership verification prevents IDOR vulnerabilities
 * - Comprehensive logging of security events
 * - Parameterized queries via Prisma ORM
 * - Fail-secure defaults (deny access on error)
 * 
 * Permission Layers:
 * 1. Authentication check (user must be logged in)
 * 2. Input validation (IDs must be valid format)
 * 3. Resource ownership (user must own the resource)
 * 4. Relationship validation (resources must be related correctly)
 * 
 * @module lib/permissions
 */

import { db } from "@/lib/db";
import type { Session } from "next-auth";
import { logSecurityEvent } from "@/lib/security-logger";
import { logError } from "@/lib/logger";

/**
 * Result of a permission check operation.
 * 
 * Used throughout the application to standardize permission check responses
 * and provide consistent error handling.
 */
export interface PermissionResult {
  /** Whether the operation is allowed */
  allowed: boolean;
  /** Error message if operation is not allowed (for logging/response) */
  error?: string;
  /** HTTP status code to return if operation is not allowed */
  statusCode?: number;
}

/**
 * Verifies that a user is authenticated.
 * 
 * Checks if a valid session exists with a user ID. This is the first layer
 * of permission checking and must pass before any resource access is allowed.
 * 
 * @param session - User session from NextAuth.js
 * @returns Permission result indicating if user is authenticated
 * 
 * @example
 * ```typescript
 * const authCheck = checkAuthentication(session);
 * if (!authCheck.allowed) {
 *   return NextResponse.json({ error: authCheck.error }, { status: authCheck.statusCode });
 * }
 * ```
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
 * Verifies that a user exists in the database.
 * 
 * This function checks if the user ID from the session actually exists in the database.
 * This prevents foreign key constraint violations when creating resources that reference
 * the user. This is critical for preventing errors when:
 * - User was deleted but session still exists
 * - Session has stale/invalid user ID
 * - Race conditions during user deletion
 * 
 * Security Features:
 * - Validates user ID format before database query
 * - Uses parameterized queries via Prisma ORM
 * - Logs security events for invalid user IDs
 * - Returns generic error messages to prevent information leakage
 * 
 * @param userId - User ID from authenticated session
 * @returns Promise resolving to permission result
 * 
 * @example
 * ```typescript
 * const userCheck = await checkUserExists(userId);
 * if (!userCheck.allowed) {
 *   return NextResponse.json({ error: userCheck.error }, { status: userCheck.statusCode });
 * }
 * ```
 */
export async function checkUserExists(userId: string): Promise<PermissionResult> {
  try {
    // Security: Validate input ID format
    if (!validateIdFormat(userId, "userId")) {
      return {
        allowed: false,
        error: "Invalid user ID",
        statusCode: 400,
      };
    }

    // Security: Prisma uses parameterized queries, preventing SQL injection
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true }, // Only select ID for existence check (minimal data)
    });

    if (!user) {
      // Log security event for invalid user ID in session
      logSecurityEvent({
        type: "invalid_user_session",
        userId: userId,
        details: {
          reason: "User ID in session does not exist in database",
        },
        timestamp: new Date(),
      });

      return {
        allowed: false,
        error: "Unauthorized: Invalid session",
        statusCode: 401,
      };
    }

    return { allowed: true };
  } catch (error) {
    logError("Error checking user existence:", error);
    return {
      allowed: false,
      error: "Failed to verify user",
      statusCode: 500,
    };
  }
}

/**
 * Validates the format of an ID to prevent injection attacks.
 * 
 * This function ensures that all IDs used in database queries follow a safe
 * format that cannot be exploited for SQL injection or other attacks. It
 * validates the format before any database operations are performed.
 * 
 * Security Features:
 * - Rejects empty strings and null/undefined values
 * - Limits length to prevent DoS attacks (max 255 characters)
 * - Only allows alphanumeric characters, hyphens, and underscores
 * - Prevents SQL injection patterns and special characters
 * - Logs invalid attempts for security monitoring
 * 
 * @param id - ID string to validate
 * @param idType - Type of ID (e.g., "boardId", "taskId") for logging purposes
 * @returns `true` if the ID format is valid, `false` otherwise
 * 
 * @example
 * ```typescript
 * if (!validateIdFormat(boardId, "boardId")) {
 *   return { allowed: false, error: "Invalid board ID", statusCode: 400 };
 * }
 * ```
 */
export function validateIdFormat(id: string, idType: string): boolean {
  if (!id || typeof id !== "string" || id.trim().length === 0) {
    return false;
  }
  
  // CUIDs are typically 25 characters, but we allow reasonable range
  if (id.length > 255) {
    return false;
  }
  
  // Allow alphanumeric, hyphens, and underscores (common in CUIDs and UUIDs)
  // Reject SQL injection patterns
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validPattern.test(id)) {
    logError(`Invalid ${idType} format:`, { id: id.substring(0, 10) });
    return false;
  }
  
  return true;
}

/**
 * Verifies that a user owns a specific board.
 * 
 * This function performs a database query to verify that the board exists
 * and belongs to the specified user. It includes input validation and
 * security event logging for unauthorized access attempts.
 * 
 * Security Features:
 * - Validates input IDs before database query
 * - Uses parameterized queries via Prisma ORM
 * - Logs security events for unauthorized access attempts
 * - Returns generic error messages to prevent information leakage
 * 
 * @param boardId - Board ID to verify ownership for
 * @param userId - User ID from authenticated session
 * @returns Promise resolving to permission result
 * 
 * @example
 * ```typescript
 * const ownershipCheck = await checkBoardOwnership(boardId, userId);
 * if (!ownershipCheck.allowed) {
 *   return NextResponse.json({ error: ownershipCheck.error }, { status: ownershipCheck.statusCode });
 * }
 * ```
 */
export async function checkBoardOwnership(
  boardId: string,
  userId: string
): Promise<PermissionResult> {
  try {
    // Security: Validate input IDs
    if (!validateIdFormat(boardId, "boardId")) {
      return {
        allowed: false,
        error: "Invalid board ID",
        statusCode: 400,
      };
    }

    if (!validateIdFormat(userId, "userId")) {
      return {
        allowed: false,
        error: "Invalid user ID",
        statusCode: 400,
      };
    }

    // Security: Prisma uses parameterized queries, preventing SQL injection
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

    // Security: Strict comparison to prevent type coercion attacks
    if (board.userId !== userId) {
      // Log security event
      logSecurityEvent({
        type: "permission_denied",
        userId: userId,
        details: {
          resourceType: "board",
          resourceId: boardId,
          reason: "User does not own board",
        },
        timestamp: new Date(),
      });

      return {
        allowed: false,
        error: "Forbidden: You can only access your own boards",
        statusCode: 403,
      };
    }

    return { allowed: true };
  } catch (error) {
    logError("Error checking board ownership:", error);
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
 * Security:
 * - Validates input IDs to prevent injection
 * - Verifies nested relationships exist
 * - Uses parameterized queries (Prisma)
 * - Logs security events for unauthorized access
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
    // Security: Validate input IDs
    if (!validateIdFormat(taskId, "taskId")) {
      return {
        allowed: false,
        error: "Invalid task ID",
        statusCode: 400,
      };
    }

    if (!validateIdFormat(userId, "userId")) {
      return {
        allowed: false,
        error: "Invalid user ID",
        statusCode: 400,
      };
    }

    // Security: Prisma uses parameterized queries, preventing SQL injection
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

    // Security: Verify nested relationships exist
    if (!task.column) {
      logError("Task missing column relationship:", { taskId });
      return {
        allowed: false,
        error: "Task column not found",
        statusCode: 404,
      };
    }

    if (!task.column.board) {
      logError("Task column missing board relationship:", { taskId });
      return {
        allowed: false,
        error: "Task board not found",
        statusCode: 404,
      };
    }

    // Security: Strict comparison to prevent type coercion attacks
    if (task.column.board.userId !== userId) {
      // Log security event
      logSecurityEvent({
        type: "permission_denied",
        userId: userId,
        details: {
          resourceType: "task",
          resourceId: taskId,
          reason: "User does not own task's board",
        },
        timestamp: new Date(),
      });

      return {
        allowed: false,
        error: "Forbidden: You can only access your own tasks",
        statusCode: 403,
      };
    }

    return { allowed: true };
  } catch (error) {
    logError("Error checking task ownership:", error);
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
 * Security:
 * - Validates input IDs to prevent injection
 * - Verifies board relationship exists
 * - Uses parameterized queries (Prisma)
 * - Logs security events for unauthorized access
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
    // Security: Validate input IDs using centralized validation
    if (!validateIdFormat(columnId, "columnId")) {
      return {
        allowed: false,
        error: "Invalid column ID",
        statusCode: 400,
      };
    }

    if (!validateIdFormat(userId, "userId")) {
      return {
        allowed: false,
        error: "Invalid user ID",
        statusCode: 400,
      };
    }

    // Security: Prisma uses parameterized queries, preventing SQL injection
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

    // Security: Verify board relationship exists
    if (!column.board) {
      logError("Column missing board relationship:", { columnId });
      return {
        allowed: false,
        error: "Column board not found",
        statusCode: 404,
      };
    }

    // Security: Strict comparison to prevent type coercion attacks
    if (column.board.userId !== userId) {
      // Log security event
      logSecurityEvent({
        type: "permission_denied",
        userId: userId,
        details: {
          resourceType: "column",
          resourceId: columnId,
          reason: "User does not own column's board",
        },
        timestamp: new Date(),
      });

      return {
        allowed: false,
        error: "Forbidden: You can only access your own columns",
        statusCode: 403,
      };
    }

    return { allowed: true };
  } catch (error) {
    logError("Error checking column ownership:", error);
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
 * Security:
 * - Validates userId format
 * - Ensures only authenticated users can access alerts
 * 
 * This is used when fetching all alerts for a user.
 * The actual filtering happens at the database level.
 * 
 * @param userId - User ID from session
 * @returns Permission result
 */
export function checkAlertsListAccess(userId: string | undefined): PermissionResult {
  // Security: Check for undefined/null first (authentication issue)
  if (userId === undefined || userId === null) {
    return {
      allowed: false,
      error: "Unauthorized: Authentication required",
      statusCode: 401,
    };
  }

  // Security: Validate userId format (invalid format is a 400 error)
  if (!validateIdFormat(userId, "userId")) {
    return {
      allowed: false,
      error: "Invalid user ID",
      statusCode: 400,
    };
  }

  return { allowed: true };
}

/**
 * Validates that a column belongs to the same board as a task
 * Used when moving tasks between columns
 * 
 * Security:
 * - Validates all input IDs to prevent injection
 * - Verifies board relationship exists
 * - Uses parameterized queries (Prisma)
 * - Prevents cross-board task movement
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
    // Security: Validate all input IDs
    if (!validateIdFormat(columnId, "columnId")) {
      return {
        allowed: false,
        error: "Invalid column ID",
        statusCode: 400,
      };
    }

    if (!validateIdFormat(sourceBoardId, "sourceBoardId")) {
      return {
        allowed: false,
        error: "Invalid source board ID",
        statusCode: 400,
      };
    }

    if (!validateIdFormat(userId, "userId")) {
      return {
        allowed: false,
        error: "Invalid user ID",
        statusCode: 400,
      };
    }

    // Security: Prisma uses parameterized queries, preventing SQL injection
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

    // Security: Verify board relationship exists
    if (!column.board) {
      logError("Column missing board relationship:", { columnId });
      return {
        allowed: false,
        error: "Column board not found",
        statusCode: 404,
      };
    }

    // Security: Strict comparison to prevent type coercion attacks
    if (column.board.userId !== userId) {
      return {
        allowed: false,
        error: "Forbidden: You can only move tasks within your own boards",
        statusCode: 403,
      };
    }

    // Security: Prevent cross-board task movement
    if (column.board.id !== sourceBoardId) {
      return {
        allowed: false,
        error: "Forbidden: Cannot move task to different board",
        statusCode: 403,
      };
    }

    return { allowed: true };
  } catch (error) {
    logError("Error checking column board match:", error);
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
