/**
 * MFA-Based Password Reset Request API Route
 * 
 * Checks if user has MFA enabled and returns MFA status.
 * This is the first step in the MFA-based password reset flow.
 * 
 * Security:
 * - Returns generic success even if email not found (prevents email enumeration)
 * - Returns MFA status if user exists
 * - Rate limiting should be implemented at infrastructure level
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { logSecurityEvent, getClientIP, getUserAgent } from "@/lib/security-logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const requestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * POST /api/auth/password/reset/request
 * 
 * Checks user MFA status for password reset
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting by IP address
    const clientIP = getClientIP(request.headers) || "unknown";
    const rateLimitResult = checkRateLimit(`password-reset-request:${clientIP}`, {
      maxAttempts: 5, // 5 attempts per 15 minutes
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error || "Too many password reset requests. Please try again later." },
        { status: 429 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        mfaEnabled: true,
        mfaBackupCodes: true,
      },
    });

    // Always return generic success to prevent email enumeration
    // But include MFA status if user exists
    if (user) {
      // Check if user has MFA or recovery codes
      const hasMFA = user.mfaEnabled;
      const hasRecoveryCodes = !!user.mfaBackupCodes && user.mfaBackupCodes.length > 0;

      // Log security event
      logSecurityEvent({
        type: "password_reset_requested",
        userId: user.id,
        email: normalizedEmail,
        ipAddress: getClientIP(request.headers),
        userAgent: getUserAgent(request.headers),
        details: {
          hasMFA,
          hasRecoveryCodes,
        },
        timestamp: new Date(),
      });

      // Return MFA status
      return NextResponse.json({
        success: true,
        hasMFA,
        hasRecoveryCodes,
        canReset: hasMFA || hasRecoveryCodes,
        message: "If an account with that email exists, you can proceed with password reset.",
      });
    }

    // User doesn't exist - return generic success
    return NextResponse.json({
      success: true,
      hasMFA: false,
      hasRecoveryCodes: false,
      canReset: false,
      message: "If an account with that email exists, you can proceed with password reset.",
    });
  } catch (error) {
    logError("Error checking password reset status:", error);
    // Still return generic success to prevent information leakage
    return NextResponse.json({
      success: true,
      hasMFA: false,
      hasRecoveryCodes: false,
      canReset: false,
      message: "If an account with that email exists, you can proceed with password reset.",
    });
  }
}
