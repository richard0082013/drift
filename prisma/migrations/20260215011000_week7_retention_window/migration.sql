ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "purgeAfter" TIMESTAMP(3);
CREATE INDEX "User_deletedAt_purgeAfter_idx" ON "User"("deletedAt", "purgeAfter");
