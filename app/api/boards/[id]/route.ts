import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";
import { checkBoardPermission } from "@/lib/permissions";
import { logError, logApiTiming } from "@/lib/logger";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  let id: string | undefined;
  try {
    const session = await getServerAuthSession();
    id = (await params).id;

    // Check board permission using permission utility
    const permissionCheck = await checkBoardPermission(id, session);
    if (!permissionCheck.allowed) {
      const duration = Date.now() - startTime;
      logApiTiming(`/api/boards/${id}`, "GET", duration, permissionCheck.statusCode || 403);
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
      const duration = Date.now() - startTime;
      logApiTiming(`/api/boards/${id}`, "GET", duration, 404);
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const duration = Date.now() - startTime;
    logApiTiming(`/api/boards/${id}`, "GET", duration, 200);
    return NextResponse.json(board);
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiTiming(`/api/boards/${id || "unknown"}`, "GET", duration, 500);
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
  const startTime = Date.now();
  let id: string | undefined;
  try {
    const session = await getServerAuthSession();
    id = (await params).id;
    const body = await request.json();
    const { title } = body;

    // Check board permission using permission utility
    const permissionCheck = await checkBoardPermission(id, session);
    if (!permissionCheck.allowed) {
      const duration = Date.now() - startTime;
      logApiTiming(`/api/boards/${id}`, "PATCH", duration, permissionCheck.statusCode || 403);
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.statusCode || 403 }
      );
    }

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      const duration = Date.now() - startTime;
      logApiTiming(`/api/boards/${id}`, "PATCH", duration, 400);
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

    const duration = Date.now() - startTime;
    logApiTiming(`/api/boards/${id}`, "PATCH", duration, 200);
    return NextResponse.json(board);
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiTiming(`/api/boards/${id || "unknown"}`, "PATCH", duration, 500);
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
  const startTime = Date.now();
  let id: string | undefined;
  try {
    const session = await getServerAuthSession();
    id = (await params).id;

    // Check board permission using permission utility
    const permissionCheck = await checkBoardPermission(id, session);
    if (!permissionCheck.allowed) {
      const duration = Date.now() - startTime;
      logApiTiming(`/api/boards/${id}`, "DELETE", duration, permissionCheck.statusCode || 403);
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.statusCode || 403 }
      );
    }

    // Delete board (cascade will delete columns and tasks)
    await db.board.delete({
      where: { id },
    });

    const duration = Date.now() - startTime;
    logApiTiming(`/api/boards/${id}`, "DELETE", duration, 200);
    return NextResponse.json({ success: true });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiTiming(`/api/boards/${id || "unknown"}`, "DELETE", duration, 500);
    logError("Error deleting board:", error);
    return NextResponse.json(
      { error: "Failed to delete board" },
      { status: 500 }
    );
  }
}
