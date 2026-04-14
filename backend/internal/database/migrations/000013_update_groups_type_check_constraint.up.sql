UPDATE groups SET group_type = 'Singles' WHERE group_type NOT IN ('Singles', 'Doubles', 'Mixed Doubles');

ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_tennis_level_check;

ALTER TABLE groups ADD CONSTRAINT groups_group_type_check CHECK (group_type IN ('Singles', 'Doubles', 'Mixed Doubles'));
