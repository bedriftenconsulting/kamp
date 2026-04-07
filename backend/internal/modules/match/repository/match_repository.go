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
	RETURNING id, created_at, updated_at
	`

	return r.db.QueryRow(ctx, query,
		m.TournamentID,
		m.Player1ID,
		m.Player2ID,
		m.CourtID,
		m.Round,
		m.ScheduledTime,
		m.Status,
	).Scan(&m.ID, &m.CreatedAt, &m.UpdatedAt)
}

func (r *MatchRepository) GetAll(ctx context.Context, tournamentID string) ([]model.Match, error) {
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
		m.updated_at,
		COALESCE(p1.first_name || ' ' || p1.last_name, 'TBD') AS player1_name,
		COALESCE(p2.first_name || ' ' || p2.last_name, 'TBD') AS player2_name,
		COALESCE(pw.first_name || ' ' || pw.last_name, '') AS winner_name,
		COALESCE(gm.player1_score, ms.player1_sets) AS player1_score,
		COALESCE(gm.player2_score, ms.player2_sets) AS player2_score,
		ms.player1_games,
		ms.player2_games,
		COALESCE(ms.player1_points, '0') AS player1_points,
		COALESCE(ms.player2_points, '0') AS player2_points
	FROM matches m
	LEFT JOIN players p1 ON m.player1_id = p1.id
	LEFT JOIN players p2 ON m.player2_id = p2.id
	LEFT JOIN players pw ON m.winner_id = pw.id
	LEFT JOIN group_matches gm ON gm.main_match_id = m.id
	LEFT JOIN match_state ms ON ms.match_id = m.id
	`
	var args []interface{}
	if tournamentID != "" {
		query += ` WHERE m.tournament_id = $1 `
		args = append(args, tournamentID)
	}
	query += ` ORDER BY m.created_at DESC `

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	matches := make([]model.Match, 0)

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
			&m.UpdatedAt,
			&m.Player1Name,
			&m.Player2Name,
			&m.WinnerName,
			&m.Player1Score,
			&m.Player2Score,
			&m.Player1Games,
			&m.Player2Games,
			&m.Player1Points,
			&m.Player2Points,
		)
		if err != nil {
			return nil, err
		}
		matches = append(matches, m)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return matches, nil
}

func (r *MatchRepository) Update(ctx context.Context, m *model.Match) error {
	query := `
	UPDATE matches
	SET tournament_id = $1,
		player1_id = $2,
		player2_id = $3,
		court_id = $4,
		round = $5,
		scheduled_time = $6,
		status = $7,
		updated_at = NOW()
	WHERE id = $8
	`

	_, err := r.db.Exec(ctx, query,
		m.TournamentID,
		m.Player1ID,
		m.Player2ID,
		m.CourtID,
		m.Round,
		m.ScheduledTime,
		m.Status,
		m.ID,
	)
	return err
}

func (r *MatchRepository) Delete(ctx context.Context, matchID string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// If this was generated from a group-stage fixture, reset the group match
	// as unplayed and detach it from this main match.
	if _, err := tx.Exec(ctx, `
		UPDATE group_matches
		SET player1_score = 0,
		    player2_score = 0,
		    winner_id = NULL,
		    status = 'scheduled',
		    main_match_id = NULL,
		    updated_at = CURRENT_TIMESTAMP
		WHERE main_match_id = $1
	`, matchID); err != nil {
		return err
	}

	if _, err := tx.Exec(ctx, `DELETE FROM matches WHERE id = $1`, matchID); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *MatchRepository) Complete(ctx context.Context, matchID string, winnerID *string, p1Sets, p2Sets, p1Games, p2Games int) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		UPDATE matches
		SET winner_id = $1,
			status = 'completed',
			updated_at = NOW()
		WHERE id = $2
	`, winnerID, matchID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
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
		VALUES ($1, $2, $3, $4, $5, '0', '0', NOW())
		ON CONFLICT (match_id)
		DO UPDATE SET
			player1_sets = EXCLUDED.player1_sets,
			player2_sets = EXCLUDED.player2_sets,
			player1_games = EXCLUDED.player1_games,
			player2_games = EXCLUDED.player2_games,
			updated_at = NOW()
	`, matchID, p1Sets, p2Sets, p1Games, p2Games)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *MatchRepository) FinishMatch(ctx context.Context, matchID, winnerID string, p1Sets, p2Sets int) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Update the main matches table
	queryMain := `
	UPDATE matches
	SET winner_id = $1,
	    status = 'completed',
	    updated_at = NOW()
	WHERE id = $2
	`
	if _, err := tx.Exec(ctx, queryMain, winnerID, matchID); err != nil {
		return err
	}

	// Update the group_matches table if this match belongs to a group
	queryGroup := `
	UPDATE group_matches
	SET player1_score = $1,
	    player2_score = $2,
	    winner_id = $3,
	    status = 'completed',
	    updated_at = NOW()
	WHERE main_match_id = $4
	`
	if _, err := tx.Exec(ctx, queryGroup, p1Sets, p2Sets, winnerID, matchID); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// GetPlayerIDs returns the player1_id and player2_id for a given match.
func (r *MatchRepository) GetPlayerIDs(ctx context.Context, matchID string) (string, string, error) {
	query := `SELECT player1_id, player2_id FROM matches WHERE id = $1`

	var p1ID, p2ID string
	err := r.db.QueryRow(ctx, query, matchID).Scan(&p1ID, &p2ID)
	if err != nil {
		return "", "", err
	}
	return p1ID, p2ID, nil
}
