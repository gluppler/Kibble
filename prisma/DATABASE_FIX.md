# Database RLS Fix for NextAuth.js

## Problem

Kibble uses **NextAuth.js** for authentication, but the database has **Row Level Security (RLS)** enabled with policies that use Supabase Auth's `auth.uid()` function.

**Issue**: `auth.uid()` returns `NULL` when using NextAuth.js, causing:
- All database queries to fail
- "Database Error" from `/api/boards/list`
- "Failed to verify column ownership" when creating tasks
- Complete application failure

## Solution

A migration has been created to **disable RLS** on all tables. Application-level permissions in `lib/permissions.ts` handle all access control securely.

## How to Apply the Fix

### Option 1: Run Migration (Recommended)

```bash
# Apply the migration to disable RLS
npx prisma migrate deploy
```

This will apply the migration `20251202000000_disable_rls_for_nextauth` which:
- Disables RLS on all tables (User, Board, Column, Task, Account, Session, VerificationToken, PasswordResetToken)
- Drops all existing RLS policies
- Is idempotent (safe to run multiple times)

### Option 2: Manual SQL (If migration fails)

If the migration fails, you can run the SQL directly:

```sql
-- Disable RLS on all tables
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Board" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Column" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" DISABLE ROW LEVEL SECURITY;
```

## Verify the Fix

After applying the migration, verify RLS is disabled:

```sql
-- Check RLS status on all tables
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('User', 'Board', 'Column', 'Task', 'Account', 'Session', 'VerificationToken', 'PasswordResetToken')
ORDER BY tablename;
```

All tables should show `rowsecurity = false`.

## Security

**RLS is disabled, but security is maintained through:**

1. **Application-Level Permissions** (`lib/permissions.ts`):
   - All API routes validate user permissions before database queries
   - Permission functions check ownership before allowing operations
   - Input validation prevents injection attacks

2. **Prisma ORM**:
   - All queries use parameterized statements (prevents SQL injection)
   - Type-safe queries prevent errors

3. **NextAuth.js Sessions**:
   - User sessions are validated server-side
   - JWT tokens are verified before any database access

4. **Input Validation**:
   - All IDs are validated using `validateIdFormat()`
   - Strict type checking prevents type coercion attacks

## Testing

After applying the migration, test:

1. **Board Loading**: `/api/boards/list` should return boards without errors
2. **Task Creation**: Creating tasks in To-Do column should work
3. **Column Access**: Column ownership verification should work
4. **All CRUD Operations**: Create, read, update, delete should all work

## Rollback (If Needed)

If you need to re-enable RLS (e.g., migrating to Supabase Auth):

```sql
-- Re-enable RLS (requires Supabase Auth)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Board" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Column" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
-- ... etc
```

Then re-apply the RLS policy migrations.

## Related Files

- Migration: `prisma/migrations/20251202000000_disable_rls_for_nextauth/migration.sql`
- Documentation: `prisma/RLS_NOTES.md`
- Permissions: `lib/permissions.ts`
