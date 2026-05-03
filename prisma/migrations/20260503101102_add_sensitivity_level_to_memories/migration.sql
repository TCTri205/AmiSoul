-- DropIndex
DROP INDEX "memories_embedding_idx";

-- AlterTable
ALTER TABLE "memories" ADD COLUMN     "sensitivity_level" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "dpe" JSONB;

-- CreateTable
CREATE TABLE "behavioral_baselines" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "typical_active_start" INTEGER NOT NULL DEFAULT 6,
    "typical_active_end" INTEGER NOT NULL DEFAULT 22,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "behavioral_baselines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "behavioral_baselines_user_id_key" ON "behavioral_baselines"("user_id");

-- AddForeignKey
ALTER TABLE "behavioral_baselines" ADD CONSTRAINT "behavioral_baselines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
