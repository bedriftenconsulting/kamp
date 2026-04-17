package repository

// tournament_repository.go
//
// Handles all SQL interactions with the `tournaments` table.
//
// Schema overview:
//   id, name, location, start_date, end_date, status, surface,
//   banner_image, accent_color, created_by, created_at, updated_at
//
// banner_image and accent_color (added in migration 000010) allow each
// tournament to carry its homepage visual settings inside the same row,
// so the frontend never needs a secondary storage mechanism like localStorage.

import (
	"context"
	"log"

	"kamp/internal/modules/tournament/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TournamentRepository struct {
	db *pgxpool.Pool
}

func NewTournamentRepository(db *pgxpool.Pool) *TournamentRepository {
	return &TournamentRepository{db: db}
}

// Create inserts a new tournament row and populates the auto-generated fields
// (id, created_at, updated_at) back onto the passed struct.
func (r *TournamentRepository) Create(ctx context.Context, t *model.Tournament) error {
	query := `
	INSERT INTO tournaments (name, location, start_date, end_date, status, surface, banner_image, accent_color)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRow(ctx, query,
		t.Name,
		t.Location,
		t.StartDate,
		t.EndDate,
		t.Status,
		t.Surface,
		nullIfEmpty(t.BannerImage), // base64 data URL or NULL
		nullIfEmpty(t.AccentColor), // hex colour or NULL
	).Scan(&t.ID, &t.CreatedAt, &t.UpdatedAt)

	if err != nil {
		log.Println("CREATE ERROR:", err)
		return err
	}

	return nil
}

// GetAll returns every tournament ordered newest first, including appearance fields.
func (r *TournamentRepository) GetAll(ctx context.Context) ([]model.Tournament, error) {
	query := `
	SELECT id, name, location, start_date, end_date, status,
	       created_at, updated_at, surface,
	       COALESCE(banner_image, '') AS banner_image,
	       COALESCE(accent_color, '') AS accent_color
	FROM tournaments
	ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		log.Println("QUERY ERROR:", err)
		return nil, err
	}
	defer rows.Close()

	tournaments := make([]model.Tournament, 0)

	for rows.Next() {
		var t model.Tournament
		var surface *string

		err := rows.Scan(
			&t.ID,
			&t.Name,
			&t.Location,
			&t.StartDate,
			&t.EndDate,
			&t.Status,
			&t.CreatedAt,
			&t.UpdatedAt,
			&surface,
			&t.BannerImage, // COALESCE ensures never NULL; assigned directly
			&t.AccentColor, // same
		)

		if err != nil {
			log.Println("SCAN ERROR:", err)
			return nil, err
		}

		if surface != nil {
			t.Surface = *surface
		} else {
			t.Surface = ""
		}

		tournaments = append(tournaments, t)
	}

	if err = rows.Err(); err != nil {
		log.Println("ROWS ERROR:", err)
		return nil, err
	}

	return tournaments, nil
}

// Update persists every editable field including the appearance columns.
func (r *TournamentRepository) Update(ctx context.Context, t *model.Tournament) error {
	query := `
	UPDATE tournaments
	SET name         = $1,
	    location     = $2,
	    start_date   = $3,
	    end_date     = $4,
	    status       = $5,
	    surface      = $6,
	    banner_image = $7,
	    accent_color = $8,
	    updated_at   = CURRENT_TIMESTAMP
	WHERE id = $9
	RETURNING created_at, updated_at
	`

	return r.db.QueryRow(ctx, query,
		t.Name,
		t.Location,
		t.StartDate,
		t.EndDate,
		t.Status,
		t.Surface,
		nullIfEmpty(t.BannerImage),
		nullIfEmpty(t.AccentColor),
		t.ID,
	).Scan(&t.CreatedAt, &t.UpdatedAt)
}

func (r *TournamentRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM tournaments WHERE id = $1`, id)
	return err
}

func (r *TournamentRepository) CleanupOldTournaments(ctx context.Context) error {
	query := `DELETE FROM tournaments WHERE status = 'completed' AND updated_at < NOW() - INTERVAL '7 days'`
	_, err := r.db.Exec(ctx, query)
	return err
}

func (r *TournamentRepository) UpdateExpiredTournaments(ctx context.Context) error {
	query := `UPDATE tournaments SET status = 'completed', updated_at = NOW() WHERE status != 'completed' AND end_date < NOW()`
	_, err := r.db.Exec(ctx, query)
	return err
}

func (r *TournamentRepository) GetRules(ctx context.Context, tournamentID string) (*model.TournamentRules, error) {
	query := `
	SELECT tournament_id::text, scoring_format, max_points, tie_break_trigger, tie_break_max_points, win_by_two, created_at, updated_at
	FROM tournament_rules
	WHERE tournament_id = $1
	`
	var rules model.TournamentRules
	err := r.db.QueryRow(ctx, query, tournamentID).Scan(
		&rules.TournamentID,
		&rules.ScoringFormat,
		&rules.MaxPoints,
		&rules.TieBreakTrigger,
		&rules.TieBreakMaxPoints,
		&rules.WinByTwo,
		&rules.CreatedAt,
		&rules.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &rules, nil
}

func (r *TournamentRepository) UpsertRules(ctx context.Context, rules *model.TournamentRules) error {
	query := `
	INSERT INTO tournament_rules (tournament_id, scoring_format, max_points, tie_break_trigger, tie_break_max_points, win_by_two)
	VALUES ($1, $2, $3, $4, $5, $6)
	ON CONFLICT (tournament_id) DO UPDATE SET
		scoring_format = EXCLUDED.scoring_format,
		max_points = EXCLUDED.max_points,
		tie_break_trigger = EXCLUDED.tie_break_trigger,
		tie_break_max_points = EXCLUDED.tie_break_max_points,
		win_by_two = EXCLUDED.win_by_two,
		updated_at = NOW()
	RETURNING created_at, updated_at
	`
	return r.db.QueryRow(ctx, query,
		rules.TournamentID,
		rules.ScoringFormat,
		rules.MaxPoints,
		rules.TieBreakTrigger,
		rules.TieBreakMaxPoints,
		rules.WinByTwo,
	).Scan(&rules.CreatedAt, &rules.UpdatedAt)
}

// nullIfEmpty converts an empty string to nil so PostgreSQL stores NULL
// instead of an empty string, keeping the column semantics clean.
func nullIfEmpty(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
