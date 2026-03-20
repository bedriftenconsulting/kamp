package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ScoringRepository struct {
	db *pgxpool.Pool
}

func NewScoringRepository(db *pgxpool.Pool) *ScoringRepository {
	return &ScoringRepository{db: db}
}

// Insert event
func (r *ScoringRepository) CreateEvent(ctx context.Context,
	matchID, eventType string, playerID *string, point string,
) error {

	query := `
	INSERT INTO match_events (match_id, event_type, player_id, point_value)
	VALUES ($1, $2, $3, $4)
	`

	_, err := r.db.Exec(ctx, query, matchID, eventType, playerID, point)
	return err
}

// Get match state
func (r *ScoringRepository) GetMatchState(ctx context.Context, matchID string) (map[string]interface{}, error) {
	query := `
	SELECT
		COALESCE(player1_points, '0'),
		COALESCE(player2_points, '0'),
		player1_games,
		player2_games,
		player1_sets,
		player2_sets
	FROM match_state
	WHERE match_id = $1
	`

	row := r.db.QueryRow(ctx, query, matchID)

	var p1Points, p2Points string
	var p1Games, p2Games int
	var p1Sets, p2Sets int

	err := row.Scan(&p1Points, &p2Points, &p1Games, &p2Games, &p1Sets, &p2Sets)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return map[string]interface{}{
				"player1_points": "0",
				"player2_points": "0",
				"player1_games":  0,
				"player2_games":  0,
				"player1_sets":   0,
				"player2_sets":   0,
			}, nil
		}
		return nil, err
	}

	return map[string]interface{}{
		"player1_points": p1Points,
		"player2_points": p2Points,
		"player1_games":  p1Games,
		"player2_games":  p2Games,
		"player1_sets":   p1Sets,
		"player2_sets":   p2Sets,
	}, nil
}

func (r *ScoringRepository) EnsureMatchState(ctx context.Context, matchID string) error {
	query := `
	INSERT INTO match_state (
		match_id,
		player1_sets,
		player2_sets,
		player1_games,
		player2_games,
		player1_points,
		player2_points,
		updated_at
	)
	VALUES ($1, 0, 0, 0, 0, '0', '0', NOW())
	ON CONFLICT (match_id) DO NOTHING
	`

	_, err := r.db.Exec(ctx, query, matchID)
	return err
}

func (r *ScoringRepository) UpdatePoints(ctx context.Context, matchID, p1, p2 string) error {
	query := `
	UPDATE match_state
	SET player1_points = $1,
	    player2_points = $2,
	    updated_at = NOW()
	WHERE match_id = $3
	`

	_, err := r.db.Exec(ctx, query, p1, p2, matchID)
	return err
}

func (r *ScoringRepository) UpdateFullState(
	ctx context.Context,
	matchID string,
	p1Points, p2Points string,
	p1Games, p2Games int,
	p1Sets, p2Sets int,
) error {

	query := `
	UPDATE match_state
	SET player1_points = $1,
	    player2_points = $2,
	    player1_games = $3,
	    player2_games = $4,
	    player1_sets = $5,
	    player2_sets = $6,
	    updated_at = NOW()
	WHERE match_id = $7
	`

	_, err := r.db.Exec(ctx, query,
		p1Points, p2Points,
		p1Games, p2Games,
		p1Sets, p2Sets,
		matchID,
	)

	return err
}
