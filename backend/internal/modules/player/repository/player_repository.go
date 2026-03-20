package repository

import (
	"context"
	"strings"
	"time"

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
	if strings.TrimSpace(p.ID) == "" {
		query := `
		INSERT INTO players (first_name, last_name, date_of_birth, nationality, gender, age, tennis_level, ranking, bio, profile_image_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at, updated_at
		`

		return r.db.QueryRow(ctx, query,
			p.FirstName,
			p.LastName,
			nullableDate(p.DateOfBirth),
			p.Nationality,
			p.Gender,
			p.Age,
			p.TennisLevel,
			p.Ranking,
			p.Bio,
			p.ProfileImageURL,
		).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
	}

	query := `
	INSERT INTO players (id, first_name, last_name, date_of_birth, nationality, gender, age, tennis_level, ranking, bio, profile_image_url)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	RETURNING created_at, updated_at
	`

	return r.db.QueryRow(ctx, query,
		p.ID,
		p.FirstName,
		p.LastName,
		nullableDate(p.DateOfBirth),
		p.Nationality,
		p.Gender,
		p.Age,
		p.TennisLevel,
		p.Ranking,
		p.Bio,
		p.ProfileImageURL,
	).Scan(&p.CreatedAt, &p.UpdatedAt)
}

func (r *PlayerRepository) GetAll(ctx context.Context) ([]model.Player, error) {
	query := `
	SELECT id, first_name, last_name, date_of_birth, nationality, gender, age, tennis_level, ranking, bio, profile_image_url, created_at, updated_at
	FROM players
	ORDER BY ranking ASC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	players := make([]model.Player, 0)

	for rows.Next() {
		var p model.Player
		var dob *time.Time
		err := rows.Scan(
			&p.ID,
			&p.FirstName,
			&p.LastName,
			&dob,
			&p.Nationality,
			&p.Gender,
			&p.Age,
			&p.TennisLevel,
			&p.Ranking,
			&p.Bio,
			&p.ProfileImageURL,
			&p.CreatedAt,
			&p.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		if dob != nil {
			p.DateOfBirth = *dob
		}
		players = append(players, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return players, nil
}

func (r *PlayerRepository) Update(ctx context.Context, p *model.Player) error {
	query := `
	UPDATE players
	SET first_name = $1,
	    last_name = $2,
	    date_of_birth = $3,
	    nationality = $4,
	    gender = $5,
	    age = $6,
	    tennis_level = $7,
	    ranking = $8,
	    bio = $9,
	    profile_image_url = $10,
	    updated_at = CURRENT_TIMESTAMP
	WHERE id = $11
	`

	_, err := r.db.Exec(ctx, query,
		p.FirstName,
		p.LastName,
		nullableDate(p.DateOfBirth),
		p.Nationality,
		p.Gender,
		p.Age,
		p.TennisLevel,
		p.Ranking,
		p.Bio,
		p.ProfileImageURL,
		p.ID,
	)
	return err
}

func (r *PlayerRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM players WHERE id = $1`, id)
	return err
}

func nullableDate(t time.Time) interface{} {
	if t.IsZero() {
		return nil
	}
	return t
}
