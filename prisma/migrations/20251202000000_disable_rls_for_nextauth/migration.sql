-- Migration: Disable Row Level Security (RLS) for NextAuth.js Compatibility
-- 
-- IMPORTANT: This migration disables RLS because Kibble uses NextAuth.js,
-- not Supabase Auth. RLS policies use auth.uid() which returns NULL with NextAuth.js,
-- causing all database queries to fail.
--
-- Security: Application-level permissions in lib/permissions.ts handle all access control.
-- RLS was intended as a defense-in-depth layer but is incompatible with NextAuth.js.
--
-- This migration is idempotent and safe to run multiple times.

-- Disable RLS on all tables (idempotent)
DO $$ 
BEGIN
  -- Disable RLS on User table
  IF EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public' 
    AND t.tablename = 'User'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS disabled on User table';
  END IF;
  
  -- Disable RLS on Board table
  IF EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public' 
    AND t.tablename = 'Board'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE "Board" DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS disabled on Board table';
  END IF;
  
  -- Disable RLS on Column table
  IF EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public' 
    AND t.tablename = 'Column'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE "Column" DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS disabled on Column table';
  END IF;
  
  -- Disable RLS on Task table
  IF EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public' 
    AND t.tablename = 'Task'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE "Task" DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS disabled on Task table';
  END IF;
  
  -- Disable RLS on Account table
  IF EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public' 
    AND t.tablename = 'Account'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE "Account" DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS disabled on Account table';
  END IF;
  
  -- Disable RLS on Session table
  IF EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public' 
    AND t.tablename = 'Session'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE "Session" DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS disabled on Session table';
  END IF;
  
  -- Disable RLS on VerificationToken table
  IF EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public' 
    AND t.tablename = 'VerificationToken'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE "VerificationToken" DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS disabled on VerificationToken table';
  END IF;
  
  -- Disable RLS on PasswordResetToken table
  IF EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public' 
    AND t.tablename = 'PasswordResetToken'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE "PasswordResetToken" DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS disabled on PasswordResetToken table';
  END IF;
  
  RAISE NOTICE 'RLS disabled on all tables for NextAuth.js compatibility';
END $$;

-- Drop all existing RLS policies (they won't work with NextAuth.js anyway)
-- This is safe because we're disabling RLS entirely

DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- Drop policies on User table
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'User') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON "User"', r.policyname);
  END LOOP;
  
  -- Drop policies on Board table
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'Board') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON "Board"', r.policyname);
  END LOOP;
  
  -- Drop policies on Column table
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'Column') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON "Column"', r.policyname);
  END LOOP;
  
  -- Drop policies on Task table
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'Task') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON "Task"', r.policyname);
  END LOOP;
  
  -- Drop policies on Account table
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'Account') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON "Account"', r.policyname);
  END LOOP;
  
  -- Drop policies on Session table
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'Session') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON "Session"', r.policyname);
  END LOOP;
  
  -- Drop policies on VerificationToken table
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'VerificationToken') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON "VerificationToken"', r.policyname);
  END LOOP;
  
  -- Drop policies on PasswordResetToken table
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'PasswordResetToken') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON "PasswordResetToken"', r.policyname);
  END LOOP;
  
  RAISE NOTICE 'All RLS policies dropped';
END $$;
