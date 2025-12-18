-- Remove unique constraint from winner_candidate_id
-- This allows the same candidate to be winner in multiple categories
DROP INDEX IF EXISTS "Category_winner_candidate_id_key";

-- Add a regular index for better query performance (non-unique)
CREATE INDEX IF NOT EXISTS "Category_winner_candidate_id_idx" ON "Category"("winner_candidate_id");

