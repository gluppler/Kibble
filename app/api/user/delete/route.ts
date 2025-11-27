// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Account Deletion API Route
 * 
 * Implements secure account deletion following SECURITY-LAWS.md principles:
 * - Re-authentication required (password verification)
 * - Server-side authorization only
 * - Strict input validation
 * - Fail securely with generic error messages
 * - Proper cascade deletion of all user data
 * 
 * Security Requirements:
 * - User must provide current password for re-authentication
 * - Only authenticated users can delete their own account
 * - All user data is permanently deleted (cascade)
 * - Session is invalidated after deletion
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";
import { checkAuthentication } from "@/lib/permissions";
import { logError } from "@/lib/logger";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { logSecurityEvent, getClientIP, getUserAgent } from "@/lib/security-logger";

/**
 * Request body validation schema
 * 
 * Validates password input with strict rules:
 * - Must be a non-empty string
 * - Maximum length to prevent DoS
 * - Trimmed before validation
 */
const deleteAccountSchema = z.object({
  password: z
    .string()
    .min(1, "Password is required")
    .max(200, "Password is too long")
    .trim(),
  confirmText: z
    .string()
    .refine((val) => val === "DELETE", {
      message: "Confirmation text must be exactly 'DELETE'",
    }),
});

/**
 * DELETE /api/user/delete
 * 
 * Deletes the authenticated user's account after re-authentication.
 * 
 * Security Flow:
 * 1. Verify user is authenticated
 * 2. Validate request body (password + confirmation)
 * 3. Re-authenticate user with provided password
 * 4. Delete all user data (cascade via Prisma)
 * 5. Return success (session will be invalidated client-side)
 * 
 * @param request - HTTP request containing password and confirmation
 * @returns Success response or error
 */
export async function DELETE(request: Request) {
  try {
    // Step 1: Verify authentication (server-side authorization)
    const session = await getServerAuthSession();
    const authCheck = checkAuthentication(session);
    
    if (!authCheck.allowed || !session?.user?.id) {
      // Fail securely - generic error message
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Step 2: Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    // Step 3: Strict input validation using Zod
    const validationResult = deleteAccountSchema.safeParse(body);
    
    if (!validationResult.success) {
      // Fail securely - don't reveal validation details
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { password, confirmText } = validationResult.data;

    // Step 4: Verify confirmation text (already validated by Zod, but double-check for security)
    // This prevents accidental deletions and ensures user intent
    if (confirmText !== "DELETE") {
      return NextResponse.json(
        { error: "Invalid confirmation" },
        { status: 400 }
      );
    }

    // Step 5: Re-authenticate user (verify password)
    // This is critical for sensitive actions per SECURITY-LAWS.md
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user || !user.password) {
      // Fail securely - generic error (don't reveal if user exists)
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Fail securely - generic error message
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Step 6: Delete user account (cascade will delete all related data)
    // Prisma will automatically delete:
    // - All boards (cascade)
    // - All columns (cascade from boards)
    // - All tasks (cascade from columns)
    // - All accounts (cascade)
    // - All sessions (cascade)
    await db.user.delete({
      where: { id: userId },
    });

    // Log security event
    logSecurityEvent({
      type: "account_deleted",
      userId: user.id,
      email: user.email,
      ipAddress: getClientIP(request.headers),
      userAgent: getUserAgent(request.headers),
      timestamp: new Date(),
    });

    // Step 7: Return success
    // Note: Session invalidation should be handled client-side
    // by calling signOut() after successful deletion
    return NextResponse.json(
      { 
        success: true,
        message: "Account deleted successfully" 
      },
      { status: 200 }
    );
  } catch (error) {
    // Fail securely - log error internally but return generic message
    logError("Error deleting account:", error);
    
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
