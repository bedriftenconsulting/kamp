package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"kamp/internal/modules/group/model"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type GroupRepository struct {
	db *pgxpool.Pool
}

func NewGroupRepository(db *pgxpool.Pool) *GroupRepository {
	return &GroupRepository{db: db}
}

func (r *GroupRepository) CreateGroup(ctx context.Context, g *model.Group) error {
	query := `
	INSERT INTO groups (designation, gender, tennis_level, max_players, qualifiers_count)
	VALUES ($1, $2, $3, $4, $5)
	RETURNING id, is_locked, created_at, updated_at
	`

	return r.db.QueryRow(ctx, query,
		g.Designation,
		g.Gender,
		g.TennisLevel,
		g.MaxPlayers,
		g.QualifiersCount,
	).Scan(&g.ID, &g.IsLocked, &g.CreatedAt, &g.UpdatedAt)
}

func (r *GroupRepository) ListGroups(ctx context.Context) ([]model.Group, error) {
	query := `
	SELECT g.id, g.designation, g.gender, g.tennis_level, g.max_players, g.qualifiers_count, g.is_locked,
	       COALESCE(gp.players_count, 0) AS players_count,
	       CASE
	         WHEN g.is_locked = FALSE THEN 'open'
	         WHEN COALESCE(gm.total_matches, 0) = 0 THEN 'locked'
	         WHEN COALESCE(gm.completed_matches, 0) = COALESCE(gm.total_matches, 0) THEN 'completed'
	         ELSE 'locked'
	       END AS status,
	       g.created_at, g.updated_at
	FROM groups g
	LEFT JOIN (
		SELECT group_id, COUNT(*) AS players_count
		FROM group_players
		GROUP BY group_id
	) gp ON gp.group_id = g.id
	LEFT JOIN (
		SELECT
			group_id,
			COUNT(*) AS total_matches,
			COUNT(*) FILTER (WHERE status = 'completed') AS completed_matches
		FROM group_matches
		GROUP BY group_id
	) gm ON gm.group_id = g.id
	ORDER BY g.tennis_level, g.gender, g.designation
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	groups := make([]model.Group, 0)
	for rows.Next() {
		var g model.Group
		if err := rows.Scan(
			&g.ID,
			&g.Designation,
			&g.Gender,
			&g.TennisLevel,
			&g.MaxPlayers,
			&g.QualifiersCount,
			&g.IsLocked,
			&g.PlayersCount,
			&g.Status,
			&g.CreatedAt,
			&g.UpdatedAt,
		); err != nil {
			return nil, err
		}
		groups = append(groups, g)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return groups, nil
}

func (r *GroupRepository) GetGroupByID(ctx context.Context, groupID string) (*model.Group, error) {
	query := `
	SELECT g.id, g.designation, g.gender, g.tennis_level, g.max_players, g.qualifiers_count, g.is_locked,
	       COALESCE(gp.players_count, 0) AS players_count,
	       CASE
	         WHEN g.is_locked = FALSE THEN 'open'
	         WHEN COALESCE(gm.total_matches, 0) = 0 THEN 'locked'
	         WHEN COALESCE(gm.completed_matches, 0) = COALESCE(gm.total_matches, 0) THEN 'completed'
	         ELSE 'locked'
	       END AS status,
	       g.created_at, g.updated_at
	FROM groups g
	LEFT JOIN (
		SELECT group_id, COUNT(*) AS players_count
		FROM group_players
		GROUP BY group_id
	) gp ON gp.group_id = g.id
	LEFT JOIN (
		SELECT
			group_id,
			COUNT(*) AS total_matches,
			COUNT(*) FILTER (WHERE status = 'completed') AS completed_matches
		FROM group_matches
		GROUP BY group_id
	) gm ON gm.group_id = g.id
	WHERE g.id = $1
	`

	var g model.Group
	if err := r.db.QueryRow(ctx, query, groupID).Scan(
		&g.ID,
		&g.Designation,
		&g.Gender,
		&g.TennisLevel,
		&g.MaxPlayers,
		&g.QualifiersCount,
		&g.IsLocked,
		&g.PlayersCount,
		&g.Status,
		&g.CreatedAt,
		&g.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return &g, nil
}

func (r *GroupRepository) SetGroupPlayers(ctx context.Context, groupID string, playerIDs []string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM group_players WHERE group_id = $1`, groupID); err != nil {
		return err
	}

	for _, playerID := range playerIDs {
		if _, err := tx.Exec(ctx,
			`INSERT INTO group_players (group_id, player_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
			groupID, playerID,
		); err != nil {
			return err
		}
	}

	if _, err := tx.Exec(ctx, `UPDATE groups SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`, groupID); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *GroupRepository) ValidatePlayersLevelAndGender(ctx context.Context, playerIDs []string, expectedLevel, expectedGender string) error {
	if len(playerIDs) == 0 {
		return nil
	}

	query := `SELECT id, COALESCE(tennis_level, ''), COALESCE(gender, '') FROM players WHERE id = ANY($1)`
	rows, err := r.db.Query(ctx, query, playerIDs)
	if err != nil {
		return err
	}
	defer rows.Close()

	seen := map[string]bool{}
	for rows.Next() {
		var id, level, gender string
		if err := rows.Scan(&id, &level, &gender); err != nil {
			return err
		}
		seen[id] = true
		if !strings.EqualFold(strings.TrimSpace(level), strings.TrimSpace(expectedLevel)) {
			return fmt.Errorf("player %s has tennis_level %q, expected %q", id, level, expectedLevel)
		}
		if !strings.EqualFold(strings.TrimSpace(gender), strings.TrimSpace(expectedGender)) {
			return fmt.Errorf("player %s has gender %q, expected %q", id, gender, expectedGender)
		}
	}

	if err := rows.Err(); err != nil {
		return err
	}

	for _, id := range playerIDs {
		if !seen[id] {
			return fmt.Errorf("player %s not found", id)
		}
	}

	return nil
}

func (r *GroupRepository) LockGroup(ctx context.Context, groupID string) error {
	_, err := r.db.Exec(ctx, `UPDATE groups SET is_locked = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, groupID)
	return err
}

