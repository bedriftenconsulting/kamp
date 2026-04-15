ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_group_type_check;
ALTER TABLE groups ADD CONSTRAINT groups_tennis_level_check CHECK (group_type IN ('Beginner', 'Intermediate', 'Advanced'));
