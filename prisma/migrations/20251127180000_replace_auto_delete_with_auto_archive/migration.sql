-- AlterTable: Add archived and archivedAt fields to Task model
-- Replace auto-deletion with auto-archive feature

-- Add archived field (default false for existing tasks)
ALTER TABLE "Task" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;

-- Add archivedAt field (nullable timestamp)
ALTER TABLE "Task" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- Create indexes for archived fields
CREATE INDEX "Task_archived_idx" ON "Task"("archived");
CREATE INDEX "Task_archivedAt_idx" ON "Task"("archivedAt");
