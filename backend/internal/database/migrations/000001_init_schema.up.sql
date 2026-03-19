-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- ROLES
-- =========================
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- =========================
-- PLAYERS
-- =========================
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    nationality VARCHAR(100),
    ranking INT,
    bio TEXT,
    profile_image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_players_ranking ON players(ranking);

-- =========================
-- TOURNAMENTS
-- =========================
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- COURTS
-- =========================
CREATE TABLE courts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    surface_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- MATCHES
-- =========================
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    player1_id UUID REFERENCES players(id) ON DELETE SET NULL,
    player2_id UUID REFERENCES players(id) ON DELETE SET NULL,
    court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
    round VARCHAR(50),
    scheduled_time TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    winner_id UUID REFERENCES players(id) ON DELETE SET NULL,
    umpire_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_schedule ON matches(scheduled_time);
CREATE INDEX idx_matches_player1 ON matches(player1_id);
CREATE INDEX idx_matches_player2 ON matches(player2_id);
CREATE INDEX idx_matches_court ON matches(court_id);

-- =========================
-- MATCH SETS
-- =========================
CREATE TABLE match_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    set_number INT NOT NULL,
    player1_games INT DEFAULT 0,
    player2_games INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(match_id, set_number)
);

-- =========================
-- MATCH GAMES
-- =========================
CREATE TABLE match_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id UUID REFERENCES match_sets(id) ON DELETE CASCADE,
    game_number INT NOT NULL,
    player1_points INT DEFAULT 0,
    player2_points INT DEFAULT 0,
    is_tiebreak BOOLEAN DEFAULT FALSE,
    winner_id UUID REFERENCES players(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(set_id, game_number)
);

-- =========================
-- MATCH EVENTS (EVENT SOURCING CORE)
-- =========================
CREATE TABLE match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    set_id UUID REFERENCES match_sets(id) ON DELETE SET NULL,
    game_id UUID REFERENCES match_games(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    point_value VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_match ON match_events(match_id);
CREATE INDEX idx_events_time ON match_events(created_at);

-- =========================
-- MATCH STATE (FAST READ MODEL)
-- =========================
CREATE TABLE match_state (
    match_id UUID PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
    current_set INT DEFAULT 1,
    current_game INT DEFAULT 1,
    player1_sets INT DEFAULT 0,
    player2_sets INT DEFAULT 0,
    player1_games INT DEFAULT 0,
    player2_games INT DEFAULT 0,
    player1_points VARCHAR(10),
    player2_points VARCHAR(10),
    is_tiebreak BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- BRACKETS
-- =========================
CREATE TABLE brackets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    round VARCHAR(50),
    match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
    position INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- PLAYER STATS
-- =========================
CREATE TABLE player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    matches_played INT DEFAULT 0,
    matches_won INT DEFAULT 0,
    aces INT DEFAULT 0,
    double_faults INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- STREAMS
-- =========================
CREATE TABLE streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    stream_url TEXT,
    platform VARCHAR(50),
    is_live BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- NOTIFICATIONS
-- =========================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50),
    message TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);

-- =========================
-- AUDIT LOGS
-- =========================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255),
    entity_type VARCHAR(100),
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- SEED ROLES
-- =========================
INSERT INTO roles (name, description) VALUES
('admin', 'System administrator'),
('player', 'Registered player'),
('viewer', 'General viewer');