/**
 * Password Reset MFA Tests
 * 
 * Tests for MFA-based password reset functionality.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/mfa-utils", () => ({
  verifyTOTP: vi.fn(),
  verifyBackupCode: vi.fn(),
  removeBackupCode: vi.fn(),
  validateTOTPFormat: vi.fn(),
}));

vi.mock("@/lib/password-utils", () => ({
  validatePassword: vi.fn(),
}));

vi.mock("@/lib/security-logger", () => ({
  logSecurityEvent: vi.fn(),
  getClientIP: vi.fn(() => "127.0.0.1"),
  getUserAgent: vi.fn(() => "test-agent"),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

describe("MFA-Based Password Reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Password Reset Request", () => {
    it("should return MFA status for user with MFA enabled", async () => {
      const mockUser = {
        id: "user1",
        email: "test@example.com",
        mfaEnabled: true,
        mfaBackupCodes: "hashed1,hashed2",
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);

      const response = await fetch("http://localhost:3000/api/auth/password/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com" }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.hasMFA).toBe(true);
      expect(data.hasRecoveryCodes).toBe(true);
      expect(data.canReset).toBe(true);
    });

    it("should return false for user without MFA or recovery codes", async () => {
      const mockUser = {
        id: "user1",
        email: "test@example.com",
        mfaEnabled: false,
        mfaBackupCodes: null,
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);

      const response = await fetch("http://localhost:3000/api/auth/password/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com" }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.hasMFA).toBe(false);
      expect(data.hasRecoveryCodes).toBe(false);
      expect(data.canReset).toBe(false);
    });

    it("should return generic success even if user doesn't exist", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      const response = await fetch("http://localhost:3000/api/auth/password/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "nonexistent@example.com" }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.canReset).toBe(false);
    });
  });

  describe("Password Reset Confirm", () => {
    it("should reject reset if no MFA or recovery codes exist", async () => {
      const mockUser = {
        id: "user1",
        email: "test@example.com",
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);

      const response = await fetch("http://localhost:3000/api/auth/password/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          code: "123456",
          codeType: "totp",
          password: "newpassword123",
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toContain("no MFA or recovery codes exist");
    });

    it("should verify TOTP code and reset password", async () => {
      const { verifyTOTP } = await import("@/lib/mfa-utils");
      const { validatePassword } = await import("@/lib/password-utils");

      const mockUser = {
        id: "user1",
        email: "test@example.com",
        mfaEnabled: true,
        mfaSecret: "secret123",
        mfaBackupCodes: "hashed1,hashed2",
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(verifyTOTP).mockReturnValue(true);
      vi.mocked(validatePassword).mockResolvedValue({ valid: true });
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed_password" as never);
      vi.mocked(db.$transaction).mockImplementation(async (callback) => {
        return await callback({
          user: {
            update: vi.fn().mockResolvedValue({}),
          },
          session: {
            deleteMany: vi.fn().mockResolvedValue({}),
          },
        } as any);
      });

      const response = await fetch("http://localhost:3000/api/auth/password/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          code: "123456",
          codeType: "totp",
          password: "newpassword123",
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(verifyTOTP).toHaveBeenCalledWith("123456", "secret123");
    });

    it("should verify recovery code and reset password", async () => {
      const { verifyBackupCode, removeBackupCode } = await import("@/lib/mfa-utils");
      const { validatePassword } = await import("@/lib/password-utils");

      const mockUser = {
        id: "user1",
        email: "test@example.com",
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: "hashed1,hashed2",
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(verifyBackupCode).mockResolvedValue(true);
      vi.mocked(removeBackupCode).mockResolvedValue("hashed2");
      vi.mocked(validatePassword).mockResolvedValue({ valid: true });
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed_password" as never);
      vi.mocked(db.$transaction).mockImplementation(async (callback) => {
        return await callback({
          user: {
            update: vi.fn().mockResolvedValue({}),
          },
          session: {
            deleteMany: vi.fn().mockResolvedValue({}),
          },
        } as any);
      });

      const response = await fetch("http://localhost:3000/api/auth/password/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          code: "ABCD1234",
          codeType: "recovery",
          password: "newpassword123",
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(verifyBackupCode).toHaveBeenCalled();
      expect(removeBackupCode).toHaveBeenCalled();
    });

    it("should reject invalid TOTP code", async () => {
      const { verifyTOTP } = await import("@/lib/mfa-utils");

      const mockUser = {
        id: "user1",
        email: "test@example.com",
        mfaEnabled: true,
        mfaSecret: "secret123",
        mfaBackupCodes: "hashed1,hashed2",
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(verifyTOTP).mockReturnValue(false);

      const response = await fetch("http://localhost:3000/api/auth/password/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          code: "000000",
          codeType: "totp",
          password: "newpassword123",
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toContain("Invalid code");
    });

    it("should reject invalid recovery code", async () => {
      const { verifyBackupCode } = await import("@/lib/mfa-utils");

      const mockUser = {
        id: "user1",
        email: "test@example.com",
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: "hashed1,hashed2",
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(verifyBackupCode).mockResolvedValue(false);

      const response = await fetch("http://localhost:3000/api/auth/password/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          code: "INVALID",
          codeType: "recovery",
          password: "newpassword123",
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toContain("Invalid code");
    });

    it("should validate password strength and uniqueness", async () => {
      const { verifyTOTP } = await import("@/lib/mfa-utils");
      const { validatePassword } = await import("@/lib/password-utils");

      const mockUser = {
        id: "user1",
        email: "test@example.com",
        mfaEnabled: true,
        mfaSecret: "secret123",
        mfaBackupCodes: "hashed1,hashed2",
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(verifyTOTP).mockReturnValue(true);
      vi.mocked(validatePassword).mockResolvedValue({
        valid: false,
        error: "Password is already in use by another user",
      });

      const response = await fetch("http://localhost:3000/api/auth/password/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          code: "123456",
          codeType: "totp",
          password: "existingpassword",
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toContain("already in use");
    });
  });
});
