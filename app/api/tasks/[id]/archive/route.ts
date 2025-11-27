/**
 * Task Archive API Route
 * 
 * Archives or unarchives a task.
 * 
 * Security:
 * - Requires authentication
 * - Verifies task ownership through board
 * - Archives task (does not delete)
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";
import { checkTaskPermission } from "@/lib/permissions";
import { logError } from "@/lib/logger";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * POST /api/tasks/[id]/archive
 * 
 * Archives a task
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerAuthSession();
    const { id } = await params;

    // Check task permission
    const permissionCheck = await checkTaskPermission(id, session);
    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.statusCode || 403 }
      );
    }

    // Archive the task
    const task = await db.task.update({
      where: { id },
      data: {
        archived: true,
        archivedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        archived: true,
        archivedAt: true,
        columnId: true,
      },
    });

    return NextResponse.json({
      success: true,
      task,
      message: "Task archived successfully",
    });
  } catch (error) {
    logError("Error archiving task:", error);
    return NextResponse.json(
      { error: "Failed to archive task" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]/archive
 * 
 * Unarchives a task (restores it)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerAuthSession();
    const { id } = await params;

    // Check task permission
    const permissionCheck = await checkTaskPermission(id, session);
    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.statusCode || 403 }
      );
    }

    // Unarchive the task
    const task = await db.task.update({
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
        columnId: true,
      },
    });

    return NextResponse.json({
      success: true,
      task,
      message: "Task restored successfully",
    });
  } catch (error) {
    logError("Error unarchiving task:", error);
    return NextResponse.json(
      { error: "Failed to restore task" },
      { status: 500 }
    );
  }
}
