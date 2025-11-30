/**
 * MFA Disable API Route
 * 
 * Disables MFA for a user after password confirmation.
 * 
 * Security:
 * - Requires authentication
 * - Requires password confirmation
 * - Clears MFA secret and backup codes
 */

import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/server/auth";
import { checkAuthentication } from "@/lib/permissions";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import { z } from "zod";
import { logSecurityEvent, getClientIP, getUserAgent } from "@/lib/security-logger";
import { logError } from "@/lib/logger";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const disableSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

/**
 * POST /api/auth/mfa/disable
 * 
 * Disables MFA after password confirmation
 */
export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession();

    const authCheck = checkAuthentication(session);
    if (!authCheck.allowed || !session?.user?.id) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.statusCode || 401 }
      );
    }

    const body = await request.json();
    const validationResult = disableSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { password } = validationResult.data;

    // Get user with password
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
        mfaEnabled: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.mfaEnabled) {
      return NextResponse.json(
        { error: "MFA is not enabled" },
        { status: 400 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Disable MFA and clear secrets
    await db.user.update({
      where: { id: session.user.id },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
      },
    });

    // Log security event
    logSecurityEvent({
      type: "mfa_disabled",
      userId: session.user.id,
      email: session.user.email || undefined,
      ipAddress: getClientIP(request.headers),
      userAgent: getUserAgent(request.headers),
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "MFA disabled successfully",
    });
  } catch (error) {
    logError("Error disabling MFA:", error);
    return NextResponse.json(
      { error: "Failed to disable MFA" },
      { status: 500 }
    );
  }
}
