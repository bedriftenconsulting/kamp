package repository

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

func (r *TournamentRepository) Create(ctx context.Context, t *model.Tournament) error {
	query := `
	INSERT INTO tournaments (name, location, start_date, end_date, status, surface)
	VALUES ($1, $2, $3, $4, $5, $6)
	RETURNING id, created_at
	`

	err := r.db.QueryRow(ctx, query,
		t.Name,
		t.Location,
		t.StartDate,
		t.EndDate,
		t.Status,
		t.Surface,
	).Scan(&t.ID, &t.CreatedAt)

	if err != nil {
		log.Println("CREATE ERROR:", err)
		return err
	}

	return nil
}

func (r *TournamentRepository) GetAll(ctx context.Context) ([]model.Tournament, error) {
	query := `
	SELECT id, name, location, start_date, end_date, status, created_at, surface
	FROM tournaments
	ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		log.Println("QUERY ERROR:", err)
		return nil, err
	}
	defer rows.Close()

	var tournaments []model.Tournament

	for rows.Next() {
		var t model.Tournament
		var surface *string // handle NULL safely

		err := rows.Scan(
			&t.ID,
			&t.Name,
			&t.Location,
			&t.StartDate,
			&t.EndDate,
			&t.Status,
			&t.CreatedAt,
			&surface,
		)

		if err != nil {
			log.Println("SCAN ERROR:", err)
			return nil, err
		}

		// Safe assignment
		if surface != nil {
			t.Surface = *surface
		} else {
			t.Surface = "" // or "Unknown"
		}

		tournaments = append(tournaments, t)
	}

	// VERY IMPORTANT
	if err = rows.Err(); err != nil {
		log.Println("ROWS ERROR:", err)
		return nil, err
	}

	return tournaments, nil
}
