ALTER TABLE groups
ADD CONSTRAINT groups_level_gender_designation_key UNIQUE (tennis_level, gender, designation);
