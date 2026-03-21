UPDATE players SET bio = '' WHERE bio IS NULL;
UPDATE players SET profile_image_url = '' WHERE profile_image_url IS NULL;

ALTER TABLE players
  ALTER COLUMN bio SET DEFAULT '',
  ALTER COLUMN profile_image_url SET DEFAULT '';
