import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";
import { checkAuthentication, checkColumnOwnership } from "@/lib/permissions";
import { logError } from "@/lib/logger";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession();
    const { title, description, columnId, dueDate, priority } = await request.json();

    // Check authentication
    const authCheck = checkAuthentication(session);
    if (!authCheck.allowed) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.statusCode || 401 }
      );
    }

    // Validate required fields
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (!columnId || typeof columnId !== "string") {
      return NextResponse.json(
        { error: "ColumnId is required and must be a valid string" },
        { status: 400 }
      );
    }

    // Validate columnId format
    if (typeof columnId !== "string" || columnId.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid column ID" },
        { status: 400 }
      );
    }

    // Check column ownership using permission utility
    let columnCheck;
    try {
      columnCheck = await checkColumnOwnership(columnId, session!.user.id);
    } catch (checkError) {
      logError("Error in checkColumnOwnership:", checkError);
      return NextResponse.json(
        { error: "Failed to verify column ownership" },
        { status: 500 }
      );
    }

    if (!columnCheck.allowed) {
      logError("Column ownership check failed:", {
        columnId,
        userId: session!.user.id,
        error: columnCheck.error,
        statusCode: columnCheck.statusCode,
      });
      return NextResponse.json(
        { error: columnCheck.error || "Failed to verify column ownership" },
        { status: columnCheck.statusCode || 403 }
      );
    }

    // Get column details for validation
    let column;
    try {
      column = await db.column.findUnique({
        where: { id: columnId },
        include: {
          board: {
            select: {
              id: true,
              userId: true,
              title: true,
            },
          },
        },
      });
    } catch (dbError) {
      logError("Database error fetching column:", dbError);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    if (!column) {
      logError("Column not found after ownership check:", { columnId });
      return NextResponse.json(
        { error: "Column not found" },
        { status: 404 }
      );
    }

    // Verify board relationship exists
    if (!column.board) {
      logError("Column missing board relationship:", { columnId });
      return NextResponse.json(
        { error: "Column board not found" },
        { status: 404 }
      );
    }

    // Restrict task creation to "To-Do" column only
    if (column.title !== "To-Do") {
      return NextResponse.json(
        { error: "Tasks can only be created in the 'To-Do' column" },
        { status: 400 }
      );
    }

    // Get the max order in the column
    const maxOrderTask = await db.task.findFirst({
      where: { columnId },
      orderBy: { order: "desc" },
    });

    const order = maxOrderTask ? maxOrderTask.order + 1 : 0;
    
    // Ensure order is always a valid number
    const finalOrder = Math.max(0, order);

    // Validate priority if provided
    const validPriorities = ["normal", "high"];
    const taskPriority = priority && validPriorities.includes(priority) ? priority : "normal";

    // Prepare task data
    const taskData = {
      title: title.trim(),
      columnId,
      order: finalOrder,
      locked: false,
      archived: false,
      movedToDoneAt: null as Date | null,
      archivedAt: null as Date | null,
      priority: taskPriority,
      description: null as string | null,
      dueDate: null as Date | null,
    };

    // Handle description - convert empty string or undefined to null
    const trimmedDescription = description && typeof description === "string" ? description.trim() : "";
    taskData.description = trimmedDescription.length > 0 ? trimmedDescription : null;

    // Handle dueDate - convert to Date or null
    if (dueDate) {
      const parsedDate = new Date(dueDate);
      taskData.dueDate = isNaN(parsedDate.getTime()) ? null : parsedDate;
    }

    const task = await db.task.create({
      data: taskData,
      include: {
        column: {
          include: {
            board: true,
          },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    logError("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
