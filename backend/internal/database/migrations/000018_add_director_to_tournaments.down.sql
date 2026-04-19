-- Down: Revert director changes
-- 1. Remove director_id column and index
DROP INDEX IF EXISTS idx_tournaments_director_id;
ALTER TABLE tournaments DROP COLUMN IF EXISTS director_id;

-- 2. Update users role check constraint (remove director)
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_role;
ALTER TABLE users ADD CONSTRAINT check_user_role CHECK (role IN ('user', 'umpire', 'admin'));
