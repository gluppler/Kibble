import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";
import { checkColumnPermission } from "@/lib/permissions";
import { logError } from "@/lib/logger";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerAuthSession();
    const { id } = await params;
    const body = await request.json();
    const { order } = body;

    // Check column permission using permission utility
    const permissionCheck = await checkColumnPermission(id, session);
    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.statusCode || 403 }
      );
    }

    // Get column for order update
    const existingColumn = await db.column.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        order: true,
        boardId: true,
        board: {
          select: {
            id: true,
            title: true,
            userId: true,
          },
        },
      },
    });

    if (!existingColumn) {
      return NextResponse.json(
        { error: "Column not found" },
        { status: 404 }
      );
    }

    // If order is not provided, return existing column
    if (order === undefined) {
      return NextResponse.json(existingColumn);
    }

    // Validate order is a number
    const newOrder = typeof order === "number" ? Math.max(0, order) : existingColumn.order;

    // Get all columns in the same board (only select order field)
    const allColumns = await db.column.findMany({
      where: {
        boardId: existingColumn.boardId,
        id: { not: id },
      },
      select: { order: true }, // Only select order field
      orderBy: { order: "asc" },
    });

    const oldOrder = existingColumn.order;
    
    // Ensure newOrder is within valid range
    let adjustedOrder = Math.max(0, Math.min(newOrder, allColumns.length));

    // If order hasn't changed, return existing column
    if (oldOrder === adjustedOrder) {
      return NextResponse.json(existingColumn);
    }

    // Shift orders for other columns based on direction of move
    if (oldOrder < adjustedOrder) {
      // Moving right/down - decrement orders of columns between old and new position
      await db.column.updateMany({
        where: {
          boardId: existingColumn.boardId,
          order: { gt: oldOrder, lte: adjustedOrder },
          id: { not: id },
        },
        data: {
          order: { decrement: 1 },
        },
      });
    } else if (oldOrder > adjustedOrder) {
      // Moving left/up - increment orders of columns between new and old position
      await db.column.updateMany({
        where: {
          boardId: existingColumn.boardId,
          order: { gte: adjustedOrder, lt: oldOrder },
          id: { not: id },
        },
        data: {
          order: { increment: 1 },
        },
      });
    }

    // Update the column's order
    const updatedColumn = await db.column.update({
      where: { id },
      data: { order: adjustedOrder },
      select: {
        id: true,
        title: true,
        order: true,
        boardId: true,
        createdAt: true,
        updatedAt: true,
        board: {
          select: {
            id: true,
            title: true,
            userId: true,
          },
        },
        tasks: {
          where: { archived: false }, // Exclude archived tasks
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            order: true,
            locked: true,
            archived: true,
            priority: true,
            createdAt: true,
            updatedAt: true,
            columnId: true,
          },
          orderBy: { order: "asc" },
          take: 50, // Limit tasks per column for 0.5GB RAM constraint
        },
      },
    });

    return NextResponse.json(updatedColumn);
  } catch (error) {
    logError("Error updating column:", error);
    return NextResponse.json(
      { error: "Failed to update column" },
      { status: 500 }
    );
  }
}
