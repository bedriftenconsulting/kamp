-- Up: Add tournament_id to users for umpire-to-tournament assignment
ALTER TABLE users ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_tournament_id ON users(tournament_id);
