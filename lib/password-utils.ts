/**
 * Password Utilities Module
 * 
 * Provides functions for password validation and uniqueness checking.
 * 
 * Security:
 * - Checks password uniqueness across all users
 * - Uses bcrypt for secure password comparison
 * - Prevents password reuse across different accounts
 */

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { logError, logWarn } from "@/lib/logger";

/**
 * Checks if a password is already in use by another user
 * 
 * Since bcrypt hashes are salted, the same password produces different hashes.
 * To check uniqueness, we need to compare the plaintext password against
 * all existing password hashes in the database.
 * 
 * @param password - Plaintext password to check
 * @param excludeUserId - Optional user ID to exclude from check (for password updates)
 * @returns true if password is unique (not in use), false if already in use
 * 
 * Security:
 * - Only checks against users with passwords (excludes OAuth-only users)
 * - Excludes the current user when updating password
 * - Uses bcrypt.compare for secure comparison
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
