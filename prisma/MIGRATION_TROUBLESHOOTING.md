# Prisma Migration Troubleshooting

## Error: P3006 - Schema "auth" does not exist

### Problem

When running `prisma migrate dev`, you may encounter:
```
Error: P3006
Failed to apply cleanly to the shadow database.
Schema "auth" does not exist
```

### Cause

This error occurs because:
1. The migration references Supabase's `auth.uid()` function
2. Prisma creates a shadow database to validate migrations
3. The shadow database doesn't have Supabase's `auth` schema
4. The migration fails during shadow database validation

### Solutions

#### Solution 1: Use `prisma migrate deploy` (Recommended for Production)

This command skips shadow database validation and applies migrations directly:

```bash
npx prisma migrate deploy
```

**When to use:**
- Production deployments
- When shadow database validation fails
- Direct database migrations

#### Solution 2: Set Shadow Database URL (For Development)

If you want to use `prisma migrate dev`, set the shadow database to the same Supabase database:

1. Add to `.env`:
```env
SHADOW_DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
```

2. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider          = "postgresql"
  url               = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}
```

3. Run migrations:
```bash
npx prisma migrate dev
```

**Note:** Using the same database as shadow database works but is not ideal. It's better to use `migrate deploy` for Supabase.

#### Solution 3: Apply Migration Directly (Manual)

If migrations continue to fail, apply the SQL directly:

1. Open Supabase SQL Editor
2. Copy the contents of `prisma/migrations/20251201000000_add_password_reset_token_rls/migration.sql`
3. Execute the SQL
4. Mark migration as applied:
```bash
npx prisma migrate resolve --applied 20251201000000_add_password_reset_token_rls
```

#### Solution 4: Disable Shadow Database (Not Recommended)

You can disable shadow database validation, but this is not recommended:

```bash
npx prisma migrate dev --skip-seed
```

However, this may cause issues with migration validation.

### Recommended Workflow for Supabase

For Supabase deployments, use this workflow:

1. **Development:**
   ```bash
   # Make schema changes
   npx prisma db push  # Quick development (no migration files)
   ```

2. **Create Migration:**
   ```bash
   # After testing with db push, create proper migration
   npx prisma migrate dev --create-only --name add_password_reset_token_rls
   ```

3. **Production:**
   ```bash
   # Deploy migrations (skips shadow database)
   npx prisma migrate deploy
   ```

### Verification

After applying the migration, verify RLS is enabled:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'PasswordResetToken';

-- Should return: rowsecurity = true

-- List all policies
SELECT * FROM pg_policies 
WHERE tablename = 'PasswordResetToken';

-- Should show 4 policies (SELECT, INSERT, UPDATE, DELETE)
```

### Additional Notes

- The migration is **idempotent** - safe to run multiple times
- The migration checks for `auth` schema existence before applying policies
- If `auth` schema doesn't exist, migration will pass but policies won't be created
- Policies will be created when migration runs on Supabase database

### Related Files

- Migration: `prisma/migrations/20251201000000_add_password_reset_token_rls/migration.sql`
- Documentation: `prisma/RLS_NOTES.md`
- Schema: `prisma/schema.prisma`
