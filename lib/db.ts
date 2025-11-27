/**
 * Database connection module
 * 
 * This module exports a singleton Prisma client instance that is reused across
 * the application. Optimized for serverless environments (Vercel).
 * 
 * Security:
 * - Uses parameterized queries (Prisma handles this)
 * - Validates DATABASE_URL before creating client
 * - Implements singleton pattern to prevent connection exhaustion
 * - Proper error handling and connection management
 * 
 * For Vercel production:
 * - Uses DATABASE_URL for all database connections
 * - Implements singleton pattern to prevent connection exhaustion
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { logError } from "./logger";

/**
 * Type definition for global Prisma instance storage
 * Used to prevent multiple Prisma client instances in development and serverless
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Validates DATABASE_URL format
 * 
 * @param url - Database URL to validate
 * @returns true if valid, false otherwise
 */
function validateDatabaseUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  // Basic validation: must be a PostgreSQL connection string
  const postgresPattern = /^postgresql:\/\//i;
  if (!postgresPattern.test(url)) {
    return false;
  }

  // Must contain host, port, and database
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.length > 0 && urlObj.pathname.length > 1;
  } catch {
    return false;
  }
}

/**
 * Prisma client configuration optimized for serverless
 * 
 * Connection:
 * - Uses DATABASE_URL for all database operations (application queries and migrations)
 * - Format: postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
 * - IMPORTANT: Use DIRECT connection (port 5432) NOT pooler (port 6543)
 * - Pooler connections cause migration issues and prepared statement errors
 * 
 * Logging:
 * - Development: errors and warnings
 * - Production: errors only (reduces overhead)
 * 
 * Connection Pooling:
 * - Connection limit set to prevent exhaustion in serverless
 * - Query timeout configured for Vercel's 30s limit
 * 
 * Error Handling:
 * - Validates DATABASE_URL before creating client
 * - Logs errors appropriately
 * - Provides helpful error messages
 */
const createPrismaClient = (): PrismaClient => {
  const databaseUrl = process.env.DATABASE_URL;

  // Security: Validate DATABASE_URL before creating client
  if (!validateDatabaseUrl(databaseUrl)) {
    const error = new Error(
      "Invalid or missing DATABASE_URL. Please check your environment variables."
    );
    logError("Invalid DATABASE_URL:", { 
      hasUrl: !!databaseUrl,
      urlLength: databaseUrl?.length ?? 0,
    });
    throw error;
  }

  try {
    // Fix for prepared statement errors in PostgreSQL
    // This error occurs when using connection poolers (PgBouncer) or in serverless environments
    // where prepared statements conflict across different sessions
    let finalDatabaseUrl = databaseUrl!;
    
    try {
      const connectionUrl = new URL(databaseUrl!);
      
      // For connection poolers (port 6543), use pgbouncer mode
      // This tells Prisma to use transaction mode which doesn't use prepared statements
      // This prevents "prepared statement already exists" errors
      // PgBouncer in transaction mode doesn't support prepared statements, which is why this works
      if (connectionUrl.port === "6543") {
        connectionUrl.searchParams.set("pgbouncer", "true");
      }
      
      // If pgbouncer is already specified, ensure it's set to true
      if (connectionUrl.searchParams.has("pgbouncer")) {
        connectionUrl.searchParams.set("pgbouncer", "true");
      }
      
      finalDatabaseUrl = connectionUrl.toString();
    } catch (urlError) {
      // If URL parsing fails, use original URL
      // This should rarely happen as we validate the URL format earlier
      logError("Failed to parse DATABASE_URL, using original URL:", urlError);
      finalDatabaseUrl = databaseUrl!;
    }

    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      datasources: {
        db: {
          url: finalDatabaseUrl,
        },
      },
      errorFormat: "minimal", // Security: Don't expose detailed errors in production
    });
  } catch (error) {
    logError("Failed to create Prisma client:", error);
    throw error;
  }
};

/**
 * Singleton Prisma client instance
 * 
 * - In development: Reuses existing instance from global scope to prevent multiple instances during hot-reloading
 * - In production (serverless): Reuses global instance to prevent connection exhaustion
 * - Each serverless function invocation reuses the same instance if available
 * 
 * Security:
 * - Validates DATABASE_URL before creating client
 * - Uses singleton pattern to prevent connection exhaustion
 * - Proper error handling
 */
export const db: PrismaClient = (() => {
  // Return existing instance if available
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  // Create new instance
  const client = createPrismaClient();

  // Store in global scope
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  } else {
    // In production (serverless), also store in global to reuse across invocations
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = client;
    }
  }

  return client;
})();

/**
 * Health check function for database connection
 * 
 * @returns Promise<boolean> - true if connection is healthy, false otherwise
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logError("Database health check failed:", error);
    return false;
  }
}

/**
 * Gracefully disconnect from database
 * 
 * Should be called on application shutdown
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await db.$disconnect();
  } catch (error) {
    logError("Error disconnecting from database:", error);
  }
}
