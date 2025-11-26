import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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
      orderBy: { order: "desc" },
    });

    const order = maxOrderColumn ? maxOrderColumn.order + 1 : 0;

    const column = await db.column.create({
      data: {
        title,
        boardId,
        order,
      },
      include: {
        tasks: true,
      },
    });

    return NextResponse.json(column, { status: 201 });
  } catch (error) {
    console.error("Error creating column:", error);
    return NextResponse.json(
      { error: "Failed to create column" },
      { status: 500 }
    );
  }
}
