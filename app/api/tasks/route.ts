import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";
import { checkAuthentication, checkColumnOwnership } from "@/lib/permissions";

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession();
    const { title, description, columnId, dueDate } = await request.json();

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

    // Check column ownership using permission utility
    const columnCheck = await checkColumnOwnership(columnId, session!.user.id);
    if (!columnCheck.allowed) {
      return NextResponse.json(
        { error: columnCheck.error },
        { status: columnCheck.statusCode || 403 }
      );
    }

    // Get column details for validation
    const column = await db.column.findUnique({
      where: { id: columnId },
      include: {
        board: true,
      },
    });

    if (!column) {
      return NextResponse.json(
        { error: "Column not found" },
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

    // Prepare task data - handle undefined/null values properly
    const taskData: {
      title: string;
      description?: string | null;
      dueDate?: Date | null;
      columnId: string;
      order: number;
      locked: boolean;
      movedToDoneAt: null;
    } = {
      title: title.trim(),
      columnId,
      order: finalOrder,
      locked: false,
      movedToDoneAt: null,
    };

    // Handle description - convert empty string or undefined to null
    // Always set description explicitly (either string or null)
    if (description !== undefined && description !== null && typeof description === "string" && description.trim().length > 0) {
      taskData.description = description.trim();
    } else {
      taskData.description = null;
    }

    // Handle dueDate - convert to Date or null
    if (dueDate !== undefined && dueDate !== null && dueDate !== "") {
      try {
        const parsedDate = new Date(dueDate);
        if (!isNaN(parsedDate.getTime())) {
          taskData.dueDate = parsedDate;
        } else {
          taskData.dueDate = null;
        }
      } catch {
        taskData.dueDate = null;
      }
    } else {
      taskData.dueDate = null;
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
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
