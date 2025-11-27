import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * API route to archive tasks in "Done" column that are older than 24 hours
 * This should be called periodically (e.g., via cron job or scheduled task)
 * or can be called on-demand by the client
 * 
 * Auto-archive: Tasks in "Done" column are automatically archived after 24 hours
 * Archived tasks are hidden from the main board view but can be restored
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
            archived: false, // Only archive tasks that aren't already archived
          },
        },
      },
    });

    // Collect all task IDs to archive
    const taskIdsToArchive: string[] = [];
    doneColumns.forEach((column) => {
      column.tasks.forEach((task) => {
        taskIdsToArchive.push(task.id);
      });
    });

    // Archive tasks in batch
    if (taskIdsToArchive.length > 0) {
      await db.task.updateMany({
        where: {
          id: {
            in: taskIdsToArchive,
          },
        },
        data: {
          archived: true,
          archivedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      archivedCount: taskIdsToArchive.length,
      message: `Archived ${taskIdsToArchive.length} task(s) that were in Done column for more than 24 hours`,
    });
  } catch (error) {
    console.error("Error archiving tasks:", error);
    return NextResponse.json(
      { error: "Failed to archive tasks" },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check for tasks that will be archived soon
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

    // Find all tasks in "Done" columns that are locked and not archived
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
            archived: false, // Only show non-archived tasks
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

    // Calculate time until archive for each task
    const tasksWithArchiveInfo = doneColumns.flatMap((column) =>
      column.tasks.map((task) => {
        if (!task.movedToDoneAt) return null;
        
        const movedAt = new Date(task.movedToDoneAt);
        const archiveTime = new Date(movedAt.getTime() + 24 * 60 * 60 * 1000);
        const now = new Date();
        const timeUntilArchive = archiveTime.getTime() - now.getTime();
        const hoursUntilArchive = Math.max(0, timeUntilArchive / (1000 * 60 * 60));

        return {
          id: task.id,
          title: task.title,
          movedToDoneAt: task.movedToDoneAt,
          archiveTime: archiveTime.toISOString(),
          hoursUntilArchive: Math.round(hoursUntilArchive * 10) / 10,
          willBeArchivedSoon: hoursUntilArchive <= 1, // Within 1 hour
        };
      }).filter(Boolean)
    );

    return NextResponse.json({
      tasks: tasksWithArchiveInfo,
      count: tasksWithArchiveInfo.length,
    });
  } catch (error) {
    console.error("Error fetching archive info:", error);
    return NextResponse.json(
      { error: "Failed to fetch archive info" },
      { status: 500 }
    );
  }
}
