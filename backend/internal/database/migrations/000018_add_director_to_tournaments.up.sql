-- Up: Add director role and director_id column
-- 1. Update users role check constraint to include 'director'
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_role;
ALTER TABLE users ADD CONSTRAINT check_user_role CHECK (role IN ('user', 'umpire', 'admin', 'director'));

-- 2. Add director_id to tournaments to assign specific managers
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS director_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 3. Add index for faster lookups of assigned tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_director_id ON tournaments(director_id);
