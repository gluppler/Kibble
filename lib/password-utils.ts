/**
 * Password validation and uniqueness utilities for Kibble application.
 * 
 * This module provides functions for validating password strength and
 * ensuring password uniqueness across all users. Password uniqueness is
 * enforced to prevent password reuse, which enhances security by ensuring
 * that if one account is compromised, the password cannot be used on other
 * accounts.
 * 
 * Security Features:
 * - Checks password uniqueness across all users in the database
 * - Uses bcrypt for secure password comparison (handles different salts)
 * - Prevents password reuse across different accounts
 * - Validates password strength (minimum 8 characters)
 * 
 * Performance Considerations:
 * - Password uniqueness check requires comparing against all user hashes
 * - Early exit optimization when match is found
 * - Computationally expensive but necessary for security
 * 
 * @module lib/password-utils
 */

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { logError, logWarn } from "@/lib/logger";

/**
 * Checks if a password is already in use by another user.
 * 
 * Since bcrypt hashes are salted, the same password produces different hashes
 * for different users. To check uniqueness, we must compare the plaintext
 * password against all existing password hashes in the database using bcrypt.compare.
 * 
 * This is a computationally expensive operation but is necessary for security.
 * The function uses early exit optimization to return immediately when a match
 * is found, improving performance in the common case where passwords are unique.
 * 
 * Security Features:
 * - Only checks against users with passwords (excludes OAuth-only users)
 * - Excludes the current user when updating password (prevents false positives)
 * - Uses bcrypt.compare for secure comparison (handles different salts correctly)
 * - Fails open on errors to maintain availability (errors are logged)
 * 
 * Performance:
 * - Early exit when match is found (O(1) best case)
 * - Sequential comparison (O(n) worst case where n is number of users)
 * - Each comparison is expensive (bcrypt is intentionally slow)
 * 
 * @param password - Plaintext password to check for uniqueness
 * @param excludeUserId - Optional user ID to exclude from check (used during password updates)
 * @returns Promise resolving to `true` if password is unique, `false` if already in use
 * 
 * @example
 * ```typescript
 * const isUnique = await isPasswordUnique("newpassword123", currentUserId);
 * if (!isUnique) {
 *   return { error: "Password is already in use by another account" };
 * }
 * ```
 */
export async function isPasswordUnique(
  password: string,
  excludeUserId?: string
): Promise<boolean> {
  try {
    // Get all users with passwords (exclude the current user if provided)
    const users = await db.user.findMany({
      where: {
        password: { not: null },
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: {
        id: true,
        password: true,
      },
    });

    // If no other users exist, password is unique
    if (users.length === 0) {
      return true;
    }

    // Check if the password matches any existing user's password
    // Early exit if match is found to improve performance
    for (const user of users) {
      if (!user.password) continue;
      try {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          // Password is already in use - return immediately
          return false;
        }
      } catch (error) {
        // If comparison fails (e.g., invalid hash), treat as no match and continue
        logWarn(`Error comparing password for user ${user.id}:`, error);
        continue;
      }
    }

    // If we've checked all users and no match was found, password is unique
    return true;
  } catch (error) {
    // On error, allow the password (fail open for availability)
    // Log the error for investigation
    logError("Error checking password uniqueness:", error);
    return true;
  }
}

/**
 * Validates password strength and uniqueness
 * 
 * @param password - Plaintext password to validate
 * @param excludeUserId - Optional user ID to exclude from uniqueness check
 * @returns Object with validation result and error message if invalid
 */
export async function validatePassword(
  password: string,
  excludeUserId?: string
): Promise<{ valid: boolean; error?: string }> {
  // Check minimum length
  if (!password || password.length < 8) {
    return {
      valid: false,
      error: "Password must be at least 8 characters long",
    };
  }

  // Check maximum length
  if (password.length > 200) {
    return {
      valid: false,
      error: "Password is too long (maximum 200 characters)",
    };
  }

  // Check password uniqueness
  const isUnique = await isPasswordUnique(password, excludeUserId);
  if (!isUnique) {
    return {
      valid: false,
      error: "This password is already in use by another account. Please choose a different password.",
    };
  }

  return { valid: true };
}
