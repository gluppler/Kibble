/**
 * Tasks Alerts API Route
 * 
 * Returns all tasks with due dates for alert checking.
 * Optimized to avoid N+1 queries by fetching all tasks in a single query.
 * 
 * Security:
 * - Requires authentication
 * - Only returns tasks from user's own boards
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";
import { checkAuthentication } from "@/lib/permissions";
import { logError } from "@/lib/logger";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/tasks/alerts
 * 
 * Returns all tasks with due dates for the authenticated user
 */
export async function GET() {
  try {
    const session = await getServerAuthSession();

    const authCheck = checkAuthentication(session);
    if (!authCheck.allowed || !session?.user?.id) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.statusCode || 401 }
      );
    }

    // Fetch all tasks with due dates in a single query
    // This avoids N+1 queries by getting all tasks at once
    const tasks = await db.task.findMany({
      where: {
        column: {
          board: {
            userId: session.user.id,
          },
        },
        dueDate: { not: null },
        locked: false, // Only check non-locked tasks
        archived: false, // Only check non-archived tasks
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        locked: true,
        columnId: true,
        column: {
          select: {
            id: true,
            title: true,
            board: {
              select: {
                id: true,
                userId: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    logError("Error fetching tasks for alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
