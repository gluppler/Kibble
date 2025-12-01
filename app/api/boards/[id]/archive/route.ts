/**
 * Board Archive API Route
 * 
 * Archives or unarchives a board and all its tasks.
 * 
 * Security:
 * - Requires authentication
 * - Verifies board ownership
 * - Archives board and all tasks (does not delete)
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";
import { checkBoardPermission } from "@/lib/permissions";
import { logError } from "@/lib/logger";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * POST /api/boards/[id]/archive
 * 
 * Archives a board and all its tasks
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerAuthSession();
    const { id } = await params;

    // Check board permission
    const permissionCheck = await checkBoardPermission(id, session);
    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.statusCode || 403 }
      );
    }

    const archiveDate = new Date();

    // Archive the board and all its tasks in a transaction
    const result = await db.$transaction(async (tx) => {
      // Archive the board
      const board = await tx.board.update({
        where: { id },
        data: {
          archived: true,
          archivedAt: archiveDate,
        },
        select: {
          id: true,
          title: true,
          archived: true,
          archivedAt: true,
        },
      });

      // Archive all tasks in all columns of this board
      const tasksUpdateResult = await tx.task.updateMany({
        where: {
          column: {
            boardId: id,
          },
          archived: false, // Only archive tasks that aren't already archived
        },
        data: {
          archived: true,
          archivedAt: archiveDate,
        },
      });

      return {
        board,
        archivedTasksCount: tasksUpdateResult.count,
      };
    });

    return NextResponse.json(
      {
        success: true,
        board: result.board,
        archivedTasksCount: result.archivedTasksCount,
        message: `Board and ${result.archivedTasksCount} task(s) archived successfully`,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=2, must-revalidate",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error) {
    logError("Error archiving board:", error);
    return NextResponse.json(
      { error: "Failed to archive board" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/boards/[id]/archive
 * 
 * Unarchives a board and all its tasks (restores them)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerAuthSession();
    const { id } = await params;

    // Check board permission
    const permissionCheck = await checkBoardPermission(id, session);
    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.statusCode || 403 }
      );
    }

    // Unarchive the board and all its tasks in a transaction
    const result = await db.$transaction(async (tx) => {
      // Unarchive the board
      const board = await tx.board.update({
        where: { id },
        data: {
          archived: false,
          archivedAt: null,
        },
        select: {
          id: true,
          title: true,
          archived: true,
          archivedAt: true,
        },
      });

      // Unarchive all tasks in all columns of this board
      const tasksUpdateResult = await tx.task.updateMany({
        where: {
          column: {
            boardId: id,
          },
          archived: true, // Only unarchive tasks that are archived
        },
        data: {
          archived: false,
          archivedAt: null,
        },
      });

      return {
        board,
        restoredTasksCount: tasksUpdateResult.count,
      };
    });

    return NextResponse.json(
      {
        success: true,
        board: result.board,
        restoredTasksCount: result.restoredTasksCount,
        message: `Board and ${result.restoredTasksCount} task(s) restored successfully`,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=2, must-revalidate",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error) {
    logError("Error unarchiving board:", error);
    return NextResponse.json(
      { error: "Failed to restore board" },
      { status: 500 }
    );
  }
}
