import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and board in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name: name || email.split("@")[0],
          email,
          password: hashedPassword,
        },
      });

      // Create board with default columns
      const board = await tx.board.create({
        data: {
          title: "My Kanban Board",
          userId: user.id,
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
              tasks: true,
            },
            orderBy: { order: "asc" },
          },
        },
      });

      return { user, board };
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
        board: result.board,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering user:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to register user",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
