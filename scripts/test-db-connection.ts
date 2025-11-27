#!/usr/bin/env ts-node
/**
 * Database Connection Test Script
 * 
 * Tests database connectivity and provides diagnostic information.
 * 
 * Usage: npm run db:test
 * 
 * Security:
 * - Only reads data, never modifies
 * - Uses singleton Prisma client
 * - Validates connection before queries
 */

import { PrismaClient } from "@prisma/client";
import { logError } from "../lib/logger";

const prisma = new PrismaClient();

interface ConnectionInfo {
  connected: boolean;
  databaseUrl?: string;
  tables: {
    name: string;
    count: number;
    rlsEnabled?: boolean;
  }[];
  errors: string[];
}

async function testConnection(): Promise<ConnectionInfo> {
  const info: ConnectionInfo = {
    connected: false,
    tables: [],
    errors: [],
  };

  try {
    console.log("🔍 Testing database connection...\n");

    // Check DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      info.errors.push("DATABASE_URL environment variable is not set");
      console.error("❌ DATABASE_URL not found in environment variables");
      return info;
    }

    // Mask password in URL for logging
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ":****@");
    info.databaseUrl = maskedUrl;
    console.log(`📡 Database URL: ${maskedUrl}`);

    // Test connection
    console.log("🔌 Connecting to database...");
    await prisma.$connect();
    info.connected = true;
    console.log("✅ Database connection successful!\n");

    // Test basic query
    console.log("📊 Testing database queries...");
    
    // Check RLS status on key tables
    const tablesToCheck = ["User", "Board", "Column", "Task", "Account", "Session"];
    
    for (const tableName of tablesToCheck) {
      try {
        let count = 0;
        let rlsEnabled: boolean | undefined;

        // Get count based on table name
        switch (tableName) {
          case "User":
            count = await prisma.user.count();
            break;
          case "Board":
            count = await prisma.board.count();
            break;
          case "Column":
            count = await prisma.column.count();
            break;
          case "Task":
            count = await prisma.task.count();
            break;
          case "Account":
            count = await prisma.account.count();
            break;
          case "Session":
            count = await prisma.session.count();
            break;
        }

        // Check RLS status (if possible)
        try {
          const result = await prisma.$queryRaw<Array<{ rowsecurity: boolean }>>`
            SELECT rowsecurity 
            FROM pg_tables t
            JOIN pg_class c ON c.relname = t.tablename
            WHERE t.schemaname = 'public' 
            AND t.tablename = ${tableName}
          `;
          rlsEnabled = result[0]?.rowsecurity ?? undefined;
        } catch {
          // RLS check might fail, that's okay
          rlsEnabled = undefined;
        }

        info.tables.push({
          name: tableName,
          count,
          rlsEnabled,
        });

        const rlsStatus = rlsEnabled === undefined 
          ? "unknown" 
          : rlsEnabled 
            ? "⚠️  ENABLED (may cause issues with NextAuth.js)" 
            : "✅ DISABLED (correct for NextAuth.js)";
        
        console.log(`  ${tableName}: ${count} records | RLS: ${rlsStatus}`);
      } catch (error) {
        const errorMsg = `Failed to query ${tableName}`;
        info.errors.push(errorMsg);
        console.error(`  ❌ ${errorMsg}:`, error instanceof Error ? error.message : error);
      }
    }

    // Test Prisma query performance
    console.log("\n⚡ Testing query performance...");
    const startTime = Date.now();
    await prisma.board.findFirst();
    const queryTime = Date.now() - startTime;
    console.log(`  Query time: ${queryTime}ms`);

    if (queryTime > 1000) {
      info.errors.push("Query performance is slow (>1000ms)");
      console.warn("  ⚠️  Query performance is slow");
    } else {
      console.log("  ✅ Query performance is acceptable");
    }

    // Check for orphaned records
    console.log("\n🔍 Checking data integrity...");
    try {
      // Get all valid board IDs
      const validBoardIds = await prisma.board.findMany({
        select: { id: true },
      });
      const validBoardIdSet = new Set(validBoardIds.map(b => b.id));

      // Get all valid column IDs
      const validColumnIds = await prisma.column.findMany({
        select: { id: true },
      });
      const validColumnIdSet = new Set(validColumnIds.map(c => c.id));

      // Check for orphaned columns (columns with invalid boardId)
      const allColumns = await prisma.column.findMany({
        select: { id: true, boardId: true },
      });
      const orphanedColumns = allColumns.filter(
        col => !validBoardIdSet.has(col.boardId)
      );

      // Check for orphaned tasks (tasks with invalid columnId)
      const allTasks = await prisma.task.findMany({
        select: { id: true, columnId: true },
      });
      const orphanedTasks = allTasks.filter(
        task => !validColumnIdSet.has(task.columnId)
      );

      if (orphanedColumns.length > 0) {
        info.errors.push(`Found ${orphanedColumns.length} orphaned columns`);
        console.warn(`  ⚠️  Found ${orphanedColumns.length} orphaned columns (missing board)`);
      }

      if (orphanedTasks.length > 0) {
        info.errors.push(`Found ${orphanedTasks.length} orphaned tasks`);
        console.warn(`  ⚠️  Found ${orphanedTasks.length} orphaned tasks (missing column)`);
      }

      if (orphanedColumns.length === 0 && orphanedTasks.length === 0) {
        console.log("  ✅ No orphaned records found");
      }
    } catch (error) {
      const errorMsg = "Failed to check data integrity";
      info.errors.push(errorMsg);
      console.error(`  ❌ ${errorMsg}:`, error instanceof Error ? error.message : error);
    }

    console.log("\n✅ Database connection test completed successfully!");
    return info;
  } catch (error) {
    info.connected = false;
    const errorMsg = error instanceof Error ? error.message : String(error);
    info.errors.push(errorMsg);
    
    logError("Database connection test failed:", error);
    console.error("\n❌ Database connection failed:");
    console.error(errorMsg);
    
    // Provide helpful error messages
    if (errorMsg.includes("Can't reach database server")) {
      console.error("\n💡 Troubleshooting:");
      console.error("  - Check DATABASE_URL is correct");
      console.error("  - Verify database server is running");
      console.error("  - Check firewall/network settings");
    } else if (errorMsg.includes("authentication failed")) {
      console.error("\n💡 Troubleshooting:");
      console.error("  - Check database password in DATABASE_URL");
      console.error("  - Verify user has proper permissions");
    } else if (errorMsg.includes("does not exist")) {
      console.error("\n💡 Troubleshooting:");
      console.error("  - Run migrations: npm run db:migrate");
      console.error("  - Check database name in DATABASE_URL");
    }
    
    return info;
  } finally {
    try {
      await prisma.$disconnect();
    } catch {
      // Ignore disconnect errors
    }
  }
}

// Run test
testConnection()
  .then((info) => {
    if (info.errors.length > 0) {
      console.error(`\n⚠️  Found ${info.errors.length} issue(s)`);
      process.exit(1);
    } else {
      process.exit(0);
    }
  })
  .catch((error) => {
    logError("Unexpected error in connection test:", error);
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
