-- CreateTable
CREATE TABLE "CategoryCandidate" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryCandidate_pkey" PRIMARY KEY ("id")
);

-- Migrate existing candidates data
-- First, create unique display_name constraint by handling duplicates
UPDATE "Candidate" SET "display_name" = "display_name" || '_' || "id" 
WHERE "id" IN (
    SELECT "id" FROM "Candidate" 
    WHERE "display_name" IN (
        SELECT "display_name" FROM "Candidate" 
        GROUP BY "display_name" 
        HAVING COUNT(*) > 1
    )
);

-- Migrate category relationships to CategoryCandidate
INSERT INTO "CategoryCandidate" ("id", "category_id", "candidate_id", "created_at")
SELECT gen_random_uuid()::text, "category_id", "id", "created_at"
FROM "Candidate";

-- Migrate nominations: create candidates from proposed_name if they don't exist
INSERT INTO "Candidate" ("id", "display_name", "is_active", "created_at", "updated_at")
SELECT DISTINCT gen_random_uuid()::text, "proposed_name", true, MIN("created_at"), NOW()
FROM "Nomination"
WHERE "proposed_name" NOT IN (SELECT "display_name" FROM "Candidate")
GROUP BY "proposed_name";

-- Create temporary table for nomination migration
CREATE TEMP TABLE "nomination_migration" AS
SELECT 
    n."id",
    n."category_id",
    c."id" as "candidate_id",
    n."created_at"
FROM "Nomination" n
JOIN "Candidate" c ON c."display_name" = n."proposed_name";

-- Drop old foreign keys
ALTER TABLE "Nomination" DROP CONSTRAINT IF EXISTS "Nomination_category_id_fkey";
ALTER TABLE "Candidate" DROP CONSTRAINT IF EXISTS "Candidate_category_id_fkey";

-- Alter Nomination table
ALTER TABLE "Nomination" DROP COLUMN "proposed_name";
ALTER TABLE "Nomination" ADD COLUMN "candidate_id" TEXT;

-- Update Nomination with candidate_id
UPDATE "Nomination" n
SET "candidate_id" = nm."candidate_id"
FROM "nomination_migration" nm
WHERE n."id" = nm."id";

-- Make candidate_id NOT NULL after update
ALTER TABLE "Nomination" ALTER COLUMN "candidate_id" SET NOT NULL;

-- Alter Candidate table
ALTER TABLE "Candidate" DROP COLUMN "category_id";
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_display_name_key" UNIQUE ("display_name");

-- Add foreign keys
ALTER TABLE "CategoryCandidate" ADD CONSTRAINT "CategoryCandidate_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CategoryCandidate" ADD CONSTRAINT "CategoryCandidate_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Nomination" ADD CONSTRAINT "Nomination_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Nomination" ADD CONSTRAINT "Nomination_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "CategoryCandidate_category_id_candidate_id_key" ON "CategoryCandidate"("category_id", "candidate_id");
CREATE INDEX "CategoryCandidate_category_id_idx" ON "CategoryCandidate"("category_id");
CREATE INDEX "CategoryCandidate_candidate_id_idx" ON "CategoryCandidate"("candidate_id");
CREATE UNIQUE INDEX "Nomination_category_id_candidate_id_key" ON "Nomination"("category_id", "candidate_id");
CREATE INDEX "Nomination_candidate_id_idx" ON "Nomination"("candidate_id");
CREATE INDEX "Candidate_display_name_idx" ON "Candidate"("display_name");

-- Drop temp table
DROP TABLE "nomination_migration";

