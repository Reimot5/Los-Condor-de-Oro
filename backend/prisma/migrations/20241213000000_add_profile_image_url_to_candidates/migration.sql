-- Add profile_image_url column to Candidate table
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "profile_image_url" TEXT;

