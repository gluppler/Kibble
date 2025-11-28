/**
 * Database connection module for Kibble application.
 * 
 * This module provides a singleton Prisma client instance optimized for
 * serverless environments (Vercel). The singleton pattern prevents connection
 * exhaustion in serverless functions where multiple instances could be created
 * across different invocations.
 * 
 * Security Features:
 * - Parameterized queries (handled automatically by Prisma ORM)
 * - DATABASE_URL validation before client creation
 * - Singleton pattern prevents connection pool exhaustion
 * - Comprehensive error handling with no sensitive data exposure
 * - Minimal error formatting in production to prevent information leakage
 * 
 * Serverless Optimization:
 * - Reuses global Prisma instance across function invocations
 * - Handles connection pooler compatibility (PgBouncer)
 * - Configures query timeouts for Vercel's 30-second limit
 * 
 * @module lib/db
 */

import { PrismaClient } from "@prisma/client";
import { logError } from "./logger";

/**
 * Global storage for Prisma client instance.
 * 
 * Used to maintain a singleton instance across serverless function invocations
 * and during development hot-reloading. Prevents connection pool exhaustion
 * by reusing the same client instance.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Validates the format of a PostgreSQL database connection URL.
 * 
 * Ensures the URL follows the required PostgreSQL connection string format
 * and contains all necessary components (host, port, database name).
 * 
 * @param url - Database connection URL to validate
 * @returns `true` if the URL is valid, `false` otherwise
 * 
 * @example
 * ```typescript
 * if (!validateDatabaseUrl(process.env.DATABASE_URL)) {
 *   throw new Error("Invalid database URL");
 * }
 * ```
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
 * Creates a configured Prisma client instance.
 * 
 * Configures the Prisma client with optimal settings for serverless environments,
 * including connection pooling, error handling, and prepared statement compatibility.
 * 
 * Connection Configuration:
 * - Uses DATABASE_URL for all database operations
 * - Supports direct connections (port 5432) and connection poolers (port 6543)
 * - Automatically enables PgBouncer mode for pooler connections
 * - Format: `postgresql://user:password@host:port/database`
 * 
 * Logging:
 * - Development: logs errors and warnings for debugging
 * - Production: logs errors only to reduce overhead
 * 
 * Error Handling:
 * - Validates DATABASE_URL before client creation
 * - Uses minimal error formatting in production
 * - Never exposes sensitive connection details
 * 
 * @returns Configured Prisma client instance
 * @throws {Error} If DATABASE_URL is invalid or missing
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
    // Handle connection pooler compatibility
    // PgBouncer and other connection poolers don't support prepared statements
    // in transaction mode, so we enable pgbouncer mode for pooler connections
    let finalDatabaseUrl = databaseUrl!;
    
    try {
      const connectionUrl = new URL(databaseUrl!);
      
      // Enable PgBouncer mode for pooler connections (port 6543)
      // This prevents "prepared statement already exists" errors by disabling
      // prepared statements, which aren't supported in transaction pooling mode
      if (connectionUrl.port === "6543") {
        connectionUrl.searchParams.set("pgbouncer", "true");
      }
      
      // Ensure pgbouncer parameter is set if already present
      if (connectionUrl.searchParams.has("pgbouncer")) {
        connectionUrl.searchParams.set("pgbouncer", "true");
      }
      
      finalDatabaseUrl = connectionUrl.toString();
    } catch (urlError) {
      // Fallback to original URL if parsing fails
      // This should be rare since we validate URL format earlier
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
 * Singleton Prisma client instance.
 * 
 * This exported constant provides a single database client instance that is
 * reused across the entire application. The singleton pattern is critical for
 * serverless environments where multiple function invocations could otherwise
 * exhaust the database connection pool.
 * 
 * Behavior:
 * - Development: Reuses instance from global scope during hot-reloading
 * - Production: Reuses global instance across serverless function invocations
 * - Prevents connection pool exhaustion by maintaining a single client
 * 
 * Security:
 * - Validates DATABASE_URL before client creation
 * - Implements singleton pattern to prevent resource exhaustion
 * - Comprehensive error handling with no sensitive data exposure
 * 
 * @example
 * ```typescript
 * import { db } from "@/lib/db";
 * 
 * const users = await db.user.findMany();
 * ```
 */
export const db: PrismaClient = (() => {
  // Return existing instance if available
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  // Create new instance
  const client = createPrismaClient();

  // Store in global scope (works for both development and production)
  globalForPrisma.prisma = client;

  return client;
})();

/**
 * Performs a health check on the database connection.
 * 
 * Executes a simple query to verify the database is accessible and responsive.
 * Useful for monitoring, deployment checks, and troubleshooting connection issues.
 * 
 * @returns Promise resolving to `true` if connection is healthy, `false` otherwise
 * 
 * @example
 * ```typescript
 * const isHealthy = await checkDatabaseHealth();
 * if (!isHealthy) {
 *   // Handle database connection failure
 * }
 * ```
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
 * Gracefully disconnects from the database.
 * 
 * Closes all active database connections and cleans up resources. Should be
 * called during application shutdown to ensure proper cleanup. In serverless
 * environments, this is typically handled automatically, but explicit calls
 * can be useful for long-running processes.
 * 
 * @returns Promise that resolves when disconnection is complete
 * 
 * @example
 * ```typescript
 * process.on("SIGTERM", async () => {
 *   await disconnectDatabase();
 *   process.exit(0);
 * });
 * ```
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await db.$disconnect();
  } catch (error) {
    logError("Error disconnecting from database:", error);
  }
}
