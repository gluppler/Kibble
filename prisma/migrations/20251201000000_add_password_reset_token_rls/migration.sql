-- Migration: Add Row Level Security (RLS) for PasswordResetToken table
-- 
-- Security: Password reset tokens are sensitive and must be protected.
-- Users should only be able to access their own reset tokens.
-- 
-- NOTE: This migration uses Supabase Auth functions (auth.uid()).
-- If using NextAuth.js instead of Supabase Auth, application-level
-- permissions in lib/permissions.ts handle access control.
-- 
-- IMPORTANT: The _prisma_migrations table should NOT have RLS enabled.
-- It is Prisma's internal system table and must remain accessible
-- to the database superuser for migrations to work.
-- 
-- SHADOW DATABASE NOTE: This migration references auth.uid() which exists
-- in Supabase but not in Prisma's shadow database. To apply this migration:
-- 1. Use `prisma migrate deploy` (skips shadow database validation)
-- 2. Or apply directly to production database using psql or Supabase SQL editor

-- Check if auth schema exists (for Supabase)
-- If not, this migration will be skipped during shadow database validation
DO $$ 
BEGIN
  -- Only proceed if auth schema exists (Supabase environment)
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    
    -- Enable Row Level Security on PasswordResetToken table (idempotent)
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables t
      JOIN pg_class c ON c.relname = t.tablename
      WHERE t.schemaname = 'public' 
      AND t.tablename = 'PasswordResetToken'
      AND c.relrowsecurity = true
    ) THEN
      ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;
    END IF;

    -- ============================================
    -- PASSWORD RESET TOKEN TABLE POLICIES
    -- ============================================

    -- Policy: Users can only view their own password reset tokens
    -- This prevents users from seeing other users' reset tokens
    DROP POLICY IF EXISTS "Users can view own password reset tokens" ON "PasswordResetToken";
    CREATE POLICY "Users can view own password reset tokens"
    ON "PasswordResetToken"
    FOR SELECT
    USING (auth.uid()::text = "userId");

    -- Policy: Users can only create password reset tokens for themselves
    -- This prevents users from creating reset tokens for other users
    DROP POLICY IF EXISTS "Users can create own password reset tokens" ON "PasswordResetToken";
    CREATE POLICY "Users can create own password reset tokens"
    ON "PasswordResetToken"
    FOR INSERT
    WITH CHECK (auth.uid()::text = "userId");

    -- Policy: Users can only update their own password reset tokens
    -- This allows marking tokens as used after password reset
    DROP POLICY IF EXISTS "Users can update own password reset tokens" ON "PasswordResetToken";
    CREATE POLICY "Users can update own password reset tokens"
    ON "PasswordResetToken"
    FOR UPDATE
    USING (auth.uid()::text = "userId")
    WITH CHECK (auth.uid()::text = "userId");

    -- Policy: Users can only delete their own password reset tokens
    -- This allows cleanup of expired or used tokens
    DROP POLICY IF EXISTS "Users can delete own password reset tokens" ON "PasswordResetToken";
    CREATE POLICY "Users can delete own password reset tokens"
    ON "PasswordResetToken"
    FOR DELETE
    USING (auth.uid()::text = "userId");
    
  ELSE
    -- If auth schema doesn't exist, log a warning but don't fail
    -- This allows the migration to pass shadow database validation
    RAISE NOTICE 'Auth schema not found. RLS policies will be applied when running on Supabase database.';
  END IF;
END $$;

-- ============================================
-- NOTE: _prisma_migrations table
-- ============================================
-- 
-- The _prisma_migrations table is Prisma's internal migration tracking table.
-- It should NOT have RLS enabled because:
-- 1. It's a system table managed by Prisma
-- 2. Only the database superuser/migration runner should access it
-- 3. Enabling RLS would break Prisma migrations
-- 4. It doesn't contain user data - it's metadata about migrations
-- 
-- If you need to restrict access to _prisma_migrations, use PostgreSQL
-- GRANT/REVOKE permissions instead of RLS.
