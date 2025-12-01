/**
 * Board Reorder API Route
 * 
 * Handles reordering of boards via drag-and-drop.
 * 
 * Security:
 * - Requires authentication
 * - Validates all board IDs belong to the authenticated user
 * - Uses transaction to ensure atomic updates
 * - Prevents IDOR (Insecure Direct Object Reference) attacks
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";
import { checkAuthentication } from "@/lib/permissions";
import { logError, logApiTiming } from "@/lib/logger";
import { z } from "zod";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Schema for board reorder request
 */
const reorderSchema = z.object({
  boardIds: z.array(z.string().min(1)).min(1), // Array of board IDs in new order
});

/**
 * POST /api/boards/reorder
 * 
 * Updates board positions based on the provided order.
 * 
 * Request Body:
 * ```json
 * {
 *   "boardIds": ["board-id-1", "board-id-2", "board-id-3"]
 * }
 * ```
 * 
 * Security:
 * - Validates all board IDs belong to authenticated user
 * - Uses transaction for atomic updates
 * - Prevents unauthorized access to other users' boards
 * 
 * @returns Success response or error
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    const session = await getServerAuthSession();

    // Check authentication
    const authCheck = checkAuthentication(session);
    if (!authCheck.allowed || !session?.user?.id) {
      const duration = Date.now() - startTime;
      logApiTiming("/api/boards/reorder", "POST", duration, authCheck.statusCode || 401);
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.statusCode || 401 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = reorderSchema.safeParse(body);
    if (!validationResult.success) {
      const duration = Date.now() - startTime;
      logApiTiming("/api/boards/reorder", "POST", duration, 400);
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { boardIds } = validationResult.data;

    // Verify all boards belong to the authenticated user
    const userBoards = await db.board.findMany({
      where: {
        id: { in: boardIds },
        userId: session.user.id,
        archived: false, // Only allow reordering of non-archived boards
      },
      select: {
        id: true,
      },
    });

    // Security check: ensure all provided board IDs belong to the user
    if (userBoards.length !== boardIds.length) {
      const duration = Date.now() - startTime;
      logApiTiming("/api/boards/reorder", "POST", duration, 403);
      return NextResponse.json(
        { error: "Unauthorized: Some boards do not belong to you" },
        { status: 403 }
      );
    }

    // Update board positions in a transaction
    await db.$transaction(
      boardIds.map((boardId, index) =>
        db.board.update({
          where: { id: boardId },
          data: { position: index },
        })
      )
    );

    const duration = Date.now() - startTime;
    logApiTiming("/api/boards/reorder", "POST", duration, 200);
    return NextResponse.json(
      { success: true },
      {
        headers: {
          "Cache-Control": "private, max-age=2, must-revalidate",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiTiming("/api/boards/reorder", "POST", duration, 500);
    logError("Error reordering boards:", error);
    return NextResponse.json(
      { error: "Failed to reorder boards" },
      { status: 500 }
    );
  }
}
