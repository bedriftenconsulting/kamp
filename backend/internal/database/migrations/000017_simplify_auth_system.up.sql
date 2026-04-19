-- Up: Simplify auth system to use string-based roles as requested
ALTER TABLE users DROP COLUMN IF EXISTS role_id;
DROP TABLE IF EXISTS roles CASCADE;

-- Ensure role column exists with proper constraint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
    END IF;
END $$;

ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_role;
ALTER TABLE users ADD CONSTRAINT check_user_role CHECK (role IN ('user', 'umpire', 'admin'));

-- Ensure password_hash exists (it should from 000001)
-- Ensure email is unique (it should from 000001)
