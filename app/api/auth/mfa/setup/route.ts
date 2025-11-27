/**
 * MFA Setup API Route
 * 
 * Generates TOTP secret and QR code for MFA setup.
 * 
 * Security:
 * - Requires authentication
 * - Generates secret server-side only
 * - Returns QR code for user to scan
 * - Returns backup codes (user must save these)
 */

import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/server/auth";
import { checkAuthentication } from "@/lib/permissions";
import { db } from "@/lib/db";
import { generateMFASecret, hashBackupCodes } from "@/lib/mfa-utils";
import { logError } from "@/lib/logger";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * POST /api/auth/mfa/setup
 * 
 * Generates MFA secret and QR code for user
 */
export async function POST() {
  try {
    const session = await getServerAuthSession();

    const authCheck = checkAuthentication(session);
    if (!authCheck.allowed || !session?.user?.id) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.statusCode || 401 }
      );
    }

    // Check if MFA is already enabled
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { mfaEnabled: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.mfaEnabled) {
      return NextResponse.json(
        { error: "MFA is already enabled. Disable it first to set up a new secret." },
        { status: 400 }
      );
    }

    // Generate MFA secret and QR code
    const { secret, qrCode, backupCodes } = await generateMFASecret(user.email || "");

    // Hash backup codes for storage
    const hashedBackupCodes = await hashBackupCodes(backupCodes);

    // Store secret and backup codes (but don't enable MFA yet - user must verify first)
    await db.user.update({
      where: { id: session.user.id },
      data: {
        mfaSecret: secret, // In production, encrypt this
        mfaBackupCodes: hashedBackupCodes,
      },
    });

    // Return QR code and backup codes (user must save backup codes)
    return NextResponse.json({
      secret, // For verification step (in production, don't return this)
      qrCode,
      backupCodes, // User must save these - only shown once
    });
  } catch (error) {
    logError("Error setting up MFA:", error);
    return NextResponse.json(
      { error: "Failed to set up MFA" },
      { status: 500 }
    );
  }
}
