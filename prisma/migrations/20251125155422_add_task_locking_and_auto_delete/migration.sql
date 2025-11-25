-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "locked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "movedToDoneAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Task_movedToDoneAt_idx" ON "Task"("movedToDoneAt");

-- CreateIndex
CREATE INDEX "Task_locked_idx" ON "Task"("locked");
