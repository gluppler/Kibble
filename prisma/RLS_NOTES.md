# Row Level Security (RLS) Configuration Notes

## ⚠️ IMPORTANT: RLS is DISABLED for NextAuth.js Compatibility

**Status**: RLS is **DISABLED** on all tables because Kibble uses **NextAuth.js**, not Supabase Auth.

**Why**: RLS policies use `auth.uid()` (Supabase Auth function), which returns `NULL` when using NextAuth.js. This causes all database queries to fail because the policies always evaluate to false.

**Security**: Application-level permissions in `lib/permissions.ts` handle all access control. All API routes validate user permissions before database queries.

## Overview

This document explains the RLS configuration (or lack thereof) for Kibble's database tables.

## Tables with RLS Status

**Current Status**: RLS is **DISABLED** on all tables for NextAuth.js compatibility.

**Previous Configuration** (before NextAuth.js migration):
The following tables previously had Row Level Security enabled with policies:

1. **User** - Users can only access their own profile
2. **Board** - Users can only access their own boards
3. **Column** - Users can only access columns in their own boards
4. **Task** - Users can only access tasks in their own boards
5. **Account** - Users can only access their own OAuth accounts
6. **Session** - Users can only access their own sessions
7. **VerificationToken** - Authenticated users can read (used by NextAuth.js)
8. **PasswordResetToken** - Users can only access their own reset tokens

**Migration**: `20251202000000_disable_rls_for_nextauth` disables RLS on all tables.

## Tables WITHOUT RLS

### `_prisma_migrations`

**Status**: RLS is NOT enabled (and should never be enabled)

**Reason**: 
- This is Prisma's internal system table for tracking migrations
- It's managed by Prisma CLI and database migrations
- Only the database superuser/migration runner should access it
- Enabling RLS would break Prisma migrations
- It doesn't contain user data - only migration metadata

**Security**: 
- Access is controlled via PostgreSQL GRANT/REVOKE permissions
- Only database superuser and migration service account should have access
- Not exposed to application code or users

## RLS Policy Implementation

### Supabase Auth vs NextAuth.js

**CRITICAL**: Kibble uses **NextAuth.js**, not Supabase Auth.

**Problem**: RLS policies use Supabase Auth functions (`auth.uid()`), which return `NULL` with NextAuth.js. This causes:
- All database queries to fail
- "Database Error" messages
- "Failed to verify column ownership" errors
- Complete application failure

**Solution**: RLS is disabled. Application-level permissions in `lib/permissions.ts` handle all access control:
- All API routes validate user permissions before database queries
- Permission functions check ownership before allowing operations
- Input validation prevents injection attacks
- Security events are logged for unauthorized access attempts

**Security**: This is secure because:
1. All database queries go through Prisma (parameterized queries prevent SQL injection)
2. Application-level permissions are enforced before every database operation
3. User sessions are validated via NextAuth.js
4. All IDs are validated before use
5. Comprehensive error handling prevents information leakage

### Policy Pattern

All user-owned tables follow this pattern:
```sql
-- Users can only access their own records
CREATE POLICY "Users can view own [resource]"
ON "[Table]"
FOR SELECT
USING (auth.uid()::text = "userId");
```

### PasswordResetToken Policies

The `PasswordResetToken` table has strict policies:
- **SELECT**: Users can only view their own tokens
- **INSERT**: Users can only create tokens for themselves
- **UPDATE**: Users can only update their own tokens (e.g., mark as used)
- **DELETE**: Users can only delete their own tokens

This prevents:
- Token enumeration attacks
- Unauthorized password resets
- Access to other users' reset tokens

## Migration Files

RLS-related migrations:
- `prisma/migrations/20251126000000_add_rls_policies/migration.sql` - Initial RLS setup (now disabled)
- `prisma/migrations/20251201000000_add_password_reset_token_rls/migration.sql` - PasswordResetToken RLS (now disabled)
- `prisma/migrations/20251202000000_disable_rls_for_nextauth/migration.sql` - **Disables RLS for NextAuth.js compatibility** (CURRENT)

## Applying RLS Policies

To apply RLS policies:

```bash
# Run migrations (includes RLS setup)
npx prisma migrate deploy

# Or for development
npx prisma migrate dev
```

## Verifying RLS

To verify RLS is enabled:

```sql
-- Check if RLS is enabled on a table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'PasswordResetToken';

-- List all policies on a table
SELECT * FROM pg_policies 
WHERE tablename = 'PasswordResetToken';
```

## Security Best Practices

1. **RLS is disabled** for NextAuth.js compatibility - this is correct and secure
2. **Application-level permissions** in `lib/permissions.ts` must be maintained
3. **Never enable RLS** on system tables like `_prisma_migrations`
4. **Test permissions** after schema changes
5. **Review permission functions** when adding new tables
6. **Document exceptions** (like `_prisma_migrations`)

**Note**: If migrating to Supabase Auth in the future, RLS can be re-enabled by:
1. Reverting the disable migration
2. Ensuring `auth.uid()` returns the correct user ID
3. Testing all policies thoroughly

## Troubleshooting

### Issue: Migrations fail with permission errors

**Cause**: RLS might be enabled on `_prisma_migrations`

**Solution**: 
```sql
-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = '_prisma_migrations';

-- If enabled, disable it (requires superuser)
ALTER TABLE "_prisma_migrations" DISABLE ROW LEVEL SECURITY;
```

### Issue: Users can't access their own data (with NextAuth.js)

**Cause**: RLS policies use `auth.uid()` which returns NULL with NextAuth.js

**Solution**: 
- **RLS is disabled** - this is correct for NextAuth.js
- Verify application-level permissions in `lib/permissions.ts` are working
- Check that API routes are calling permission functions before database queries
- Review error logs for permission check failures

### Issue: Database errors when querying boards/columns/tasks

**Cause**: RLS was enabled but NextAuth.js doesn't provide `auth.uid()`

**Solution**:
- Run migration: `npx prisma migrate deploy`
- This will apply `20251202000000_disable_rls_for_nextauth` which disables RLS
- Verify RLS is disabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('Board', 'Column', 'Task');`

### Issue: Password reset tokens not accessible

**Cause**: RLS policies might be blocking access

**Solution**:
- Verify `PasswordResetToken` RLS policies are applied
- Check that API routes use proper authentication
- Ensure `auth.uid()` matches the `userId` in tokens
