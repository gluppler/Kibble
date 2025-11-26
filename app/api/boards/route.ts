import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";
import { checkAuthentication } from "@/lib/permissions";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession();

    // Check authentication using permission utility
    const authCheck = checkAuthentication(session);
    if (!authCheck.allowed || !session?.user?.id) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.statusCode || 401 }
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

    const board = await db.board.create({
      data: {
        title: trimmedTitle,
        userId: session.user.id,
        columns: {
          create: [
            { title: "To-Do", order: 0 },
            { title: "In-Progress", order: 1 },
            { title: "Review", order: 2 },
            { title: "Done", order: 3 },
          ],
        },
      },
      include: {
        columns: {
          include: {
            tasks: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    // Return board in the same format as /api/boards/list for consistency
    const responseBoard = {
      id: board.id,
      title: board.title,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };

    return NextResponse.json(responseBoard, { status: 201 });
  } catch (error) {
    console.error("Error creating board:", error);
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
