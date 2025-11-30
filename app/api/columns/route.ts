import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logError } from "@/lib/logger";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { title, boardId } = await request.json();

    if (!title || !boardId) {
      return NextResponse.json(
        { error: "Title and boardId are required" },
        { status: 400 }
      );
    }

    // Get the max order in the board
    const maxOrderColumn = await db.column.findFirst({
      where: { boardId },
      select: { order: true }, // Only select order field
      orderBy: { order: "desc" },
    });

    const order = maxOrderColumn ? maxOrderColumn.order + 1 : 0;

    const column = await db.column.create({
      data: {
        title,
        boardId,
        order,
      },
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
    });

    return NextResponse.json(column, { status: 201 });
  } catch (error) {
    logError("Error creating column:", error);
    return NextResponse.json(
      { error: "Failed to create column" },
      { status: 500 }
    );
  }
}
