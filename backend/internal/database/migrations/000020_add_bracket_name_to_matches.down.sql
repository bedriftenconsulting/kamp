DROP INDEX IF EXISTS idx_matches_bracket_name;
ALTER TABLE matches DROP COLUMN IF EXISTS bracket_name;
