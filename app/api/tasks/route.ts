import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { title, description, columnId, dueDate } = await request.json();

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

    // Verify column exists and get its details
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

    // Verify board ownership
    if (column.board.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only create tasks in your own boards" },
        { status: 403 }
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

    console.log(`[TASK CREATE] Creating task with data:`, {
      title: taskData.title,
      description: taskData.description,
      dueDate: taskData.dueDate,
      columnId: taskData.columnId,
      order: taskData.order,
    });

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

    console.log(`[TASK CREATE] Task created successfully:`, {
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      columnId: task.columnId,
      order: task.order,
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
