-- AlterTable
ALTER TABLE "unified_records" ADD COLUMN "embedding" JSONB;

-- CreateTable
CREATE TABLE "shadow_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_record_id" UUID NOT NULL,
    "target_record_id" UUID NOT NULL,
    "deterministic_score" DOUBLE PRECISION NOT NULL,
    "semantic_score" DOUBLE PRECISION NOT NULL,
    "structural_score" DOUBLE PRECISION NOT NULL,
    "ml_score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shadow_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shadow_links_source_record_id_target_record_id_key" ON "shadow_links"("source_record_id", "target_record_id");

-- CreateIndex
CREATE INDEX "idx_shadow_links_ml_score" ON "shadow_links"("ml_score");

-- CreateIndex
CREATE INDEX "idx_shadow_links_created" ON "shadow_links"("created_at");
