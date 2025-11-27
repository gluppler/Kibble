/**
 * Board Archive API Route
 * 
 * Archives or unarchives a board.
 * 
 * Security:
 * - Requires authentication
 * - Verifies board ownership
 * - Archives board (does not delete)
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
 * Archives a board
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

    // Archive the board
    const board = await db.board.update({
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
      },
    });

    return NextResponse.json({
      success: true,
      board,
      message: "Board archived successfully",
    });
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
 * Unarchives a board (restores it)
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

    // Unarchive the board
    const board = await db.board.update({
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

    return NextResponse.json({
      success: true,
      board,
      message: "Board restored successfully",
    });
  } catch (error) {
    logError("Error unarchiving board:", error);
    return NextResponse.json(
      { error: "Failed to restore board" },
      { status: 500 }
    );
  }
}
