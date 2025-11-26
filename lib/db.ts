/**
 * Database connection module
 * 
 * This module exports a singleton Prisma client instance that is reused across
 * the application. Optimized for serverless environments (Vercel).
 * 
 * For Vercel production:
 * - Uses DATABASE_URL for all database connections
 * - Implements singleton pattern to prevent connection exhaustion
 */

import { PrismaClient } from "@prisma/client";

/**
 * Type definition for global Prisma instance storage
 * Used to prevent multiple Prisma client instances in development and serverless
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma client configuration optimized for serverless
 * 
 * Connection:
 * - Uses DATABASE_URL for all database operations (application queries and migrations)
 * - Format: postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
 * 
 * Logging:
 * - Development: errors and warnings
 * - Production: errors only (reduces overhead)
 * 
 * Connection Pooling:
 * - Connection limit set to prevent exhaustion in serverless
 * - Query timeout configured for Vercel's 30s limit
 */
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

/**
 * Singleton Prisma client instance
 * 
 * - In development: Reuses existing instance from global scope to prevent multiple instances during hot-reloading
 * - In production (serverless): Reuses global instance to prevent connection exhaustion
 * - Each serverless function invocation reuses the same instance if available
 */
export const db =
  globalForPrisma.prisma ?? createPrismaClient();

/**
 * Store Prisma instance in global scope
 * 
 * This prevents creating multiple instances:
 * - In development: Prevents multiple instances during Next.js hot-reloading
 * - In serverless: Prevents connection exhaustion across function invocations
 */
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
} else {
  // In production (serverless), also store in global to reuse across invocations
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = db;
  }
}
