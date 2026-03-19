package repository

import (
	"context"

	"kamp/internal/modules/player/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PlayerRepository struct {
	db *pgxpool.Pool
}

func NewPlayerRepository(db *pgxpool.Pool) *PlayerRepository {
	return &PlayerRepository{db: db}
}

func (r *PlayerRepository) Create(ctx context.Context, p *model.Player) error {
	query := `
	INSERT INTO players (first_name, last_name, date_of_birth, nationality, ranking, bio, profile_image_url)
	VALUES ($1, $2, $3, $4, $5, $6, $7)
	RETURNING id, created_at
	`

	return r.db.QueryRow(ctx, query,
		p.FirstName,
		p.LastName,
		p.DateOfBirth,
		p.Nationality,
		p.Ranking,
		p.Bio,
		p.ProfileImageURL,
	).Scan(&p.ID, &p.CreatedAt)
}

func (r *PlayerRepository) GetAll(ctx context.Context) ([]model.Player, error) {
	query := `
	SELECT id, first_name, last_name, date_of_birth, nationality, ranking, bio, profile_image_url, created_at
	FROM players
	ORDER BY ranking ASC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var players []model.Player

	for rows.Next() {
		var p model.Player
		err := rows.Scan(
			&p.ID,
			&p.FirstName,
			&p.LastName,
			&p.DateOfBirth,
			&p.Nationality,
			&p.Ranking,
			&p.Bio,
			&p.ProfileImageURL,
			&p.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		players = append(players, p)
	}

	return players, nil
}
