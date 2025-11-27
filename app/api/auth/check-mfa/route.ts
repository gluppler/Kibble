/**
 * Check MFA Status API Route
 * 
 * Checks if a user has MFA enabled after password verification.
 * 
 * Security:
 * - Verifies password before checking MFA status
 * - Returns MFA status without exposing sensitive data
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { logError } from "@/lib/logger";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const checkMfaSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * POST /api/auth/check-mfa
 * 
 * Checks if user has MFA enabled after password verification
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = checkMfaSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        password: true,
        mfaEnabled: true,
      },
    });

    if (!user || !user.password) {
      // Don't reveal if user exists or not (security)
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Password verified, return MFA status
    return NextResponse.json({
      mfaEnabled: user.mfaEnabled || false,
    });
  } catch (error) {
    logError("Error checking MFA status:", error);
    return NextResponse.json(
      { error: "Failed to check MFA status" },
      { status: 500 }
    );
  }
}
