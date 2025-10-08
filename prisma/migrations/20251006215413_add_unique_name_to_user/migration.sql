-- AlterTable
ALTER TABLE "users" ADD COLUMN     "uniqueName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_uniqueName_key" ON "users"("uniqueName");
