/**
 * Archived Boards API Route
 * 
 * Returns all archived boards for the authenticated user.
 * 
 * Security:
 * - Requires authentication
 * - Only returns user's own archived boards
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
 * GET /api/archive/boards
 * 
 * Returns all archived boards for the user
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

    // Get archived boards for the user (using select with limited results)
    const boards = await db.board.findMany({
      where: {
        userId: session.user.id,
        archived: true,
      },
      select: {
        id: true,
        title: true,
        userId: true,
        archived: true,
        archivedAt: true,
        createdAt: true,
        updatedAt: true,
        columns: {
          select: {
            id: true,
            title: true,
            order: true,
            createdAt: true,
            updatedAt: true,
            tasks: {
              where: {
                archived: true, // Include archived tasks in archived boards
              },
              select: {
                id: true,
                title: true,
                description: true,
                dueDate: true,
                order: true,
                locked: true,
                priority: true,
                archived: true,
                archivedAt: true,
                createdAt: true,
                updatedAt: true,
                columnId: true,
              },
              orderBy: { order: "asc" },
              take: 30, // Limit for 0.5GB RAM constraint
            },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { archivedAt: "desc" },
      take: 25, // Limit for 0.5GB RAM constraint
    });

    return NextResponse.json(
      { boards },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error) {
    logError("Error fetching archived boards:", error);
    return NextResponse.json(
      { error: "Failed to fetch archived boards" },
      { status: 500 }
    );
  }
}
