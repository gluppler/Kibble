# Database Cleanup and Connection Guide

## Overview

This guide explains how to clean up the database, check connections, and maintain data integrity in Kibble.

## Quick Start

### 1. Test Database Connection

```bash
npm run db:test
```

This will:
- Test database connectivity
- Check RLS status on all tables
- Verify query performance
- Check for orphaned records
- Provide diagnostic information

### 2. Clean Up Database (Dry Run)

```bash
npm run db:cleanup
```

This will:
- Check for orphaned columns (columns with invalid boardId)
- Check for orphaned tasks (tasks with invalid columnId)
- Check for expired sessions
- Check for expired password reset tokens
- Report old archived tasks
- **No changes will be made** (dry run mode)

### 3. Apply Cleanup (Development Only)

```bash
npm run db:cleanup:apply
```

**WARNING**: This will actually delete orphaned records. Only use in development/testing.

## Database Connection

### Connection Test Script

The `scripts/test-db-connection.ts` script provides comprehensive database diagnostics:

**Features**:
- ✅ Connection testing
- ✅ RLS status checking (warns if enabled with NextAuth.js)
- ✅ Query performance testing
- ✅ Data integrity checks (orphaned records)
- ✅ Helpful error messages with troubleshooting tips

**Output Example**:
```
🔍 Testing database connection...

📡 Database URL: postgresql://postgres:****@db.example.com:5432/postgres
🔌 Connecting to database...
✅ Database connection successful!

📊 Testing database queries...
  User: 5 records | RLS: ✅ DISABLED (correct for NextAuth.js)
  Board: 10 records | RLS: ✅ DISABLED (correct for NextAuth.js)
  Column: 40 records | RLS: ✅ DISABLED (correct for NextAuth.js)
  Task: 120 records | RLS: ✅ DISABLED (correct for NextAuth.js)

⚡ Testing query performance...
  Query time: 45ms
  ✅ Query performance is acceptable

🔍 Checking data integrity...
  ✅ No orphaned records found

✅ Database connection test completed successfully!
```

## Database Cleanup

### Cleanup Script

The `scripts/cleanup-database.ts` script safely cleans up the database:

**What it cleans**:
1. **Orphaned Columns**: Columns where `boardId` doesn't exist in Board table
2. **Orphaned Tasks**: Tasks where `columnId` doesn't exist in Column table
3. **Expired Sessions**: Sessions that have passed their expiration date
4. **Expired Reset Tokens**: Password reset tokens that have expired

**What it reports** (but doesn't delete):
- Archived tasks older than 30 days (kept for history)

**Safety Features**:
- ✅ Dry run mode by default
- ✅ Prevents running in production
- ✅ Logs all operations
- ✅ Provides detailed statistics

### Running Cleanup

**Dry Run** (recommended first):
```bash
npm run db:cleanup
```

**Apply Cleanup** (development only):
```bash
npm run db:cleanup:apply
```

**Output Example**:
```
🔍 DRY RUN MODE - No changes will be made

1️⃣  Checking for orphaned columns...
   ✅ No orphaned columns found

2️⃣  Checking for orphaned tasks...
   ✅ No orphaned tasks found

3️⃣  Checking for expired sessions...
   Found 5 expired session(s)
   Would delete 5 expired session(s)

4️⃣  Checking for expired password reset tokens...
   Found 2 expired token(s)
   Would delete 2 expired token(s)

5️⃣  Checking for old archived tasks...
   Found 15 archived task(s) older than 30 days
   ℹ️  These are kept for history - no automatic deletion

==================================================
📊 Cleanup Summary:
   Orphaned Columns: 0
   Orphaned Tasks: 0
   Expired Sessions: 5
   Expired Reset Tokens: 2
   Old Archived Tasks: 15 (kept for history)

💡 This was a dry run. To apply changes, run with --apply flag
```

## Database Connection Module

### Enhanced `lib/db.ts`

The database connection module has been refactored with:

**Security Improvements**:
- ✅ DATABASE_URL validation before creating client
- ✅ Error format set to "minimal" (prevents information leakage)
- ✅ Proper error handling and logging
- ✅ Health check function
- ✅ Graceful disconnect function

**New Functions**:
- `checkDatabaseHealth()`: Check if database connection is healthy
- `disconnectDatabase()`: Gracefully disconnect from database

**Usage**:
```typescript
import { db, checkDatabaseHealth, disconnectDatabase } from '@/lib/db';

// Check health
const isHealthy = await checkDatabaseHealth();

// Use database
const boards = await db.board.findMany();

// Disconnect (on shutdown)
await disconnectDatabase();
```

## Troubleshooting

### Connection Issues

**Error**: "Can't reach database server"
```bash
# Test connection
npm run db:test

# Check:
# - DATABASE_URL is set correctly
# - Database server is running
# - Firewall/network settings allow connection
```

**Error**: "Invalid or missing DATABASE_URL"
```bash
# Check environment variables
echo $DATABASE_URL

# Verify format: postgresql://user:password@host:5432/database
```

### RLS Issues

**Warning**: "RLS: ⚠️ ENABLED (may cause issues with NextAuth.js)"
```bash
# Apply migration to disable RLS
npm run db:migrate

# This applies: 20251202000000_disable_rls_for_nextauth
```

### Orphaned Records

**Found orphaned columns/tasks**:
```bash
# Check what would be cleaned (dry run)
npm run db:cleanup

# Apply cleanup (development only)
npm run db:cleanup:apply
```

### Performance Issues

**Query performance is slow (>1000ms)**:
- Check database server resources
- Verify indexes are created
- Check for connection pool exhaustion
- Review query patterns

## Security Notes

1. **Never run cleanup in production** without careful review
2. **Always test connection** before making changes
3. **Backup database** before applying cleanup
4. **Review orphaned records** before deletion
5. **Use dry run mode** first to see what would be deleted

## Related Files

- Connection Test: `scripts/test-db-connection.ts`
- Cleanup Script: `scripts/cleanup-database.ts`
- Database Module: `lib/db.ts`
- RLS Migration: `prisma/migrations/20251202000000_disable_rls_for_nextauth/migration.sql`
- RLS Documentation: `prisma/RLS_NOTES.md`
- Database Fix Guide: `prisma/DATABASE_FIX.md`
