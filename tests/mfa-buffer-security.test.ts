/**
 * MFA Buffer Security Tests
 * 
 * This test suite ensures that:
 * 1. No unsafe Buffer() usage exists in MFA code
 * 2. Safe Buffer methods (Buffer.from(), Buffer.alloc(), Buffer.allocUnsafe()) are properly tested
 * 3. All MFA-related files are scanned for security vulnerabilities
 * 
 * Security Note:
 * - Buffer() constructor is deprecated and unsafe (can leak memory)
 * - Only Buffer.from(), Buffer.alloc(), or Buffer.allocUnsafe() should be used
 */

import { describe, test, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

/**
 * Recursively find all TypeScript/JavaScript files in a directory
 */
function findSourceFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  files.forEach((file) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, and other build directories
      if (
        !file.startsWith(".") &&
        file !== "node_modules" &&
        file !== ".next" &&
        file !== "dist" &&
        file !== "build"
      ) {
        findSourceFiles(filePath, fileList);
      }
    } else {
      const ext = extname(file);
      if (ext === ".ts" || ext === ".js" || ext === ".tsx" || ext === ".jsx") {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * Check if a file contains unsafe Buffer() usage
 */
function checkUnsafeBufferUsage(filePath: string): {
  hasUnsafeUsage: boolean;
  lines: Array<{ line: number; content: string }>;
} {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const unsafeLines: Array<{ line: number; content: string }> = [];

  // Regex to match Buffer() constructor calls (unsafe)
  // Matches: Buffer(...) but not Buffer.from(...), Buffer.alloc(...), etc.
  const unsafeBufferRegex = /\bBuffer\s*\(/g;

  lines.forEach((line, index) => {
    // Check if line contains unsafe Buffer() usage
    // Exclude comments and safe methods
    if (
      unsafeBufferRegex.test(line) &&
      !line.includes("Buffer.from(") &&
      !line.includes("Buffer.alloc(") &&
      !line.includes("Buffer.allocUnsafe(") &&
      !line.trim().startsWith("//") &&
      !line.trim().startsWith("*") &&
      !line.includes("// Safe:") &&
      !line.includes("/* Safe:")
    ) {
      unsafeLines.push({
        line: index + 1,
        content: line.trim(),
      });
    }
  });

  return {
    hasUnsafeUsage: unsafeLines.length > 0,
    lines: unsafeLines,
  };
}

describe("MFA Buffer Security", () => {
  test("No unsafe Buffer() usage in MFA codebase", () => {
    const projectRoot = join(process.cwd());
    const mfaDirs = [
      join(projectRoot, "lib"),
      join(projectRoot, "app/api/auth/mfa"),
      join(projectRoot, "app/api/auth/password"),
    ];

    const allFiles: string[] = [];
    mfaDirs.forEach((dir) => {
      try {
        const files = findSourceFiles(dir);
        allFiles.push(...files);
      } catch (error) {
        // Directory might not exist, skip
      }
    });

    const unsafeUsages: Array<{
      file: string;
      lines: Array<{ line: number; content: string }>;
    }> = [];

    allFiles.forEach((file) => {
      // Exclude suppress-buffer-deprecation.ts from scan (it's the suppression module itself)
      if (file.includes("suppress-buffer-deprecation.ts")) {
        return;
      }
      
      const result = checkUnsafeBufferUsage(file);
      if (result.hasUnsafeUsage) {
        unsafeUsages.push({
          file: file.replace(projectRoot, "."),
          lines: result.lines,
        });
      }
    });

    if (unsafeUsages.length > 0) {
      const errorMessages = unsafeUsages.map((usage) => {
        const lineDetails = usage.lines
          .map((l) => `  Line ${l.line}: ${l.content}`)
          .join("\n");
        return `\n${usage.file}:\n${lineDetails}`;
      });

      throw new Error(
        `Unsafe Buffer() usage detected in ${unsafeUsages.length} file(s):\n${errorMessages.join("\n")}\n\n` +
          "Security Risk: Buffer() constructor is deprecated and can leak memory.\n" +
          "Use Buffer.from(), Buffer.alloc(), or Buffer.allocUnsafe() instead."
      );
    }

    expect(unsafeUsages.length).toBe(0);
  });

  describe("Safe Buffer Methods", () => {
    test("Buffer.from() - string to buffer", () => {
      const str = "test string";
      const buffer = Buffer.from(str, "utf-8");

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBe(str.length);
      expect(buffer.toString("utf-8")).toBe(str);
    });

    test("Buffer.from() - array to buffer", () => {
      const array = [0x74, 0x65, 0x73, 0x74];
      const buffer = Buffer.from(array);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBe(4);
      expect(buffer[0]).toBe(0x74);
      expect(buffer[1]).toBe(0x65);
      expect(buffer[2]).toBe(0x73);
      expect(buffer[3]).toBe(0x74);
    });

    test("Buffer.from() - empty input", () => {
      const buffer = Buffer.from("", "utf-8");

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBe(0);
    });

    test("Buffer.from() - invalid input handling", () => {
      // Buffer.from() with null/undefined should throw
      expect(() => Buffer.from(null as any)).toThrow();
      expect(() => Buffer.from(undefined as any)).toThrow();
    });

    test("Buffer.alloc() - create zero-filled buffer", () => {
      const size = 10;
      const buffer = Buffer.alloc(size);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBe(size);
      // All bytes should be zero
      for (let i = 0; i < size; i++) {
        expect(buffer[i]).toBe(0);
      }
    });

    test("Buffer.alloc() - create filled buffer", () => {
      const size = 5;
      const fill = 0x42;
      const buffer = Buffer.alloc(size, fill);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBe(size);
      // All bytes should be filled with 0x42
      for (let i = 0; i < size; i++) {
        expect(buffer[i]).toBe(fill);
      }
    });

    test("Buffer.alloc() - edge cases", () => {
      // Zero size
      const emptyBuffer = Buffer.alloc(0);
      expect(emptyBuffer.length).toBe(0);

      // Large size
      const largeBuffer = Buffer.alloc(1024);
      expect(largeBuffer.length).toBe(1024);
    });

    test("Buffer.alloc() - invalid size handling", () => {
      // Negative size should throw
      expect(() => Buffer.alloc(-1)).toThrow();
    });

    test("Buffer.allocUnsafe() - create uninitialized buffer", () => {
      const size = 10;
      const buffer = Buffer.allocUnsafe(size);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBe(size);
      // Content is uninitialized (may contain random data)
      // We can only check the length
    });

    test("Buffer.allocUnsafe() - edge cases", () => {
      // Zero size
      const emptyBuffer = Buffer.allocUnsafe(0);
      expect(emptyBuffer.length).toBe(0);

      // Large size
      const largeBuffer = Buffer.allocUnsafe(1024);
      expect(largeBuffer.length).toBe(1024);
    });

    test("Buffer.allocUnsafe() - invalid size handling", () => {
      // Negative size should throw
      expect(() => Buffer.allocUnsafe(-1)).toThrow();
    });

    test("Buffer methods - comparison and conversion", () => {
      const str = "hello";
      const buffer1 = Buffer.from(str, "utf-8");
      const buffer2 = Buffer.alloc(str.length);
      buffer2.write(str, 0, "utf-8");

      expect(buffer1.toString("utf-8")).toBe(buffer2.toString("utf-8"));
      expect(buffer1.equals(buffer2)).toBe(true);
    });

    test("Buffer methods - encoding handling", () => {
      const str = "test";
      const utf8Buffer = Buffer.from(str, "utf-8");
      const base64Buffer = Buffer.from(str, "base64");

      expect(utf8Buffer.toString("utf-8")).toBe(str);
      // base64 encoding of "test" is different
      expect(base64Buffer.toString("utf-8")).not.toBe(str);
    });
  });

  describe("MFA-specific Buffer Usage", () => {
    test("crypto.randomBytes() returns Buffer (safe)", () => {
      const crypto = require("crypto");
      const buffer = crypto.randomBytes(16);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBe(16);
      // Should not be all zeros (random data)
      const isAllZeros = buffer.every((byte) => byte === 0);
      expect(isAllZeros).toBe(false);
    });

    test("crypto.randomBytes() - different sizes", () => {
      const crypto = require("crypto");

      const sizes = [1, 4, 8, 16, 32, 64];
      sizes.forEach((size) => {
        const buffer = crypto.randomBytes(size);
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBe(size);
      });
    });

    test("crypto.randomBytes() - edge cases", () => {
      const crypto = require("crypto");

      // Zero size
      const emptyBuffer = crypto.randomBytes(0);
      expect(emptyBuffer.length).toBe(0);

      // Large size
      const largeBuffer = crypto.randomBytes(1024);
      expect(largeBuffer.length).toBe(1024);
    });
  });
});
