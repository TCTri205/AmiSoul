-- AlterTable
ALTER TABLE "memories" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;
