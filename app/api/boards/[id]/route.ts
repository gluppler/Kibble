import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";
import { checkBoardPermission } from "@/lib/permissions";
import { logError } from "@/lib/logger";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerAuthSession();
    const { id } = await params;

    // Check board permission using permission utility
    const permissionCheck = await checkBoardPermission(id, session);
    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.statusCode || 403 }
      );
    }

    // Use select to only fetch needed fields
    const board = await db.board.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        columns: {
          select: {
            id: true,
            title: true,
            order: true,
            createdAt: true,
            updatedAt: true,
            tasks: {
              where: {
                archived: false, // Exclude archived tasks from main board view
              },
              select: {
                id: true,
                title: true,
                description: true,
                dueDate: true,
                order: true,
                locked: true,
                priority: true,
                createdAt: true,
                updatedAt: true,
                columnId: true,
              },
              orderBy: { order: "asc" },
              take: 50, // Limit tasks per column for 0.5GB RAM constraint
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json(board);
  } catch (error) {
    logError("Error fetching board:", error);
    return NextResponse.json(
      { error: "Failed to fetch board" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerAuthSession();
    const { id } = await params;
    const body = await request.json();
    const { title } = body;

    // Check board permission using permission utility
    const permissionCheck = await checkBoardPermission(id, session);
    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.statusCode || 403 }
      );
    }

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Use select to only fetch needed fields
    const board = await db.board.update({
      where: { id },
      data: { title: title.trim() },
      select: {
        id: true,
        title: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        columns: {
          select: {
            id: true,
            title: true,
            order: true,
            createdAt: true,
            updatedAt: true,
            tasks: {
              where: {
                archived: false, // Exclude archived tasks from main board view
              },
              select: {
                id: true,
                title: true,
                description: true,
                dueDate: true,
                order: true,
                locked: true,
                priority: true,
                createdAt: true,
                updatedAt: true,
                columnId: true,
              },
              orderBy: { order: "asc" },
              take: 50, // Limit tasks per column for 0.5GB RAM constraint
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(board);
  } catch (error) {
    logError("Error updating board:", error);
    return NextResponse.json(
      { error: "Failed to update board" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerAuthSession();
    const { id } = await params;

    // Check board permission using permission utility
    const permissionCheck = await checkBoardPermission(id, session);
    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.statusCode || 403 }
      );
    }

    // Delete board (cascade will delete columns and tasks)
    await db.board.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("Error deleting board:", error);
    return NextResponse.json(
      { error: "Failed to delete board" },
      { status: 500 }
    );
  }
}
