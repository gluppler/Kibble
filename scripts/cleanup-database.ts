#!/usr/bin/env ts-node
/**
 * Database Cleanup Script
 * 
 * WARNING: This script is for DEVELOPMENT and TESTING only.
 * It will clean up orphaned records and test data.
 * 
 * DO NOT RUN IN PRODUCTION without careful review.
 * 
 * Usage: npm run db:cleanup (if added to package.json)
 * Or: ts-node scripts/cleanup-database.ts
 * 
 * Security:
 * - Only removes orphaned records (no parent relationship)
 * - Never deletes user data unless explicitly requested
 * - Requires confirmation for destructive operations
 * - Logs all operations
 */

import { PrismaClient } from "@prisma/client";
import { logError, logInfo } from "../lib/logger";

const prisma = new PrismaClient();

interface CleanupStats {
  orphanedColumns: number;
  orphanedTasks: number;
  expiredSessions: number;
  expiredResetTokens: number;
  archivedTasksOlderThan30Days: number;
  errors: string[];
}

async function cleanupDatabase(dryRun: boolean = true): Promise<CleanupStats> {
  const stats: CleanupStats = {
    orphanedColumns: 0,
    orphanedTasks: 0,
    expiredSessions: 0,
    expiredResetTokens: 0,
    archivedTasksOlderThan30Days: 0,
    errors: [],
  };

  console.log(dryRun ? "🔍 DRY RUN MODE - No changes will be made\n" : "🧹 CLEANUP MODE - Changes will be applied\n");

  try {
    // 1. Find and report orphaned columns (columns where boardId doesn't exist)
    console.log("1️⃣  Checking for orphaned columns...");
    try {
      // Get all board IDs
      const validBoardIds = await prisma.board.findMany({
        select: { id: true },
      });
      const validBoardIdSet = new Set(validBoardIds.map(b => b.id));

      // Get all columns and check if their boardId exists
      const allColumns = await prisma.column.findMany({
        select: { id: true, title: true, boardId: true },
      });

      const orphanedColumns = allColumns.filter(
        col => !validBoardIdSet.has(col.boardId)
      );

      stats.orphanedColumns = orphanedColumns.length;
      
      if (orphanedColumns.length > 0) {
        console.log(`   Found ${orphanedColumns.length} orphaned column(s)`);
        if (!dryRun) {
          const orphanedIds = orphanedColumns.map(col => col.id);
          const result = await prisma.column.deleteMany({
            where: {
              id: { in: orphanedIds },
            },
          });
          console.log(`   ✅ Deleted ${result.count} orphaned column(s)`);
        } else {
          console.log(`   Would delete ${orphanedColumns.length} orphaned column(s)`);
        }
      } else {
        console.log("   ✅ No orphaned columns found");
      }
    } catch (error) {
      const errorMsg = "Failed to check orphaned columns";
      stats.errors.push(errorMsg);
      logError(errorMsg, error);
      console.error(`   ❌ ${errorMsg}`);
    }

    // 2. Find and report orphaned tasks (tasks where columnId doesn't exist)
    console.log("\n2️⃣  Checking for orphaned tasks...");
    try {
      // Get all column IDs
      const validColumnIds = await prisma.column.findMany({
        select: { id: true },
      });
      const validColumnIdSet = new Set(validColumnIds.map(c => c.id));

      // Get all tasks and check if their columnId exists
      const allTasks = await prisma.task.findMany({
        select: { id: true, title: true, columnId: true },
      });

      const orphanedTasks = allTasks.filter(
        task => !validColumnIdSet.has(task.columnId)
      );

      stats.orphanedTasks = orphanedTasks.length;
      
      if (orphanedTasks.length > 0) {
        console.log(`   Found ${orphanedTasks.length} orphaned task(s)`);
        if (!dryRun) {
          const orphanedIds = orphanedTasks.map(task => task.id);
          const result = await prisma.task.deleteMany({
            where: {
              id: { in: orphanedIds },
            },
          });
          console.log(`   ✅ Deleted ${result.count} orphaned task(s)`);
        } else {
          console.log(`   Would delete ${orphanedTasks.length} orphaned task(s)`);
        }
      } else {
        console.log("   ✅ No orphaned tasks found");
      }
    } catch (error) {
      const errorMsg = "Failed to check orphaned tasks";
      stats.errors.push(errorMsg);
      logError(errorMsg, error);
      console.error(`   ❌ ${errorMsg}`);
    }

    // 3. Clean up expired sessions
    console.log("\n3️⃣  Checking for expired sessions...");
    try {
      const now = new Date();
      const expiredSessions = await prisma.session.findMany({
        where: {
          expires: {
            lt: now,
          },
        },
        select: { id: true },
      });

      stats.expiredSessions = expiredSessions.length;
      
      if (expiredSessions.length > 0) {
        console.log(`   Found ${expiredSessions.length} expired session(s)`);
        if (!dryRun) {
          const result = await prisma.session.deleteMany({
            where: {
              expires: {
                lt: now,
              },
            },
          });
          console.log(`   ✅ Deleted ${result.count} expired session(s)`);
        } else {
          console.log(`   Would delete ${expiredSessions.length} expired session(s)`);
        }
      } else {
        console.log("   ✅ No expired sessions found");
      }
    } catch (error) {
      const errorMsg = "Failed to check expired sessions";
      stats.errors.push(errorMsg);
      logError(errorMsg, error);
      console.error(`   ❌ ${errorMsg}`);
    }

    // 4. Clean up expired password reset tokens
    console.log("\n4️⃣  Checking for expired password reset tokens...");
    try {
      const now = new Date();
      const expiredTokens = await prisma.passwordResetToken.findMany({
        where: {
          expires: {
            lt: now,
          },
        },
        select: { id: true },
      });

      stats.expiredResetTokens = expiredTokens.length;
      
      if (expiredTokens.length > 0) {
        console.log(`   Found ${expiredTokens.length} expired token(s)`);
        if (!dryRun) {
          const result = await prisma.passwordResetToken.deleteMany({
            where: {
              expires: {
                lt: now,
              },
            },
          });
          console.log(`   ✅ Deleted ${result.count} expired token(s)`);
        } else {
          console.log(`   Would delete ${expiredTokens.length} expired token(s)`);
        }
      } else {
        console.log("   ✅ No expired tokens found");
      }
    } catch (error) {
      const errorMsg = "Failed to check expired tokens";
      stats.errors.push(errorMsg);
      logError(errorMsg, error);
      console.error(`   ❌ ${errorMsg}`);
    }

    // 5. Report archived tasks older than 30 days (for manual review)
    console.log("\n5️⃣  Checking for old archived tasks...");
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const oldArchivedTasks = await prisma.task.findMany({
        where: {
          archived: true,
          archivedAt: {
            lt: thirtyDaysAgo,
          },
        },
        select: { id: true, title: true, archivedAt: true },
      });

      stats.archivedTasksOlderThan30Days = oldArchivedTasks.length;
      
      if (oldArchivedTasks.length > 0) {
        console.log(`   Found ${oldArchivedTasks.length} archived task(s) older than 30 days`);
        console.log("   ℹ️  These are kept for history - no automatic deletion");
      } else {
        console.log("   ✅ No old archived tasks found");
      }
    } catch (error) {
      const errorMsg = "Failed to check archived tasks";
      stats.errors.push(errorMsg);
      logError(errorMsg, error);
      console.error(`   ❌ ${errorMsg}`);
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 Cleanup Summary:");
    console.log(`   Orphaned Columns: ${stats.orphanedColumns}`);
    console.log(`   Orphaned Tasks: ${stats.orphanedTasks}`);
    console.log(`   Expired Sessions: ${stats.expiredSessions}`);
    console.log(`   Expired Reset Tokens: ${stats.expiredResetTokens}`);
    console.log(`   Old Archived Tasks: ${stats.archivedTasksOlderThan30Days} (kept for history)`);
    
    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors: ${stats.errors.length}`);
      stats.errors.forEach((error) => console.error(`   - ${error}`));
    }

    if (dryRun) {
      console.log("\n💡 This was a dry run. To apply changes, run with --apply flag");
    } else {
      console.log("\n✅ Cleanup completed!");
    }

    return stats;
  } catch (error) {
    logError("Database cleanup failed:", error);
    console.error("\n❌ Cleanup failed:", error instanceof Error ? error.message : error);
    throw error;
  } finally {
    try {
      await prisma.$disconnect();
    } catch {
      // Ignore disconnect errors
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = !args.includes("--apply");

// Safety check for production
if (process.env.NODE_ENV === "production" && !dryRun) {
  console.error("❌ ERROR: Cannot run cleanup in production mode!");
  console.error("   This script is for development and testing only.");
  process.exit(1);
}

// Run cleanup
cleanupDatabase(dryRun)
  .then((stats) => {
    if (stats.errors.length > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  })
  .catch((error) => {
    logError("Unexpected error in cleanup:", error);
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
