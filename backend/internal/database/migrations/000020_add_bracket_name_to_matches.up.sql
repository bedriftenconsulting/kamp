ALTER TABLE matches ADD COLUMN IF NOT EXISTS bracket_name VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_matches_bracket_name ON matches(tournament_id, bracket_name) WHERE bracket_name IS NOT NULL;
