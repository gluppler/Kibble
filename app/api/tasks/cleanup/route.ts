import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * API route to clean up tasks in "Done" column that are older than 24 hours
 * This should be called periodically (e.g., via cron job or scheduled task)
 * or can be called on-demand by the client
 */
export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Calculate the cutoff time (24 hours ago)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Find all "Done" columns for this user's boards
    const doneColumns = await db.column.findMany({
      where: {
        title: "Done",
        board: {
          userId: session.user.id,
        },
      },
      include: {
        tasks: {
          where: {
            movedToDoneAt: {
              not: null,
              lte: twentyFourHoursAgo,
            },
            locked: true,
          },
        },
      },
    });

    // Collect all task IDs to delete
    const taskIdsToDelete: string[] = [];
    doneColumns.forEach((column) => {
      column.tasks.forEach((task) => {
        taskIdsToDelete.push(task.id);
      });
    });

    // Delete tasks in batch
    if (taskIdsToDelete.length > 0) {
      await db.task.deleteMany({
        where: {
          id: {
            in: taskIdsToDelete,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      deletedCount: taskIdsToDelete.length,
      message: `Deleted ${taskIdsToDelete.length} task(s) that were in Done column for more than 24 hours`,
    });
  } catch (error) {
    console.error("Error cleaning up tasks:", error);
    return NextResponse.json(
      { error: "Failed to cleanup tasks" },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check for tasks that will be deleted soon
 * Returns tasks that are approaching the 24-hour mark
 */
export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find all tasks in "Done" columns that are locked
    const doneColumns = await db.column.findMany({
      where: {
        title: "Done",
        board: {
          userId: session.user.id,
        },
      },
      include: {
        tasks: {
          where: {
            locked: true,
            movedToDoneAt: {
              not: null,
            },
          },
          orderBy: {
            movedToDoneAt: "asc",
          },
        },
      },
    });

    // Calculate time until deletion for each task
    const tasksWithDeletionInfo = doneColumns.flatMap((column) =>
      column.tasks.map((task) => {
        if (!task.movedToDoneAt) return null;
        
        const movedAt = new Date(task.movedToDoneAt);
        const deletionTime = new Date(movedAt.getTime() + 24 * 60 * 60 * 1000);
        const now = new Date();
        const timeUntilDeletion = deletionTime.getTime() - now.getTime();
        const hoursUntilDeletion = Math.max(0, timeUntilDeletion / (1000 * 60 * 60));

        return {
          id: task.id,
          title: task.title,
          movedToDoneAt: task.movedToDoneAt,
          deletionTime: deletionTime.toISOString(),
          hoursUntilDeletion: Math.round(hoursUntilDeletion * 10) / 10,
          willBeDeletedSoon: hoursUntilDeletion <= 1, // Within 1 hour
        };
      }).filter(Boolean)
    );

    return NextResponse.json({
      tasks: tasksWithDeletionInfo,
      count: tasksWithDeletionInfo.length,
    });
  } catch (error) {
    console.error("Error fetching cleanup info:", error);
    return NextResponse.json(
      { error: "Failed to fetch cleanup info" },
      { status: 500 }
    );
  }
}
