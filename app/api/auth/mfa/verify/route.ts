/**
 * MFA Verification API Route
 * 
 * Verifies TOTP code during MFA setup or login.
 * 
 * Security:
 * - Requires authentication for setup verification
 * - Validates TOTP code format
 * - Enables MFA only after successful verification
 */

import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/server/auth";
import { checkAuthentication } from "@/lib/permissions";
import { db } from "@/lib/db";
import { verifyTOTP, validateTOTPFormat } from "@/lib/mfa-utils";
import { z } from "zod";
import { logSecurityEvent, getClientIP, getUserAgent } from "@/lib/security-logger";
import { logError } from "@/lib/logger";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const verifySchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
  setup: z.boolean().optional().default(false), // true for setup, false for login
});

/**
 * POST /api/auth/mfa/verify
 * 
 * Verifies TOTP code and enables MFA (if setup) or completes login (if login)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = verifySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { code, setup } = validationResult.data;

    // Validate code format
    if (!validateTOTPFormat(code)) {
      return NextResponse.json(
        { error: "Invalid code format. Must be 6 digits." },
        { status: 400 }
      );
    }

    if (setup) {
      // MFA setup verification - requires authentication
      const session = await getServerAuthSession();

      const authCheck = checkAuthentication(session);
      if (!authCheck.allowed || !session?.user?.id) {
        return NextResponse.json(
          { error: authCheck.error },
          { status: authCheck.statusCode || 401 }
        );
      }

      // Get user's MFA secret
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { mfaSecret: true, mfaEnabled: true },
      });

      if (!user || !user.mfaSecret) {
        return NextResponse.json(
          { error: "MFA secret not found. Please set up MFA first." },
          { status: 400 }
        );
      }

      if (user.mfaEnabled) {
        return NextResponse.json(
          { error: "MFA is already enabled." },
          { status: 400 }
        );
      }

      // Verify TOTP code
      const isValid = verifyTOTP(code, user.mfaSecret);

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid code. Please try again." },
          { status: 400 }
        );
      }

      // Enable MFA
      await db.user.update({
        where: { id: session.user.id },
        data: {
          mfaEnabled: true,
        },
      });

      // Log security event
      logSecurityEvent({
        type: "mfa_enabled",
        userId: session.user.id,
        email: session.user.email || undefined,
        ipAddress: getClientIP(request.headers),
        userAgent: getUserAgent(request.headers),
        timestamp: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: "MFA enabled successfully",
      });
    } else {
      // Login verification - code should be in request body with user context
      // This would be called after initial password verification
      // For now, return error - login MFA verification needs to be integrated into auth flow
      return NextResponse.json(
        { error: "Login MFA verification must be done through the sign-in flow" },
        { status: 400 }
      );
    }
  } catch (error) {
    logError("Error verifying MFA:", error);
    return NextResponse.json(
      { error: "Failed to verify MFA code" },
      { status: 500 }
    );
  }
}
