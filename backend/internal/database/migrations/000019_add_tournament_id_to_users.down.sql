-- Down
DROP INDEX IF EXISTS idx_users_tournament_id;
ALTER TABLE users DROP COLUMN IF EXISTS tournament_id;
