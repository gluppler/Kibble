-- Migration: Add Row Level Security (RLS) Policies for Supabase
-- This migration enables RLS and creates policies for all tables
-- to ensure users can only access their own data
-- 
-- NOTE: This migration uses Supabase Auth functions (auth.uid())
-- If using NextAuth.js instead of Supabase Auth, these policies may not work as expected.
-- Application-level permissions in lib/permissions.ts handle access control.

-- Enable Row Level Security on all tables (idempotent - safe to run multiple times)
DO $$ 
BEGIN
  -- Enable RLS only if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public' 
    AND t.tablename = 'User'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public' 
    AND t.tablename = 'Board'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE "Board" ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public' 
    AND t.tablename = 'Column'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE "Column" ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public' 
    AND t.tablename = 'Task'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public' 
    AND t.tablename = 'Account'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public' 
    AND t.tablename = 'Session'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public' 
    AND t.tablename = 'VerificationToken'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================
-- USER TABLE POLICIES
-- ============================================

-- Drop policy if exists, then create (idempotent)
DROP POLICY IF EXISTS "Users can view own profile" ON "User";
CREATE POLICY "Users can view own profile"
ON "User"
FOR SELECT
USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can update own profile" ON "User";
CREATE POLICY "Users can update own profile"
ON "User"
FOR UPDATE
USING (auth.uid()::text = id);

-- ============================================
-- BOARD TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own boards" ON "Board";
CREATE POLICY "Users can view own boards"
ON "Board"
FOR SELECT
USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can create own boards" ON "Board";
CREATE POLICY "Users can create own boards"
ON "Board"
FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can update own boards" ON "Board";
CREATE POLICY "Users can update own boards"
ON "Board"
FOR UPDATE
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can delete own boards" ON "Board";
CREATE POLICY "Users can delete own boards"
ON "Board"
FOR DELETE
USING (auth.uid()::text = "userId");

-- ============================================
-- COLUMN TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own columns" ON "Column";
CREATE POLICY "Users can view own columns"
ON "Column"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Board"
    WHERE "Board".id = "Column"."boardId"
    AND "Board"."userId" = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can create columns in own boards" ON "Column";
CREATE POLICY "Users can create columns in own boards"
ON "Column"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Board"
    WHERE "Board".id = "Column"."boardId"
    AND "Board"."userId" = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can update own columns" ON "Column";
CREATE POLICY "Users can update own columns"
ON "Column"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "Board"
    WHERE "Board".id = "Column"."boardId"
    AND "Board"."userId" = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Board"
    WHERE "Board".id = "Column"."boardId"
    AND "Board"."userId" = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can delete own columns" ON "Column";
CREATE POLICY "Users can delete own columns"
ON "Column"
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM "Board"
    WHERE "Board".id = "Column"."boardId"
    AND "Board"."userId" = auth.uid()::text
  )
);

-- ============================================
-- TASK TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own tasks" ON "Task";
CREATE POLICY "Users can view own tasks"
ON "Task"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Column"
    INNER JOIN "Board" ON "Board".id = "Column"."boardId"
    WHERE "Column".id = "Task"."columnId"
    AND "Board"."userId" = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can create tasks in own boards" ON "Task";
CREATE POLICY "Users can create tasks in own boards"
ON "Task"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Column"
    INNER JOIN "Board" ON "Board".id = "Column"."boardId"
    WHERE "Column".id = "Task"."columnId"
    AND "Board"."userId" = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can update own tasks" ON "Task";
CREATE POLICY "Users can update own tasks"
ON "Task"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "Column"
    INNER JOIN "Board" ON "Board".id = "Column"."boardId"
    WHERE "Column".id = "Task"."columnId"
    AND "Board"."userId" = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Column"
    INNER JOIN "Board" ON "Board".id = "Column"."boardId"
    WHERE "Column".id = "Task"."columnId"
    AND "Board"."userId" = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can delete own tasks" ON "Task";
CREATE POLICY "Users can delete own tasks"
ON "Task"
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM "Column"
    INNER JOIN "Board" ON "Board".id = "Column"."boardId"
    WHERE "Column".id = "Task"."columnId"
    AND "Board"."userId" = auth.uid()::text
  )
);

-- ============================================
-- ACCOUNT TABLE POLICIES (NextAuth)
-- ============================================

DROP POLICY IF EXISTS "Users can view own accounts" ON "Account";
CREATE POLICY "Users can view own accounts"
ON "Account"
FOR SELECT
USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can create own accounts" ON "Account";
CREATE POLICY "Users can create own accounts"
ON "Account"
FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can update own accounts" ON "Account";
CREATE POLICY "Users can update own accounts"
ON "Account"
FOR UPDATE
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can delete own accounts" ON "Account";
CREATE POLICY "Users can delete own accounts"
ON "Account"
FOR DELETE
USING (auth.uid()::text = "userId");

-- ============================================
-- SESSION TABLE POLICIES (NextAuth)
-- ============================================

DROP POLICY IF EXISTS "Users can view own sessions" ON "Session";
CREATE POLICY "Users can view own sessions"
ON "Session"
FOR SELECT
USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can create own sessions" ON "Session";
CREATE POLICY "Users can create own sessions"
ON "Session"
FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can update own sessions" ON "Session";
CREATE POLICY "Users can update own sessions"
ON "Session"
FOR UPDATE
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can delete own sessions" ON "Session";
CREATE POLICY "Users can delete own sessions"
ON "Session"
FOR DELETE
USING (auth.uid()::text = "userId");

-- ============================================
-- VERIFICATION TOKEN TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can read verification tokens" ON "VerificationToken";
CREATE POLICY "Authenticated users can read verification tokens"
ON "VerificationToken"
FOR SELECT
USING (auth.role() = 'authenticated');
