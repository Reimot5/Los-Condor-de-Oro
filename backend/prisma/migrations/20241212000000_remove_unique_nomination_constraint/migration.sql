-- Remove unique index from Nomination table
-- This allows multiple users to nominate the same candidate in the same category
DROP INDEX IF EXISTS "Nomination_category_id_candidate_id_key";

-- Add a composite index for better query performance (non-unique)
CREATE INDEX IF NOT EXISTS "Nomination_category_id_candidate_id_idx" ON "Nomination"("category_id", "candidate_id");

