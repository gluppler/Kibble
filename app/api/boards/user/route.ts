import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";
import { logError } from "@/lib/logger";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's first board (using select)
    const board = await db.board.findFirst({
      where: { userId: session.user.id, archived: false }, // Only get non-archived boards
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
            tasks: {
              where: { archived: false }, // Exclude archived tasks
              select: {
                id: true,
                title: true,
                description: true,
                dueDate: true,
                order: true,
                locked: true,
                archived: true,
                priority: true,
                createdAt: true,
                updatedAt: true,
                columnId: true,
              },
              orderBy: { order: "asc" },
              take: 50, // Limit tasks per column for 0.5GB RAM constraint
            },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ board });
  } catch (error) {
    logError("Error fetching user board:", error);
    return NextResponse.json(
      { error: "Failed to fetch board" },
      { status: 500 }
    );
  }
}
