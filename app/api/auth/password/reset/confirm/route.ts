/**
 * MFA-Based Password Reset Confirm API Route
 * 
 * Resets user password using MFA verification (TOTP or recovery code).
 * 
 * Security:
 * - Validates email, TOTP/recovery code, and new password
 * - Prevents password reset if no MFA/recovery codes exist
 * - Revokes all sessions after reset
 * - Preserves MFA settings (MFA remains enabled after password reset)
 * - Requires new password to meet requirements (strength and uniqueness)
 * - Rate limiting should be implemented at infrastructure level
 * 
 * IMPORTANT: MFA is NOT disabled during password reset. Since password reset
 * requires MFA to be enabled, it makes sense to keep MFA enabled after reset.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { logSecurityEvent, getClientIP, getUserAgent } from "@/lib/security-logger";
import { validatePassword } from "@/lib/password-utils";
import { verifyTOTP, verifyBackupCode, removeBackupCode, validateTOTPFormat } from "@/lib/mfa-utils";
import { checkRateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const resetSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().min(1, "Code is required"), // TOTP (6 digits) or recovery code (8 hex chars)
  codeType: z.enum(["totp", "recovery"]).refine(
    (val) => val === "totp" || val === "recovery",
    { message: "Code type must be 'totp' or 'recovery'" }
  ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200, "Password is too long"),
});

/**
 * POST /api/auth/password/reset/confirm
 * 
 * Resets password using MFA verification
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = resetSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { email, code, codeType, password } = validationResult.data;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting by IP address and email
    const clientIP = getClientIP(request.headers) || "unknown";
    const ipRateLimit = checkRateLimit(`password-reset-confirm:${clientIP}`, {
      maxAttempts: 10, // 10 attempts per 15 minutes
      windowMs: 15 * 60 * 1000,
    });

    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { error: ipRateLimit.error || "Too many password reset attempts. Please try again later." },
        { status: 429 }
      );
    }

    // Additional rate limiting by email (stricter)
    const emailRateLimit = checkRateLimit(`password-reset-confirm:${normalizedEmail}`, {
      maxAttempts: 5, // 5 attempts per 15 minutes per email
      windowMs: 15 * 60 * 1000,
    });

    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        { error: emailRateLimit.error || "Too many password reset attempts for this email. Please try again later." },
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
        mfaSecret: true,
        mfaBackupCodes: true,
      },
    });

    // Check if user exists
    if (!user) {
      // Return generic error to prevent email enumeration
      return NextResponse.json(
        { error: "Invalid email, code, or password" },
        { status: 400 }
      );
    }

    // Check if user has MFA or recovery codes
    const hasMFA = user.mfaEnabled && !!user.mfaSecret;
    const hasRecoveryCodes = !!user.mfaBackupCodes && user.mfaBackupCodes.length > 0;

    if (!hasMFA && !hasRecoveryCodes) {
      return NextResponse.json(
        {
          error: "Password cannot be reset because no MFA or recovery codes exist. Please create a new account.",
        },
        { status: 400 }
      );
    }

    // Verify code based on type
    let codeValid = false;
    let updatedBackupCodes: string | null = null;

    if (codeType === "totp") {
      // Verify TOTP code
      if (!hasMFA || !user.mfaSecret) {
        return NextResponse.json(
          { error: "TOTP code cannot be used. MFA is not enabled." },
          { status: 400 }
        );
      }

      // Validate TOTP format
      if (!validateTOTPFormat(code)) {
        return NextResponse.json(
          { error: "Invalid TOTP code format. Must be 6 digits." },
          { status: 400 }
        );
      }

      codeValid = verifyTOTP(code, user.mfaSecret);
    } else if (codeType === "recovery") {
      // Verify recovery code
      if (!hasRecoveryCodes || !user.mfaBackupCodes) {
        return NextResponse.json(
          { error: "Recovery code cannot be used. No recovery codes exist." },
          { status: 400 }
        );
      }

      // Validate recovery code format (8 hex characters, uppercase)
      const normalizedCode = code.toUpperCase().trim();
      if (!/^[0-9A-F]{8}$/.test(normalizedCode)) {
        return NextResponse.json(
          { error: "Invalid recovery code format. Must be 8 hexadecimal characters." },
          { status: 400 }
        );
      }

      codeValid = await verifyBackupCode(normalizedCode, user.mfaBackupCodes);
      
      if (codeValid) {
        // Remove used backup code
        updatedBackupCodes = await removeBackupCode(normalizedCode, user.mfaBackupCodes);
      }
    }

    if (!codeValid) {
      // Log failed attempt
      logSecurityEvent({
        type: "password_reset_failed",
        userId: user.id,
        email: normalizedEmail,
        ipAddress: getClientIP(request.headers),
        userAgent: getUserAgent(request.headers),
        details: {
          reason: "invalid_code",
          codeType,
        },
        timestamp: new Date(),
      });

      return NextResponse.json(
        { error: "Invalid code. Please try again." },
        { status: 400 }
      );
    }

    // Validate password (strength and uniqueness)
    // Exclude the current user from uniqueness check
    const passwordValidation = await validatePassword(password, user.id);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error || "Invalid password" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password, update backup codes, and delete all sessions
    // IMPORTANT: MFA remains enabled after password reset since password reset requires MFA
    // This ensures users don't lose their MFA protection after resetting their password
    await db.$transaction(async (tx) => {
      // Update password and backup codes (keep MFA enabled)
      const updateData: {
        password: string;
        mfaBackupCodes: string | null;
      } = {
        password: hashedPassword,
        // Update backup codes if recovery code was used
        mfaBackupCodes: updatedBackupCodes,
      };

      await tx.user.update({
        where: { id: user.id },
        data: updateData,
      });

      // Delete all user sessions (force re-login)
      await tx.session.deleteMany({
        where: { userId: user.id },
      });
    });

    // Log security event
    logSecurityEvent({
      type: "password_reset_completed",
      userId: user.id,
      email: normalizedEmail,
      ipAddress: getClientIP(request.headers),
      userAgent: getUserAgent(request.headers),
      details: {
        codeType,
        mfaWasEnabled: hasMFA,
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. Please sign in with your new password.",
    });
  } catch (error) {
    logError("Error resetting password:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
