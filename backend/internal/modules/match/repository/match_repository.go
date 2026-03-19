package repository

import (
	"context"

	"kamp/internal/modules/match/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type MatchRepository struct {
	db *pgxpool.Pool
}

func NewMatchRepository(db *pgxpool.Pool) *MatchRepository {
	return &MatchRepository{db: db}
}

func (r *MatchRepository) Create(ctx context.Context, m *model.Match) error {
	query := `
	INSERT INTO matches (tournament_id, player1_id, player2_id, court_id, round, scheduled_time, status)
	VALUES ($1, $2, $3, $4, $5, $6, $7)
	RETURNING id, created_at
	`

	return r.db.QueryRow(ctx, query,
		m.TournamentID,
		m.Player1ID,
		m.Player2ID,
		m.CourtID,
		m.Round,
		m.ScheduledTime,
		m.Status,
	).Scan(&m.ID, &m.CreatedAt)
}

func (r *MatchRepository) GetAll(ctx context.Context) ([]model.Match, error) {
	query := `
	SELECT 
		m.id,
		m.tournament_id,
		m.player1_id,
		m.player2_id,
		m.court_id,
		m.round,
		m.scheduled_time,
		m.status,
		m.winner_id,
		m.umpire_id,
		m.created_at,
		p1.first_name || ' ' || p1.last_name AS player1_name,
		p2.first_name || ' ' || p2.last_name AS player2_name
	FROM matches m
	LEFT JOIN players p1 ON m.player1_id = p1.id
	LEFT JOIN players p2 ON m.player2_id = p2.id
	ORDER BY m.created_at DESC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var matches []model.Match

	for rows.Next() {
		var m model.Match
		err := rows.Scan(
			&m.ID,
			&m.TournamentID,
			&m.Player1ID,
			&m.Player2ID,
			&m.CourtID,
			&m.Round,
			&m.ScheduledTime,
			&m.Status,
			&m.WinnerID,
			&m.UmpireID,
			&m.CreatedAt,
			&m.Player1Name, // ✅ NEW
			&m.Player2Name, // ✅ NEW
		)
		if err != nil {
			return nil, err
		}
		matches = append(matches, m)
	}

	return matches, nil
}

func (r *MatchRepository) FinishMatch(ctx context.Context, matchID, winnerID string) error {
	query := `
	UPDATE matches
	SET winner_id = $1,
	    status = 'completed',
	    updated_at = NOW()
	WHERE id = $2
	`

	_, err := r.db.Exec(ctx, query, winnerID, matchID)
	return err
}
