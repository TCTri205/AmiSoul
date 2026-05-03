-- CreateTable
CREATE TABLE "memories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(768),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "memories_embedding_idx" ON "memories" USING hnsw ("embedding" vector_cosine_ops);
