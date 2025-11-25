/**
 * Database connection module
 * 
 * This module exports a singleton Prisma client instance that is reused across
 * the application. In development, the instance is stored in global scope to
 * prevent multiple instances during hot-reloading.
 */

import { PrismaClient } from "@prisma/client";

/**
 * Type definition for global Prisma instance storage
 * Used to prevent multiple Prisma client instances in development
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Singleton Prisma client instance
 * 
 * - In development: Reuses existing instance from global scope if available
 * - In production: Creates new instance
 * - Logging: Only errors in production, errors and warnings in development
 */
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

/**
 * Store Prisma instance in global scope during development
 * This prevents creating multiple instances during Next.js hot-reloading
 */
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