func (r *GroupRepository) GetGroupPlayerIDs(ctx context.Context, groupID string) ([]string, error) {
	rows, err := r.db.Query(ctx, `SELECT player_id::text FROM group_players WHERE group_id = $1 ORDER BY player_id`, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	ids := make([]string, 0)
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return ids, nil
}

func (r *GroupRepository) ClearGroupMatches(ctx context.Context, groupID string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM group_matches WHERE group_id = $1`, groupID)
	return err
}

func (r *GroupRepository) CreateGroupMatch(ctx context.Context, groupID, p1ID, p2ID string, mainMatchID *string) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO group_matches (group_id, player1_id, player2_id, main_match_id)
		VALUES ($1, $2, $3, $4)
	`, groupID, p1ID, p2ID, nullIfEmptyPtr(mainMatchID))
	return err
}

func (r *GroupRepository) CreateMainMatchFromGroup(ctx context.Context, group *model.Group, p1ID, p2ID string) (*string, error) {
	round := fmt.Sprintf("Group %s %s %s", group.Gender, group.TennisLevel, group.Designation)
	var id string
	err := r.db.QueryRow(ctx, `
		INSERT INTO matches (player1_id, player2_id, round, status)
		VALUES ($1, $2, $3, 'scheduled')
		RETURNING id::text
	`, p1ID, p2ID, round).Scan(&id)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func (r *GroupRepository) GetGroupMatches(ctx context.Context, groupID string) ([]model.GroupMatch, error) {
	query := `
	SELECT gm.id, gm.group_id, gm.player1_id::text, gm.player2_id::text,
	       COALESCE(p1.first_name || ' ' || p1.last_name, 'TBD') AS player1_name,
	       COALESCE(p2.first_name || ' ' || p2.last_name, 'TBD') AS player2_name,
	       gm.player1_score, gm.player2_score, gm.winner_id::text, gm.status, gm.created_at, gm.updated_at
	FROM group_matches gm
	LEFT JOIN players p1 ON p1.id = gm.player1_id
	LEFT JOIN players p2 ON p2.id = gm.player2_id
	WHERE gm.group_id = $1
	ORDER BY gm.created_at ASC
	`

	rows, err := r.db.Query(ctx, query, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	matches := make([]model.GroupMatch, 0)
	for rows.Next() {
		var m model.GroupMatch
		var winnerID *string
		if err := rows.Scan(
			&m.ID,
			&m.GroupID,
			&m.Player1ID,
			&m.Player2ID,
			&m.Player1Name,
			&m.Player2Name,
			&m.Player1Score,
			&m.Player2Score,
			&winnerID,
			&m.Status,
			&m.CreatedAt,
			&m.UpdatedAt,
		); err != nil {
			return nil, err
		}
		m.WinnerID = winnerID
		matches = append(matches, m)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return matches, nil
}

func (r *GroupRepository) SaveMatchResult(ctx context.Context, groupID, matchID string, p1Score, p2Score int) error {
	var winnerID *string
	if p1Score > p2Score {
		var id string
		if err := r.db.QueryRow(ctx, `SELECT player1_id::text FROM group_matches WHERE id = $1 AND group_id = $2`, matchID, groupID).Scan(&id); err != nil {
			return err
		}
		winnerID = &id
	} else if p2Score > p1Score {
		var id string
		if err := r.db.QueryRow(ctx, `SELECT player2_id::text FROM group_matches WHERE id = $1 AND group_id = $2`, matchID, groupID).Scan(&id); err != nil {
			return err
		}
		winnerID = &id
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var mainMatchID string
	err = tx.QueryRow(ctx, `
		SELECT COALESCE(main_match_id::text, '')
		FROM group_matches
		WHERE id = $1 AND group_id = $2
	`, matchID, groupID).Scan(&mainMatchID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return err
	}

	_, err = tx.Exec(ctx, `
		UPDATE group_matches
		SET player1_score = $1,
		    player2_score = $2,
		    winner_id = $3,
		    status = 'completed',
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $4 AND group_id = $5
	`, p1Score, p2Score, nullIfEmptyPtr(winnerID), matchID, groupID)
	if err != nil {
		return err
	}

	if strings.TrimSpace(mainMatchID) != "" {
		_, err = tx.Exec(ctx, `
			UPDATE matches
			SET winner_id = $1,
			    status = 'completed',
			    updated_at = NOW()
			WHERE id = $2
		`, nullIfEmptyPtr(winnerID), mainMatchID)
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
			VALUES ($1, 0, 0, $2, $3, '0', '0', NOW())
			ON CONFLICT (match_id)
			DO UPDATE SET
				player1_games = EXCLUDED.player1_games,
				player2_games = EXCLUDED.player2_games,
				updated_at = NOW()
		`, mainMatchID, p1Score, p2Score)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *GroupRepository) GetStandings(ctx context.Context, groupID string, qualifiers int) ([]model.GroupStanding, error) {
	query := `
	SELECT *
	FROM (
		SELECT
			p.id::text AS player_id,
			COALESCE(p.first_name || ' ' || p.last_name, 'TBD') AS player_name,
			COALESCE(SUM(CASE WHEN gm.status = 'completed' AND gm.winner_id = p.id THEN 1 ELSE 0 END), 0) AS wins,
			COALESCE(SUM(CASE WHEN gm.status = 'completed' AND gm.winner_id IS NOT NULL AND gm.winner_id <> p.id THEN 1 ELSE 0 END), 0) AS losses,
			COALESCE(SUM(CASE WHEN gm.status = 'completed' AND gm.player1_id = p.id THEN gm.player1_score WHEN gm.status = 'completed' AND gm.player2_id = p.id THEN gm.player2_score ELSE 0 END), 0) AS score_for,
			COALESCE(SUM(CASE WHEN gm.status = 'completed' AND gm.player1_id = p.id THEN gm.player2_score WHEN gm.status = 'completed' AND gm.player2_id = p.id THEN gm.player1_score ELSE 0 END), 0) AS score_against
		FROM group_players gp
		JOIN players p ON p.id = gp.player_id
		LEFT JOIN group_matches gm ON gm.group_id = gp.group_id AND (gm.player1_id = p.id OR gm.player2_id = p.id)
		WHERE gp.group_id = $1
		GROUP BY p.id, p.first_name, p.last_name
	) s
	ORDER BY s.wins DESC, (s.score_for - s.score_against) DESC, s.score_for DESC, s.player_name ASC
	`

	rows, err := r.db.Query(ctx, query, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	standings := make([]model.GroupStanding, 0)
	rank := 1
	for rows.Next() {
		var s model.GroupStanding
		if err := rows.Scan(&s.PlayerID, &s.PlayerName, &s.Wins, &s.Losses, &s.ScoreFor, &s.ScoreAgainst); err != nil {
			return nil, err
		}
		s.ScoreDiff = s.ScoreFor - s.ScoreAgainst
		// Group scoring rule: 15 points per win.
		s.Points = s.Wins * 15
		s.Rank = rank
		s.IsQualified = rank <= qualifiers
		standings = append(standings, s)
		rank++
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return standings, nil
}

func nullIfEmptyPtr(v *string) interface{} {
	if v == nil || strings.TrimSpace(*v) == "" {
		return nil
	}
	return *v
}
