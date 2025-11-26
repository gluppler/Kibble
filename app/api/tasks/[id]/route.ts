import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";
import { checkTaskPermission, checkColumnBoardMatch } from "@/lib/permissions";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerAuthSession();
    const { id } = await params;
    const body = await request.json();
    const { title, description, columnId, order, dueDate } = body;

    // Check task permission using permission utility
    const permissionCheck = await checkTaskPermission(id, session);
    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.statusCode || 403 }
      );
    }

    // Get existing task for validation
    const existingTask = await db.task.findUnique({
      where: { id },
      include: {
        column: {
          include: {
            board: true,
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
      locked?: boolean;
      movedToDoneAt?: Date | null;
    } = {};
    
    if (title !== undefined && !existingTask.locked) updateData.title = title;
    if (description !== undefined && !existingTask.locked) updateData.description = description || null;
    if (dueDate !== undefined && !existingTask.locked) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    
    // Handle column and order changes - CRITICAL: Always process column changes first
    const isMovingColumn = columnId !== undefined && columnId !== existingTask.columnId;
    
    // CRITICAL: If columnId is provided and different, we MUST update it
    // Store finalColumnId at function scope so it's available for verification
    let finalColumnId = existingTask.columnId;
    let finalOrder = existingTask.order;
    
    if (columnId !== undefined || order !== undefined) {
      finalColumnId = columnId !== undefined ? columnId : existingTask.columnId;
      finalOrder = order !== undefined ? order : existingTask.order;
      
      // Processing task update
      
      // Get the new column to check its title (always fetch fresh from DB)
      let newColumn = null;
      if (isMovingColumn) {
        newColumn = await db.column.findUnique({ 
          where: { id: columnId },
          include: { board: true }
        });
        
        if (!newColumn) {
          console.error(`[TASK UPDATE] Target column ${columnId} not found`);
          return NextResponse.json(
            { error: "Target column not found" },
            { status: 404 }
          );
        }
        
        // Found target column
      } else {
        newColumn = existingTask.column;
      }
      
      // If moving to a different column - THIS IS CRITICAL FOR PERSISTENCE
      if (isMovingColumn && newColumn) {
        // Auto-lock when moved to "Done" column
        if (newColumn.title === "Done") {
          updateData.locked = true;
          updateData.movedToDoneAt = new Date();
          // Task moved to Done column - locking task
        } else if (existingTask.column.title === "Done") {
          // Unlock if moving away from Done
          updateData.locked = false;
          updateData.movedToDoneAt = null;
          // Task moved away from Done column - unlocking task
        }
        
        // Get all tasks in the new column (excluding the one being moved)
        const newColumnTasks = await db.task.findMany({
          where: { 
            columnId: finalColumnId,
            id: { not: existingTask.id },
          },
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
        
        // CRITICAL: Always update columnId and order when moving columns
        // This MUST be set for persistence to work
        updateData.columnId = finalColumnId;
        updateData.order = adjustedOrder;
      }
      // If reordering within same column (not moving columns)
      else if (!isMovingColumn && order !== undefined && order !== existingTask.order) {
        const allTasks = await db.task.findMany({
          where: { 
            columnId: existingTask.columnId,
            id: { not: existingTask.id },
          },
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

    // CRITICAL: Verify updateData contains columnId if we're moving columns
    if (isMovingColumn && !updateData.columnId) {
      console.error(`[TASK UPDATE] ERROR: Moving column but columnId not set in updateData!`, {
        taskId: id,
        isMovingColumn,
        updateData,
      });
      return NextResponse.json(
        { error: "Internal error: Column update failed" },
        { status: 500 }
      );
    }

    // Only update if there's something to update
    if (Object.keys(updateData).length === 0) {
      // Return existing task if no changes
      return NextResponse.json(existingTask);
    }

    // Perform the update - ensure it's committed
    let task;
    try {
      task = await db.task.update({
        where: { id },
        data: updateData,
        include: {
          column: {
            include: {
              board: true,
            },
          },
        },
      });
      
      // Verify the update was successful by reading it back
      const verifyTask = await db.task.findUnique({
        where: { id },
        select: { id: true, columnId: true, order: true, locked: true },
      });
      
      // Double-check the update persisted
      if (isMovingColumn && verifyTask) {
        if (verifyTask.columnId !== finalColumnId) {
          console.error(`[TASK UPDATE] CRITICAL ERROR: Update did not persist! Expected columnId ${finalColumnId}, got ${verifyTask.columnId}`);
          return NextResponse.json(
            { error: "Update did not persist correctly" },
            { status: 500 }
          );
        }
        // Verification passed: columnId correctly updated
      }
    } catch (updateError) {
      console.error(`[TASK UPDATE] Database update failed:`, updateError);
      throw updateError;
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
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
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
