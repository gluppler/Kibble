/**
 * Archived Tasks API Route
 * 
 * Returns all archived tasks for the authenticated user.
 * 
 * Security:
 * - Requires authentication
 * - Only returns user's own archived tasks
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
 * GET /api/archive/tasks
 * 
 * Returns all archived tasks for the user
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

    // Get all archived tasks for the user (through board ownership)
    const tasks = await db.task.findMany({
      where: {
        archived: true,
        column: {
          board: {
            userId: session.user.id,
          },
        },
      },
      include: {
        column: {
          include: {
            board: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { archivedAt: "desc" },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    logError("Error fetching archived tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch archived tasks" },
      { status: 500 }
    );
  }
}
