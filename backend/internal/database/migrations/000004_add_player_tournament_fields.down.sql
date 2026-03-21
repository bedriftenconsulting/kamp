ALTER TABLE players
  DROP COLUMN IF EXISTS tournament_name,
  DROP COLUMN IF EXISTS tournament_id;
