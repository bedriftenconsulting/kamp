-- Down: Revert simplification (Note: roles table data would be lost)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

INSERT INTO roles (name, description) VALUES
('admin', 'System administrator'),
('player', 'Registered player'),
('viewer', 'General viewer');

ALTER TABLE users ADD COLUMN role_id UUID REFERENCES roles(id) ON DELETE SET NULL;
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_role;
ALTER TABLE users DROP COLUMN IF EXISTS role;
