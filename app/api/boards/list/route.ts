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
  try {
    // Get session with error handling
    let session;
    try {
      session = await getServerAuthSession();
    } catch (authError) {
      logError("Error getting auth session:", authError);
      // Security: Generic error message prevents information leakage
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 500 }
      );
    }

    // Check authentication using permission utility
    const authCheck = checkAuthentication(session);
    if (!authCheck.allowed || !session?.user?.id) {
      return NextResponse.json(
        { error: authCheck.error || "Unauthorized" },
        { status: authCheck.statusCode || 401 }
      );
    }

    // Security: Validate user ID format to prevent injection
    const userId = session.user.id;
    if (
      typeof userId !== "string" ||
      userId.length === 0 ||
      userId.length > 255 ||
      /[<>'"&;]/.test(userId) // Basic XSS/injection prevention
    ) {
      logError("Invalid user ID format:", { userId: userId?.substring(0, 10) });
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    // Get all user's non-archived boards with error handling
    let boards;
    try {
      // Security: Prisma automatically sanitizes userId, but we validate it above
      // Security: Only select safe fields (no userId, no sensitive data)
      boards = await db.board.findMany({
        where: {
          userId: userId, // Validated above
          archived: false, // Exclude archived boards from main list
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          // Explicitly exclude sensitive fields
          // userId is excluded by design (security)
        },
        orderBy: { createdAt: "desc" },
        // Security: Add reasonable limit to prevent DoS
        take: 1000, // Maximum 1000 boards per user
      });
    } catch (dbError) {
      logError("Database error fetching boards:", dbError);
      // Security: Generic error message prevents information leakage
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    // Security: Ensure boards is always an array (defensive programming)
    const safeBoards = Array.isArray(boards) ? boards : [];

    // Security: Validate and sanitize board data before returning
    const sanitizedBoards = safeBoards.map((board) => ({
      id: typeof board.id === "string" ? board.id : "",
      title: typeof board.title === "string" ? board.title : "",
      createdAt: board.createdAt instanceof Date ? board.createdAt : new Date(),
      updatedAt: board.updatedAt instanceof Date ? board.updatedAt : new Date(),
    }));

    // Return boards with security headers
    return NextResponse.json(
      { boards: sanitizedBoards },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error) {
    logError("Unexpected error fetching boards:", error);
    // Security: Generic error message prevents information leakage
    return NextResponse.json(
      { error: "Failed to fetch boards" },
      { status: 500 }
    );
  }
}
