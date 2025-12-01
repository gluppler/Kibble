import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";
import { logError, logApiTiming } from "@/lib/logger";

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
  const startTime = Date.now();
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      const duration = Date.now() - startTime;
      logApiTiming("/api/tasks/cleanup", "POST", duration, 401);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Calculate the cutoff time (24 hours ago)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Direct query to find tasks to archive
    const tasksToArchive = await db.task.findMany({
      where: {
        column: {
          title: "Done",
          board: {
            userId: session.user.id,
          },
        },
        movedToDoneAt: {
          not: null,
          lte: twentyFourHoursAgo,
        },
        locked: true,
        archived: false, // Only archive tasks that aren't already archived
      },
      select: {
        id: true, // Only select ID for updateMany
      },
    });

    // Archive tasks in batch
    if (tasksToArchive.length > 0) {
      const taskIds = tasksToArchive.map((task) => task.id);
      await db.task.updateMany({
        where: {
          id: {
            in: taskIds,
          },
        },
        data: {
          archived: true,
          archivedAt: new Date(),
        },
      });
    }

    const duration = Date.now() - startTime;
    logApiTiming("/api/tasks/cleanup", "POST", duration, 200);
    return NextResponse.json({
      success: true,
      archivedCount: tasksToArchive.length,
      message: `Archived ${tasksToArchive.length} task(s) that were in Done column for more than 24 hours`,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiTiming("/api/tasks/cleanup", "POST", duration, 500);
    logError("Error archiving tasks:", error);
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
  const startTime = Date.now();
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      const duration = Date.now() - startTime;
      logApiTiming("/api/tasks/cleanup", "GET", duration, 401);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Direct query to find tasks (limited results)
    const tasks = await db.task.findMany({
      where: {
        column: {
          title: "Done",
          board: {
            userId: session.user.id,
          },
        },
        locked: true,
        archived: false, // Only show non-archived tasks
        movedToDoneAt: {
          not: null,
        },
      },
      select: {
        id: true,
        title: true,
        movedToDoneAt: true,
      },
      orderBy: {
        movedToDoneAt: "asc",
      },
      take: 50, // Limit for 0.5GB RAM constraint
    });

    // Calculate time until archive for each task
    const tasksWithArchiveInfo = tasks
      .map((task) => {
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
      })
      .filter((task): task is NonNullable<typeof task> => task !== null);

    const duration = Date.now() - startTime;
    logApiTiming("/api/tasks/cleanup", "GET", duration, 200);
    return NextResponse.json({
      tasks: tasksWithArchiveInfo,
      count: tasksWithArchiveInfo.length,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiTiming("/api/tasks/cleanup", "GET", duration, 500);
    logError("Error fetching archive info:", error);
    return NextResponse.json(
      { error: "Failed to fetch archive info" },
      { status: 500 }
    );
  }
}
