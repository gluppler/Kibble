import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const board = await db.board.findUnique({
      where: { id },
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

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Strict ownership check: verify board belongs to user
    if (board.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only access your own boards" },
        { status: 403 }
      );
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error("Error fetching board:", error);
    return NextResponse.json(
      { error: "Failed to fetch board" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // First, verify board ownership
    const existingBoard = await db.board.findUnique({
      where: { id },
    });

    if (!existingBoard) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    // Strict ownership check: verify board belongs to user
    if (existingBoard.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only edit your own boards" },
        { status: 403 }
      );
    }

    const board = await db.board.update({
      where: { id },
      data: { title: title.trim() },
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

    return NextResponse.json(board);
  } catch (error) {
    console.error("Error updating board:", error);
    return NextResponse.json(
      { error: "Failed to update board" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify board ownership
    const board = await db.board.findUnique({
      where: { id },
    });

    if (!board) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    // Strict ownership check: verify board belongs to user
    if (board.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own boards" },
        { status: 403 }
      );
    }

    // Delete board (cascade will delete columns and tasks)
    await db.board.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting board:", error);
    return NextResponse.json(
      { error: "Failed to delete board" },
      { status: 500 }
    );
  }
}
