-- Add composite indexes for performance optimization
-- These indexes optimize common query patterns in Kibble

-- Composite index for user's non-archived boards (common query pattern)
CREATE INDEX IF NOT EXISTS "Board_userId_archived_idx" ON "Board"("userId", "archived");

-- Composite indexes for task queries
-- Optimizes: tasks in column excluding archived
CREATE INDEX IF NOT EXISTS "Task_columnId_archived_idx" ON "Task"("columnId", "archived");

-- Optimizes: archived tasks ordered by date
CREATE INDEX IF NOT EXISTS "Task_archived_archivedAt_idx" ON "Task"("archived", "archivedAt");

-- Optimizes: non-locked, non-archived tasks (common for active board view)
CREATE INDEX IF NOT EXISTS "Task_locked_archived_idx" ON "Task"("locked", "archived");
