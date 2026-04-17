CREATE TABLE tournament_rules (
    tournament_id UUID PRIMARY KEY REFERENCES tournaments(id) ON DELETE CASCADE,
    scoring_format VARCHAR(50) DEFAULT 'tennis',
    max_points INT DEFAULT 11,
    tie_break_trigger INT DEFAULT 10,
    tie_break_max_points INT DEFAULT 5,
    win_by_two BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
