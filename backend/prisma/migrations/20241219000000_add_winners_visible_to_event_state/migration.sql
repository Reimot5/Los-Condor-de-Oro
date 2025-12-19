-- Add winners_visible column to EventState table
ALTER TABLE "EventState" ADD COLUMN IF NOT EXISTS "winners_visible" BOOLEAN NOT NULL DEFAULT false;

