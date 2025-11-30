import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";
import { checkTaskPermission, checkColumnBoardMatch } from "@/lib/permissions";
import { logError, logApiTiming } from "@/lib/logger";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

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
    const { title, description, columnId, order, dueDate, priority } = body;

    // Check task permission using permission utility
    const permissionCheck = await checkTaskPermission(id, session);
    if (!permissionCheck.allowed) {
      const duration = Date.now() - startTime;
      logApiTiming(`/api/tasks/${id}`, "PATCH", duration, permissionCheck.statusCode || 403);
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.statusCode || 403 }
      );
    }

    // Get existing task for validation
    const existingTask = await db.task.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        order: true,
        locked: true,
        archived: true,
        priority: true,
        columnId: true,
        column: {
          select: {
            id: true,
            title: true,
            boardId: true,
            board: {
              select: {
                id: true,
                title: true,
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // If columnId is being changed, verify new column belongs to same board
    if (columnId && columnId !== existingTask.columnId) {
      const columnCheck = await checkColumnBoardMatch(
        columnId,
        existingTask.column.boardId,
        session!.user.id
      );
      
      if (!columnCheck.allowed) {
        return NextResponse.json(
          { error: columnCheck.error },
          { status: columnCheck.statusCode || 403 }
        );
      }
    }

    // Prevent editing locked tasks (except moving from Done)
    if (existingTask.locked && title !== undefined) {
      return NextResponse.json(
        { error: "Cannot edit locked tasks. Tasks in 'Done' column are locked." },
        { status: 400 }
      );
    }

    const updateData: {
      title?: string;
      description?: string | null;
      columnId?: string;
      order?: number;
      dueDate?: Date | null;
      priority?: string;
      locked?: boolean;
      archived?: boolean;
      movedToDoneAt?: Date | null;
      archivedAt?: Date | null;
    } = {};
    
    if (title !== undefined && !existingTask.locked) updateData.title = title;
    if (description !== undefined && !existingTask.locked) updateData.description = description || null;
    if (dueDate !== undefined && !existingTask.locked) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    
    // Handle priority update (can be updated even for locked tasks)
    if (priority !== undefined) {
      const validPriorities = ["normal", "high"];
      updateData.priority = validPriorities.includes(priority) ? priority : "normal";
    }
    
    // Handle column and order changes (always process column changes first)
    const isMovingColumn = columnId !== undefined && columnId !== existingTask.columnId;
    
    // Store finalColumnId at function scope for verification
    let finalColumnId = existingTask.columnId;
    let finalOrder = existingTask.order;
    
    if (columnId !== undefined || order !== undefined) {
      finalColumnId = columnId !== undefined ? columnId : existingTask.columnId;
      finalOrder = order !== undefined ? order : existingTask.order;
      
      // Get the new column to check its title (always fetch fresh from DB)
      let newColumn = null;
      if (isMovingColumn) {
        newColumn = await db.column.findUnique({ 
          where: { id: columnId },
          select: {
            id: true,
            title: true,
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
        
        if (!newColumn) {
          logError(`[TASK UPDATE] Target column ${columnId} not found`);
          return NextResponse.json(
            { error: "Target column not found" },
            { status: 404 }
          );
        }
      } else {
        newColumn = existingTask.column;
      }
      
      if (isMovingColumn && newColumn) {
        // Auto-lock when moved to "Done" column
        if (newColumn.title === "Done") {
          updateData.locked = true;
          updateData.movedToDoneAt = new Date();
        } else if (existingTask.column.title === "Done") {
          // Unlock if moving away from Done
          updateData.locked = false;
          updateData.movedToDoneAt = null;
          // Unarchive if task was archived
          if (existingTask.archived) {
            updateData.archived = false;
            updateData.archivedAt = null;
          }
        }
        
        // Get all tasks in the new column (only select order field)
        const newColumnTasks = await db.task.findMany({
          where: { 
            columnId: finalColumnId,
            id: { not: existingTask.id },
            archived: false, // Exclude archived tasks from order calculations
          },
          select: { order: true }, // Only select order field
          orderBy: { order: "asc" },
        });
        
        // Calculate the correct order - ensure it's valid
        let adjustedOrder = finalOrder;
        
        // If order is beyond current tasks, set to end
        if (finalOrder > newColumnTasks.length) {
          adjustedOrder = newColumnTasks.length;
        }
        
        // Ensure order is non-negative
        adjustedOrder = Math.max(0, adjustedOrder);
        
        // Shift orders for tasks at or after the insertion point
        if (adjustedOrder <= newColumnTasks.length) {
          // Shift all tasks at or after the insertion point
          await db.task.updateMany({
            where: {
              columnId: finalColumnId,
              order: { gte: adjustedOrder },
              id: { not: existingTask.id },
            },
            data: {
              order: { increment: 1 },
            },
          });
        }
        
        // Update orders in old column (decrement tasks after the moved task)
        await db.task.updateMany({
          where: {
            columnId: existingTask.columnId,
            order: { gt: existingTask.order },
          },
          data: {
            order: { decrement: 1 },
          },
        });
        
        // Always update columnId and order when moving columns
        updateData.columnId = finalColumnId;
        updateData.order = adjustedOrder;
      }
      // If reordering within same column (not moving columns)
      else if (!isMovingColumn && order !== undefined && order !== existingTask.order) {
        // Only select order field
        const allTasks = await db.task.findMany({
          where: { 
            columnId: existingTask.columnId,
            id: { not: existingTask.id },
            archived: false, // Exclude archived tasks from order calculations
          },
          select: { order: true }, // Only select order field
          orderBy: { order: "asc" },
        });
        
        const oldOrder = existingTask.order;
        let adjustedOrder = Math.max(0, Math.min(finalOrder, allTasks.length));
        
        if (oldOrder < adjustedOrder) {
          // Moving down - decrement orders between old and new
          await db.task.updateMany({
            where: {
              columnId: existingTask.columnId,
              order: { gt: oldOrder, lte: adjustedOrder },
              id: { not: existingTask.id },
            },
            data: {
              order: { decrement: 1 },
            },
          });
        } else if (oldOrder > adjustedOrder) {
          // Moving up - increment orders between new and old
          await db.task.updateMany({
            where: {
              columnId: existingTask.columnId,
              order: { gte: adjustedOrder, lt: oldOrder },
              id: { not: existingTask.id },
            },
            data: {
              order: { increment: 1 },
            },
          });
        }
        
        updateData.order = adjustedOrder;
      }
    }

    // Verify updateData contains columnId if we're moving columns
    if (isMovingColumn && !updateData.columnId) {
      const duration = Date.now() - startTime;
      logApiTiming(`/api/tasks/${id}`, "PATCH", duration, 500);
      logError(`[TASK UPDATE] Moving column but columnId not set in updateData`, {
        taskId: id,
        isMovingColumn,
        updateData,
      });
      return NextResponse.json(
        { error: "Column update failed" },
        { status: 500 }
      );
    }

    // Only update if there's something to update
    if (Object.keys(updateData).length === 0) {
      // Return existing task if no changes
      const duration = Date.now() - startTime;
      logApiTiming(`/api/tasks/${id}`, "PATCH", duration, 200);
      return NextResponse.json(existingTask);
    }

    // Update task
    const task = await db.task.update({
      where: { id },
      data: updateData,
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
        column: {
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
        },
      },
    });
    
    // Verify update persisted if moving columns
    if (isMovingColumn) {
      const verifyTask = await db.task.findUnique({
        where: { id },
        select: { id: true, columnId: true },
      });
      
      if (verifyTask && verifyTask.columnId !== finalColumnId) {
        const duration = Date.now() - startTime;
        logApiTiming(`/api/tasks/${id}`, "PATCH", duration, 500);
        logError(`[TASK UPDATE] Update did not persist: expected ${finalColumnId}, got ${verifyTask.columnId}`);
        return NextResponse.json(
          { error: "Update did not persist correctly" },
          { status: 500 }
        );
      }
    }

    const duration = Date.now() - startTime;
    logApiTiming(`/api/tasks/${id}`, "PATCH", duration, 200);
    return NextResponse.json(task);
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiTiming(`/api/tasks/${id || "unknown"}`, "PATCH", duration, 500);
    logError("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
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

    // Check task permission using permission utility
    const permissionCheck = await checkTaskPermission(id, session);
    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.statusCode || 403 }
      );
    }

    await db.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
