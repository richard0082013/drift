ALTER TABLE "User" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "purgeAfter" DATETIME;
CREATE INDEX "User_deletedAt_purgeAfter_idx" ON "User"("deletedAt", "purgeAfter");
