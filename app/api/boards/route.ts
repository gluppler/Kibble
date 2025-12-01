import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";
import { checkAuthentication, checkUserExists } from "@/lib/permissions";
import { logError } from "@/lib/logger";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  let session;
  try {
    session = await getServerAuthSession();

    // Check authentication using permission utility
    const authCheck = checkAuthentication(session);
    if (!authCheck.allowed || !session?.user?.id) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.statusCode || 401 }
      );
    }

    // Verify user exists in database before creating board
    // This prevents foreign key constraint violations
    const userCheck = await checkUserExists(session.user.id);
    if (!userCheck.allowed) {
      return NextResponse.json(
        { error: userCheck.error },
        { status: userCheck.statusCode || 401 }
      );
    }

    const { title } = await request.json();

    // Enhanced validation
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const trimmedTitle = title.trim();

    // Get the maximum position for user's boards to set new board position
    const maxPositionResult = await db.board.findFirst({
      where: {
        userId: session.user.id,
        archived: false,
      },
      select: {
        position: true,
      },
      orderBy: {
        position: "desc",
      },
    });

    const newPosition = maxPositionResult ? maxPositionResult.position + 1 : 0;

    // Don't include tasks since they're empty on creation (using select)
    const board = await db.board.create({
      data: {
        title: trimmedTitle,
        userId: session.user.id,
        position: newPosition,
        columns: {
          create: [
            { title: "To-Do", order: 0 },
            { title: "In-Progress", order: 1 },
            { title: "Review", order: 2 },
            { title: "Done", order: 3 },
          ],
        },
      },
      select: {
        id: true,
        title: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        columns: {
          select: {
            id: true,
            title: true,
            order: true,
            boardId: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });

    // Return board in the same format as /api/boards/list for consistency
    const responseBoard = {
      id: board.id,
      title: board.title,
      position: newPosition,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };

    return NextResponse.json(responseBoard, { status: 201 });
  } catch (error) {
    logError("Error creating board:", error);
    
    // Handle Prisma foreign key constraint violations specifically
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; meta?: { target?: string[] } };
      
      // P2003: Foreign key constraint failed
      if (prismaError.code === "P2003") {
        const constraint = prismaError.meta?.target?.[0] || "foreign key";
        logError("Foreign key constraint violation:", { 
          code: prismaError.code, 
          constraint,
          userId: session?.user?.id?.substring(0, 10) 
        });
        
        // Return 401 to force re-authentication
        return NextResponse.json(
          { 
            error: "Invalid user session. Please sign in again.",
          },
          { status: 401 }
        );
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Failed to create board",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
