/**
 * MFA Login Verification API Route
 * 
 * Verifies MFA code during login after password verification.
 * 
 * Security:
 * - Validates TOTP code or backup code
 * - Returns session token on success
 * - Used as part of two-step login flow
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyTOTP, verifyBackupCode, removeBackupCode, validateTOTPFormat } from "@/lib/mfa-utils";
import { z } from "zod";
import { logError } from "@/lib/logger";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const loginMFASchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().min(1, "Code is required"),
});

/**
 * POST /api/auth/mfa/login
 * 
 * Verifies MFA code during login
 * This is called after password verification when MFA is enabled
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = loginMFASchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { email, code } = validationResult.data;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

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

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.mfaEnabled) {
      return NextResponse.json(
        { error: "MFA is not enabled for this account" },
        { status: 400 }
      );
    }

    if (!user.mfaSecret) {
      return NextResponse.json(
        { error: "MFA secret not found" },
        { status: 400 }
      );
    }

    // Try TOTP verification first
    let isValid = false;
    let isBackupCode = false;

    if (validateTOTPFormat(code)) {
      // Verify as TOTP code
      isValid = verifyTOTP(code, user.mfaSecret);
    } else {
      // Try as backup code
      if (user.mfaBackupCodes) {
        isValid = await verifyBackupCode(code, user.mfaBackupCodes);
        if (isValid) {
          isBackupCode = true;
          // Remove used backup code
          const updatedCodes = await removeBackupCode(code, user.mfaBackupCodes);
          await db.user.update({
            where: { id: user.id },
            data: { mfaBackupCodes: updatedCodes || null },
          });
        }
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid MFA code" },
        { status: 401 }
      );
    }

    // MFA verified - return success
    // The actual login will be completed by the client calling NextAuth signIn
    // This endpoint only verifies the MFA code
    return NextResponse.json({
      success: true,
      message: "MFA verified successfully",
      backupCodeUsed: isBackupCode,
    });
  } catch (error) {
    logError("Error verifying MFA for login:", error);
    return NextResponse.json(
      { error: "Failed to verify MFA code" },
      { status: 500 }
    );
  }
}
