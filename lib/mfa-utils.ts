/**
 * MFA (Multi-Factor Authentication) Utilities
 * 
 * Provides TOTP-based MFA functionality using otplib.
 * 
 * Security:
 * - TOTP secrets are generated server-side only
 * - Secrets are stored encrypted in database
 * - Backup codes are hashed before storage
 * - Time window tolerance for TOTP verification
 */

import { authenticator } from "otplib";
import { toDataURL } from "qrcode";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Generate a TOTP secret for a user
 * 
 * @param email - User's email (used in QR code label)
 * @returns Object containing secret and QR code data URL
 */
export async function generateMFASecret(email: string): Promise<{
  secret: string;
  qrCode: string;
  backupCodes: string[];
}> {
  // Generate secret (32 bytes, base32 encoded)
  const secret = authenticator.generateSecret();
  
  // Generate service name (from environment or default)
  const serviceName = process.env.MFA_SERVICE_NAME || "Kibble";
  
  // Create OTP Auth URL for QR code
  const otpAuthUrl = authenticator.keyuri(email, serviceName, secret);
  
  // Generate QR code as data URL
  const qrCode = await toDataURL(otpAuthUrl, {
    errorCorrectionLevel: "M",
    type: "image/png",
    width: 200,
    margin: 1,
  });
  
  // Generate backup recovery codes (10 codes, 8 characters each)
  const backupCodes = Array.from({ length: 10 }, () => {
    return crypto.randomBytes(4).toString("hex").toUpperCase();
  });
  
  return {
    secret,
    qrCode,
    backupCodes,
  };
}

/**
 * Verify a TOTP code
 * 
 * @param token - TOTP code from user's authenticator app
 * @param secret - User's TOTP secret
 * @returns true if code is valid, false otherwise
 */
export function verifyTOTP(token: string, secret: string): boolean {
  try {
    // Validate token format (6 digits)
    if (!/^\d{6}$/.test(token)) {
      return false;
    }
    
    // Verify with time window tolerance (default: ±1 time step = 30 seconds)
    return authenticator.verify({
      token,
      secret,
    });
  } catch (error) {
    console.error("Error verifying TOTP:", error);
    return false;
  }
}

/**
 * Hash backup codes for storage
 * 
 * @param codes - Array of backup codes
 * @returns Comma-separated string of hashed codes
 */
export async function hashBackupCodes(codes: string[]): Promise<string> {
  const hashedCodes = await Promise.all(
    codes.map((code) => bcrypt.hash(code, 10))
  );
  return hashedCodes.join(",");
}

/**
 * Verify a backup code
 * 
 * @param code - Backup code to verify
 * @param hashedCodes - Comma-separated string of hashed codes from database
 * @returns true if code is valid, false otherwise
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: string
): Promise<boolean> {
  if (!hashedCodes) {
    return false;
  }
  
  const codes = hashedCodes.split(",");
  
  // Try to match against any of the hashed codes
  for (const hashedCode of codes) {
    const isValid = await bcrypt.compare(code, hashedCode);
    if (isValid) {
      return true;
    }
  }
  
  return false;
}

/**
 * Remove a used backup code from the stored list
 * 
 * @param code - Backup code that was used
 * @param hashedCodes - Comma-separated string of hashed codes
 * @returns Updated comma-separated string with used code removed
 */
export async function removeBackupCode(
  code: string,
  hashedCodes: string
): Promise<string> {
  const codes = hashedCodes.split(",");
  const updatedCodes: string[] = [];
  
  for (const hashedCode of codes) {
    const isValid = await bcrypt.compare(code, hashedCode);
    if (!isValid) {
      // Keep codes that don't match (not the one being removed)
      updatedCodes.push(hashedCode);
    }
  }
  
  return updatedCodes.join(",");
}

/**
 * Validate TOTP code format
 * 
 * @param code - Code to validate
 * @returns true if format is valid (6 digits), false otherwise
 */
export function validateTOTPFormat(code: string): boolean {
  return /^\d{6}$/.test(code);
}
