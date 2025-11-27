# Row Level Security (RLS) Configuration Notes

## Overview

This document explains the RLS configuration for Kibble's database tables in Supabase.

## Tables with RLS Enabled

The following tables have Row Level Security enabled with appropriate policies:

1. **User** - Users can only access their own profile
2. **Board** - Users can only access their own boards
3. **Column** - Users can only access columns in their own boards
4. **Task** - Users can only access tasks in their own boards
5. **Account** - Users can only access their own OAuth accounts
6. **Session** - Users can only access their own sessions
7. **VerificationToken** - Authenticated users can read (used by NextAuth.js)
8. **PasswordResetToken** - Users can only access their own reset tokens

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

**Important**: The RLS policies use Supabase Auth functions (`auth.uid()`).

If you're using **NextAuth.js** instead of Supabase Auth:
- RLS policies may not work as expected
- Application-level permissions in `lib/permissions.ts` handle access control
- The API routes enforce permissions before database queries
- RLS acts as a defense-in-depth layer but may not be the primary enforcement

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

RLS policies are defined in:
- `prisma/migrations/20251126000000_add_rls_policies/migration.sql` - Initial RLS setup
- `prisma/migrations/20251201000000_add_password_reset_token_rls/migration.sql` - PasswordResetToken RLS

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

1. **Never disable RLS** on user-owned tables
2. **Never enable RLS** on system tables like `_prisma_migrations`
3. **Test policies** after schema changes
4. **Review policies** when adding new tables
5. **Document exceptions** (like `_prisma_migrations`)

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

### Issue: Users can't access their own data

**Cause**: RLS policies might be too restrictive or using wrong auth function

**Solution**: 
- Verify `auth.uid()` returns the correct user ID
- Check if using NextAuth.js (policies may not work)
- Review application-level permissions in `lib/permissions.ts`

### Issue: Password reset tokens not accessible

**Cause**: RLS policies might be blocking access

**Solution**:
- Verify `PasswordResetToken` RLS policies are applied
- Check that API routes use proper authentication
- Ensure `auth.uid()` matches the `userId` in tokens
