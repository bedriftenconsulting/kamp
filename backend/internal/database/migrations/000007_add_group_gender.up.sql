ALTER TABLE groups
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) NOT NULL DEFAULT 'Men';

ALTER TABLE groups
DROP CONSTRAINT IF EXISTS groups_gender_check;

ALTER TABLE groups
ADD CONSTRAINT groups_gender_check CHECK (gender IN ('Men', 'Women'));

ALTER TABLE groups
DROP CONSTRAINT IF EXISTS groups_tennis_level_designation_key;

ALTER TABLE groups
ADD CONSTRAINT groups_level_gender_designation_key UNIQUE (tennis_level, gender, designation);
