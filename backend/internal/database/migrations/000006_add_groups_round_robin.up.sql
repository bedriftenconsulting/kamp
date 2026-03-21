CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designation VARCHAR(10) NOT NULL,
    tennis_level VARCHAR(20) NOT NULL CHECK (tennis_level IN ('Beginner', 'Intermediate', 'Advanced')),
    max_players INT NOT NULL CHECK (max_players > 1),
    qualifiers_count INT NOT NULL CHECK (qualifiers_count > 0),
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tennis_level, designation)
);

CREATE TABLE IF NOT EXISTS group_players (
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, player_id)
);

CREATE TABLE IF NOT EXISTS group_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    player1_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    player2_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    player1_score INT NOT NULL DEFAULT 0,
    player2_score INT NOT NULL DEFAULT 0,
    winner_id UUID REFERENCES players(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_group_players_group ON group_players(group_id);
CREATE INDEX IF NOT EXISTS idx_group_matches_group ON group_matches(group_id);
