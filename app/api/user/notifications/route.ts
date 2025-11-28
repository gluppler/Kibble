/**
 * User notification preferences API route.
 * 
 * Handles GET and PATCH requests for user notification preferences.
 * 
 * Security:
 * - Requires authentication
 * - Users can only access their own preferences
 * - Input validation on all fields
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";
import { checkAuthentication } from "@/lib/permissions";
import { logError } from "@/lib/logger";
import { z } from "zod";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Notification preferences update schema.
 * 
 * All fields are optional to allow partial updates.
 */
const notificationPreferencesSchema = z.object({
  notificationsEnabled: z.boolean().optional(),
  dueDateAlertsEnabled: z.boolean().optional(),
  completionAlertsEnabled: z.boolean().optional(),
});

/**
 * GET /api/user/notifications
 * 
 * Returns the current user's notification preferences.
 * 
 * @returns User notification preferences
 */
export async function GET() {
  try {
    const session = await getServerAuthSession();

    // Check authentication
    const authCheck = checkAuthentication(session);
    if (!authCheck.allowed) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.statusCode || 401 }
      );
    }

    // Fetch user with notification preferences
    const user = await db.user.findUnique({
      where: { id: session!.user.id },
      select: {
        notificationsEnabled: true,
        dueDateAlertsEnabled: true,
        completionAlertsEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      notificationsEnabled: user.notificationsEnabled ?? true,
      dueDateAlertsEnabled: user.dueDateAlertsEnabled ?? true,
      completionAlertsEnabled: user.completionAlertsEnabled ?? true,
    });
  } catch (error) {
    logError("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/notifications
 * 
 * Updates the current user's notification preferences.
 * 
 * Request Body:
 * ```json
 * {
 *   "notificationsEnabled": true,
 *   "dueDateAlertsEnabled": true,
 *   "completionAlertsEnabled": true
 * }
 * ```
 * 
 * All fields are optional - only provided fields will be updated.
 * 
 * @returns Updated notification preferences
 */
export async function PATCH(request: Request) {
  try {
    const session = await getServerAuthSession();

    // Check authentication
    const authCheck = checkAuthentication(session);
    if (!authCheck.allowed) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.statusCode || 401 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = notificationPreferencesSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const updateData: {
      notificationsEnabled?: boolean;
      dueDateAlertsEnabled?: boolean;
      completionAlertsEnabled?: boolean;
    } = {};

    // Only include fields that were provided
    if (validationResult.data.notificationsEnabled !== undefined) {
      updateData.notificationsEnabled = validationResult.data.notificationsEnabled;
    }
    if (validationResult.data.dueDateAlertsEnabled !== undefined) {
      updateData.dueDateAlertsEnabled = validationResult.data.dueDateAlertsEnabled;
    }
    if (validationResult.data.completionAlertsEnabled !== undefined) {
      updateData.completionAlertsEnabled = validationResult.data.completionAlertsEnabled;
    }

    // If no fields to update, return current preferences
    if (Object.keys(updateData).length === 0) {
      const user = await db.user.findUnique({
        where: { id: session!.user.id },
        select: {
          notificationsEnabled: true,
          dueDateAlertsEnabled: true,
          completionAlertsEnabled: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        notificationsEnabled: user.notificationsEnabled ?? true,
        dueDateAlertsEnabled: user.dueDateAlertsEnabled ?? true,
        completionAlertsEnabled: user.completionAlertsEnabled ?? true,
      });
    }

    // Update user preferences
    const updatedUser = await db.user.update({
      where: { id: session!.user.id },
      data: updateData,
      select: {
        notificationsEnabled: true,
        dueDateAlertsEnabled: true,
        completionAlertsEnabled: true,
      },
    });

    return NextResponse.json({
      notificationsEnabled: updatedUser.notificationsEnabled ?? true,
      dueDateAlertsEnabled: updatedUser.dueDateAlertsEnabled ?? true,
      completionAlertsEnabled: updatedUser.completionAlertsEnabled ?? true,
    });
  } catch (error) {
    logError("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}
