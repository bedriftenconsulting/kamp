DROP INDEX IF EXISTS idx_group_matches_main_match_id;

ALTER TABLE group_matches
DROP COLUMN IF EXISTS main_match_id;
