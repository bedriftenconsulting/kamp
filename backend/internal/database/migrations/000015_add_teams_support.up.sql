ALTER TABLE players ADD COLUMN is_team BOOLEAN DEFAULT FALSE;

CREATE TABLE team_members (
    team_id UUID REFERENCES players(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    PRIMARY KEY (team_id, player_id)
);
