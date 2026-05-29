-- Migration: add resolved_at to tickets
-- Run with src/db/init.ts or using the `npm run db:migrate` helper

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Optionally add an index for queries filtering by resolved_at
CREATE INDEX IF NOT EXISTS idx_tickets_resolved_at ON tickets(resolved_at);
