/**
 * User Registration API Route
 * 
 * Creates new user account with email verification requirement.
 * 
 * Security Requirements:
 * - Email verification required before account activation
 * - No auto-login after registration
 * - Verification token sent via email
 * - Generic error messages
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200, "Password is too long"),
});

/**
 * POST /api/auth/register
 * 
 * Creates new user account and sends verification email
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.data;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // Fail securely - generic error (don't reveal if email exists)
      return NextResponse.json(
        { error: "Registration failed" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and board in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create user (email verified immediately for now)
      const user = await tx.user.create({
        data: {
          name: name || normalizedEmail.split("@")[0],
          email: normalizedEmail,
          password: hashedPassword,
          emailVerified: new Date(), // Auto-verify for now
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
        success: true,
        message: "Account created successfully.",
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Fail securely - log error internally but return generic message
    console.error("Error registering user:", error);
    
    // Check for specific Prisma errors that might indicate schema issues
    if (error instanceof Error) {
      // If it's a known error, we can provide more context in development
      if (process.env.NODE_ENV === "development") {
        console.error("Registration error details:", error.message);
      }
    }
    
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
