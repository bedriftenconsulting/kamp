ALTER TABLE matches ADD COLUMN next_match_id UUID REFERENCES matches(id) ON DELETE SET NULL;
ALTER TABLE matches ADD COLUMN bracket_position INT;
