-- SAKHI Migration 002: Add cycle_day to symptom_entries
-- Run in Supabase SQL Editor after 001_initial_schema.sql

ALTER TABLE public.symptom_entries
  ADD COLUMN IF NOT EXISTS cycle_day SMALLINT
  CHECK (cycle_day IS NULL OR (cycle_day >= 1 AND cycle_day <= 40));

COMMENT ON COLUMN public.symptom_entries.cycle_day
  IS 'Optional: which day of the menstrual cycle this symptom was recorded on (1-40)';
