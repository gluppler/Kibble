import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";
import { checkAuthentication, validateIdFormat } from "@/lib/permissions";
import { logError, logApiTiming } from "@/lib/logger";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/boards/list
 * 
 * Returns all non-archived boards for the authenticated user.
 * 
 * Security:
 * - Requires authentication
 * - Validates user ID format
 * - Filters by authenticated user only (prevents IDOR)
 * - Returns only safe fields (no sensitive data)
 * - Generic error messages (no information leakage)
 * 
 * @returns {Promise<NextResponse>} JSON response with boards array
 */
export async function GET() {
  const startTime = Date.now();
  try {
    let session;
    try {
      session = await getServerAuthSession();
    } catch (authError) {
      logError("Error getting auth session:", authError);
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 500 }
      );
    }

    const authCheck = checkAuthentication(session);
    if (!authCheck.allowed || !session?.user?.id) {
      return NextResponse.json(
        { error: authCheck.error || "Unauthorized" },
        { status: authCheck.statusCode || 401 }
      );
    }

    // Validate user ID format (prevents injection attacks)
    const userId = session.user.id;
    if (!validateIdFormat(userId, "userId")) {
      logError("Invalid user ID format:", { userId: userId?.substring(0, 10) });
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    // Get user's non-archived boards
    let boards;
    try {
      // Prisma automatically sanitizes userId (validated above)
      // Only select safe fields to reduce data transfer
      boards = await db.board.findMany({
        where: {
          userId: userId, // Validated above
          archived: false, // Exclude archived boards from main list
        },
        select: {
          id: true,
          title: true,
          position: true,
          createdAt: true,
          updatedAt: true,
          // Explicitly exclude sensitive fields (userId excluded by design)
        },
        orderBy: [
          { position: "asc" },
          { createdAt: "asc" }, // Fallback for boards with same position
        ],
        take: 50, // Limit for 0.5GB RAM constraint
      });
    } catch (dbError) {
      logError("Database error fetching boards:", dbError);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    // Validate and sanitize board data
    const safeBoards = Array.isArray(boards) ? boards : [];
    const sanitizedBoards = safeBoards.map((board) => ({
      id: typeof board.id === "string" ? board.id : "",
      title: typeof board.title === "string" ? board.title : "",
      position: typeof board.position === "number" ? board.position : 0,
      createdAt: board.createdAt instanceof Date ? board.createdAt : new Date(),
      updatedAt: board.updatedAt instanceof Date ? board.updatedAt : new Date(),
    }));

    const duration = Date.now() - startTime;
    logApiTiming("/api/boards/list", "GET", duration, 200);
    // Return boards with security headers and 5 second cache
    return NextResponse.json(
      { boards: sanitizedBoards },
      {
        headers: {
          "Cache-Control": "private, max-age=5, must-revalidate",
          "X-Content-Type-Options": "nosniff",
          "ETag": `"${sanitizedBoards.length}-${Math.floor(Date.now() / 5000)}"`,
        },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiTiming("/api/boards/list", "GET", duration, 500);
    logError("Unexpected error fetching boards:", error);
    return NextResponse.json(
      { error: "Failed to fetch boards" },
      { status: 500 }
    );
  }
}
