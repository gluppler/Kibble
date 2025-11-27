-- AlterTable: Add archived and archivedAt fields to Board model
-- Add archive functionality for boards

-- Add archived field (default false for existing boards)
ALTER TABLE "Board" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;

-- Add archivedAt field (nullable timestamp)
ALTER TABLE "Board" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

-- Create indexes for archived fields (if they don't exist)
CREATE INDEX IF NOT EXISTS "Board_archived_idx" ON "Board"("archived");
CREATE INDEX IF NOT EXISTS "Board_archivedAt_idx" ON "Board"("archivedAt");
