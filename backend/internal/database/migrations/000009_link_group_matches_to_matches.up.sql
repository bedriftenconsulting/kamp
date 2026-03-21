ALTER TABLE group_matches
ADD COLUMN IF NOT EXISTS main_match_id UUID REFERENCES matches(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_matches_main_match_id
ON group_matches(main_match_id)
WHERE main_match_id IS NOT NULL;
