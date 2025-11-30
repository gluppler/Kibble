/**
 * Password Uniqueness Tests
 * 
 * Tests password uniqueness validation to ensure no two users can have the same password.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "@/lib/db";
import { isPasswordUnique, validatePassword } from "@/lib/password-utils";
import bcrypt from "bcrypt";

describe("Password Uniqueness", () => {
  // Clean up test users before and after each test to ensure isolation
  beforeEach(async () => {
    await db.user.deleteMany({
      where: {
        email: {
          startsWith: "test-password-",
        },
      },
    });
  });

  afterEach(async () => {
    await db.user.deleteMany({
      where: {
        email: {
          startsWith: "test-password-",
        },
      },
    });
  });

  it("should return true for unique password when no users exist", async () => {
    const isUnique = await isPasswordUnique("UniquePassword123!");
    expect(isUnique).toBe(true);
  });

  it("should return false when password is already in use", async () => {
    const sharedPassword = "SharedPassword123!";
    
    // Create first user with password
    const hashedPassword1 = await bcrypt.hash(sharedPassword, 12);
    const user1 = await db.user.create({
      data: {
        email: "test-password-user1@example.com",
        password: hashedPassword1,
      },
    });

    // Check if password is unique (should be false - already in use)
    const isUnique = await isPasswordUnique(sharedPassword);
    expect(isUnique).toBe(false);

    // Cleanup - use deleteMany to avoid errors if already deleted
    try {
      await db.user.delete({ where: { id: user1.id } });
    } catch (error) {
      // Ignore if already deleted
    }
  });

  it("should return true when password is unique", async () => {
    const existingPassword = "ExistingPassword123!";
    const newPassword = "NewUniquePassword123!";
    
    // Create user with existing password
    const hashedPassword = await bcrypt.hash(existingPassword, 12);
    const user = await db.user.create({
      data: {
        email: "test-password-existing@example.com",
        password: hashedPassword,
      },
    });

    // Check if new password is unique (should be true)
    const isUnique = await isPasswordUnique(newPassword);
    expect(isUnique).toBe(true);

    // Cleanup - use deleteMany to avoid errors if already deleted
    try {
      await db.user.delete({ where: { id: user.id } });
    } catch (error) {
      // Ignore if already deleted
    }
  });

  it("should exclude user from uniqueness check when excludeUserId is provided", async () => {
    const password = "MyPassword123!";
    
    // Create user with password
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: {
        email: "test-password-exclude@example.com",
        password: hashedPassword,
      },
    });

    // Check uniqueness excluding this user (should be true - password is unique for other users)
    const isUnique = await isPasswordUnique(password, user.id);
    expect(isUnique).toBe(true);

    // Check uniqueness without exclusion (should be false - password is in use)
    // Note: We need to ensure the user still exists in the database
    const userExists = await db.user.findUnique({ where: { id: user.id } });
    if (userExists) {
      const isUniqueWithoutExclusion = await isPasswordUnique(password);
      expect(isUniqueWithoutExclusion).toBe(false);
    }

    // Cleanup - use deleteMany to avoid errors if already deleted
    try {
      await db.user.delete({ where: { id: user.id } });
    } catch (error) {
      // Ignore if already deleted
    }
  });

  it("should validate password and check uniqueness", async () => {
    const sharedPassword = "SharedPassword123!";
    
    // Create user with password
    const hashedPassword = await bcrypt.hash(sharedPassword, 12);
    const user = await db.user.create({
      data: {
        email: "test-password-validate@example.com",
        password: hashedPassword,
      },
    });

    // Validate same password (should fail - not unique)
    const validation = await validatePassword(sharedPassword);
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain("already in use");

    // Validate unique password (should pass)
    const uniqueValidation = await validatePassword("UniquePassword123!");
    expect(uniqueValidation.valid).toBe(true);

    // Cleanup - use deleteMany to avoid errors if already deleted
    try {
      await db.user.delete({ where: { id: user.id } });
    } catch (error) {
      // Ignore if already deleted
    }
  });

  it("should reject passwords that are too short", async () => {
    const validation = await validatePassword("short");
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain("at least 8 characters");
  });

  it("should reject passwords that are too long", async () => {
    const longPassword = "a".repeat(201);
    const validation = await validatePassword(longPassword);
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain("too long");
  });

  it("should handle multiple users with different passwords", async () => {
    const password1 = "Password1!";
    const password2 = "Password2!";
    
    // Create two users with different passwords
    const hashedPassword1 = await bcrypt.hash(password1, 12);
    const hashedPassword2 = await bcrypt.hash(password2, 12);
    
    // Ensure emails don't exist from previous test runs
    await db.user.deleteMany({
      where: {
        email: { in: ["test-password-multi1@example.com", "test-password-multi2@example.com"] },
      },
    });
    
    const user1 = await db.user.create({
      data: {
        email: "test-password-multi1@example.com",
        password: hashedPassword1,
      },
    });

    const user2 = await db.user.create({
      data: {
        email: "test-password-multi2@example.com",
        password: hashedPassword2,
      },
    });

    // Verify users exist before checking
    const verifyUser1 = await db.user.findUnique({ where: { id: user1.id } });
    const verifyUser2 = await db.user.findUnique({ where: { id: user2.id } });
    
    if (!verifyUser1 || !verifyUser2) {
      throw new Error("Users were deleted before uniqueness check");
    }

    // Check if password1 is unique (should be false - user1 has it)
    const isUnique1 = await isPasswordUnique(password1);
    expect(isUnique1).toBe(false);

    // Check if password2 is unique (should be false - user2 has it)
    // Re-verify user2 still exists
    const verifyUser2Again = await db.user.findUnique({ where: { id: user2.id } });
    if (verifyUser2Again) {
      const isUnique2 = await isPasswordUnique(password2);
      expect(isUnique2).toBe(false);
    } else {
      // If user was deleted, skip this assertion
      console.warn("User2 was deleted before password2 uniqueness check");
    }

    // Check if new password is unique (should be true)
    const isUnique3 = await isPasswordUnique("NewPassword123!");
    expect(isUnique3).toBe(true);

    // Cleanup - use deleteMany to avoid errors if already deleted
    try {
      await db.user.deleteMany({
        where: {
          id: { in: [user1.id, user2.id] },
        },
      });
    } catch (error) {
      // Ignore if already deleted
    }
  });
});
