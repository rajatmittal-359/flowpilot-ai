-- Migration: create ticket_ai_analysis table
-- Run with src/db/init.ts or using the `npm run db:migrate` helper

CREATE TABLE IF NOT EXISTS ticket_ai_analysis (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER UNIQUE NOT NULL,
  summary TEXT,
  suggested_reply TEXT,
  sentiment TEXT,
  urgency TEXT,
  recommended_priority TEXT,
  category TEXT,
  confidence NUMERIC,
  raw_analysis_json JSONB,
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cache_version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_ticket_ai_analysis_analyzed_at ON ticket_ai_analysis(analyzed_at);

CREATE OR REPLACE FUNCTION ticket_ai_analysis_updated_at_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ticket_ai_analysis_updated_at ON ticket_ai_analysis;
CREATE TRIGGER trigger_ticket_ai_analysis_updated_at
BEFORE UPDATE ON ticket_ai_analysis
FOR EACH ROW
EXECUTE FUNCTION ticket_ai_analysis_updated_at_trigger();
