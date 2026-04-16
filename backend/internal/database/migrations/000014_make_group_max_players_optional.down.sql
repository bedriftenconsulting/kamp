ALTER TABLE groups ADD CONSTRAINT groups_max_players_check CHECK (max_players > 1);
