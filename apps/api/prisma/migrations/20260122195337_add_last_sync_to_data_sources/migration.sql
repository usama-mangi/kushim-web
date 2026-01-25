/*
  Warnings:

  - You are about to drop the column `payload` on the `unified_records` table. All the data in the column will be lost.
  - Added the required column `artifact_type` to the `unified_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `author` to the `unified_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `body` to the `unified_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `external_id` to the `unified_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metadata` to the `unified_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source_platform` to the `unified_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `unified_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `unified_records` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "data_sources" ADD COLUMN     "last_sync" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "shadow_links" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "unified_records" DROP COLUMN "payload",
ADD COLUMN     "artifact_type" TEXT NOT NULL,
ADD COLUMN     "author" TEXT NOT NULL,
ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "external_id" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB NOT NULL,
ADD COLUMN     "participants" TEXT[],
ADD COLUMN     "source_platform" TEXT NOT NULL,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "url" TEXT;

-- CreateTable
CREATE TABLE "links" (
    "id" UUID NOT NULL,
    "source_record_id" UUID NOT NULL,
    "target_record_id" UUID NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "relationship_type" TEXT NOT NULL,
    "discovery_method" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "links_source_record_id_target_record_id_key" ON "links"("source_record_id", "target_record_id");

-- CreateIndex
CREATE INDEX "idx_records_platform_type" ON "unified_records"("source_platform", "artifact_type");

-- CreateIndex
CREATE INDEX "idx_records_timestamp" ON "unified_records"("timestamp");

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_source_record_id_fkey" FOREIGN KEY ("source_record_id") REFERENCES "unified_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_target_record_id_fkey" FOREIGN KEY ("target_record_id") REFERENCES "unified_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
