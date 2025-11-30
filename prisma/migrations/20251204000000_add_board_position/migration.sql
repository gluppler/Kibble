-- AlterTable
ALTER TABLE "Board" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Board_position_idx" ON "Board"("position");

-- CreateIndex
CREATE INDEX "Board_userId_archived_position_idx" ON "Board"("userId", "archived", "position");
