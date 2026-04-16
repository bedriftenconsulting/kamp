ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_max_players_check;
ALTER TABLE groups ALTER COLUMN max_players SET DEFAULT 0;
