-- Migration: Add Row Level Security (RLS) Policies for Supabase
-- This migration enables RLS and creates policies for all tables
-- to ensure users can only access their own data

-- Enable Row Level Security on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Board" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Column" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER TABLE POLICIES
-- ============================================

-- Users can only view their own user record
CREATE POLICY "Users can view own profile"
ON "User"
FOR SELECT
USING (auth.uid()::text = id);

-- Users can update their own user record
CREATE POLICY "Users can update own profile"
ON "User"
FOR UPDATE
USING (auth.uid()::text = id);

-- ============================================
-- BOARD TABLE POLICIES
-- ============================================

-- Users can only view their own boards
CREATE POLICY "Users can view own boards"
ON "Board"
FOR SELECT
USING (auth.uid()::text = "userId");

-- Users can only create boards for themselves
CREATE POLICY "Users can create own boards"
ON "Board"
FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

-- Users can only update their own boards
CREATE POLICY "Users can update own boards"
ON "Board"
FOR UPDATE
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

-- Users can only delete their own boards
CREATE POLICY "Users can delete own boards"
ON "Board"
FOR DELETE
USING (auth.uid()::text = "userId");

-- ============================================
-- COLUMN TABLE POLICIES
-- ============================================

-- Users can only view columns from their own boards
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

-- Users can only create columns in their own boards
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

-- Users can only update columns in their own boards
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

-- Users can only delete columns from their own boards
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

-- Users can only view tasks from their own boards
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

-- Users can only create tasks in their own boards
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

-- Users can only update tasks in their own boards
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

-- Users can only delete tasks from their own boards
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

-- Users can only view their own accounts
CREATE POLICY "Users can view own accounts"
ON "Account"
FOR SELECT
USING (auth.uid()::text = "userId");

-- Users can only create accounts for themselves
CREATE POLICY "Users can create own accounts"
ON "Account"
FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

-- Users can only update their own accounts
CREATE POLICY "Users can update own accounts"
ON "Account"
FOR UPDATE
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

-- Users can only delete their own accounts
CREATE POLICY "Users can delete own accounts"
ON "Account"
FOR DELETE
USING (auth.uid()::text = "userId");

-- ============================================
-- SESSION TABLE POLICIES (NextAuth)
-- ============================================

-- Users can only view their own sessions
CREATE POLICY "Users can view own sessions"
ON "Session"
FOR SELECT
USING (auth.uid()::text = "userId");

-- Users can only create sessions for themselves
CREATE POLICY "Users can create own sessions"
ON "Session"
FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

-- Users can only update their own sessions
CREATE POLICY "Users can update own sessions"
ON "Session"
FOR UPDATE
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

-- Users can only delete their own sessions
CREATE POLICY "Users can delete own sessions"
ON "Session"
FOR DELETE
USING (auth.uid()::text = "userId");

-- ============================================
-- VERIFICATION TOKEN TABLE POLICIES
-- ============================================

-- Verification tokens are managed by NextAuth
-- Only the system can access these (no user-specific access needed)
-- We'll use a service role policy or disable RLS for this table
-- For security, we'll allow only system access

-- Note: VerificationToken doesn't have a userId field
-- This table is typically accessed by the auth system only
-- We can either disable RLS or create a service role policy
-- For now, we'll allow authenticated users to read (for email verification)
-- but restrict writes to service role only

-- Allow reads for authenticated users (needed for email verification)
CREATE POLICY "Authenticated users can read verification tokens"
ON "VerificationToken"
FOR SELECT
USING (auth.role() = 'authenticated');

-- Only service role can create/update/delete verification tokens
-- This is handled by NextAuth service role in practice
-- For Supabase, you would use service_role key for these operations
