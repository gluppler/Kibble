/**
 * MFA Status API Route
 * 
 * Returns the current MFA status for the authenticated user.
 * 
 * Security:
 * - Requires authentication
 * - Returns only MFA status (not sensitive data)
 */

import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/server/auth";
import { checkAuthentication } from "@/lib/permissions";
import { db } from "@/lib/db";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/auth/mfa/status
 * 
 * Returns MFA status for the authenticated user
 */
export async function GET() {
  try {
    const session = await getServerAuthSession();

    const authCheck = checkAuthentication(session);
    if (!authCheck.allowed || !session?.user?.id) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.statusCode || 401 }
      );
    }

    // Get user's MFA status
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { mfaEnabled: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      mfaEnabled: user.mfaEnabled || false,
    });
  } catch (error) {
    console.error("Error fetching MFA status:", error);
    return NextResponse.json(
      { error: "Failed to fetch MFA status" },
      { status: 500 }
    );
  }
}
