ALTER TABLE groups
DROP CONSTRAINT IF EXISTS groups_level_gender_designation_key;

ALTER TABLE groups
ADD CONSTRAINT groups_tennis_level_designation_key UNIQUE (tennis_level, designation);

ALTER TABLE groups
DROP CONSTRAINT IF EXISTS groups_gender_check;

ALTER TABLE groups
DROP COLUMN IF EXISTS gender;
