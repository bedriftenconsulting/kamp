package repository

import (
	"context"
	"errors"
	"kamp/internal/modules/auth/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, user *model.User) error {
	query := `
		INSERT INTO users (email, password_hash, role)
		VALUES ($1, $2, $3)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(ctx, query, user.Email, user.PasswordHash, user.Role).
		Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
}

func (r *UserRepository) CreateUmpire(ctx context.Context, user *model.User, tournamentID string) error {
	query := `
		INSERT INTO users (email, password_hash, role, tournament_id)
		VALUES ($1, $2, 'umpire', $3::uuid)
		RETURNING id, tournament_id, created_at, updated_at
	`
	return r.db.QueryRow(ctx, query, user.Email, user.PasswordHash, tournamentID).
		Scan(&user.ID, &user.TournamentID, &user.CreatedAt, &user.UpdatedAt)
}

func (r *UserRepository) CreateDirector(ctx context.Context, user *model.User, tournamentID string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	err = tx.QueryRow(ctx, `
		INSERT INTO users (email, password_hash, role)
		VALUES ($1, $2, 'director')
		RETURNING id, created_at, updated_at
	`, user.Email, user.PasswordHash).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx,
		"UPDATE tournaments SET director_id = $1 WHERE id = $2::uuid",
		user.ID, tournamentID,
	)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	query := `
		SELECT id, email, password_hash, role, COALESCE(first_name, ''), COALESCE(last_name, ''), tournament_id, created_at, updated_at
		FROM users
		WHERE email = $1
	`
	user := &model.User{}
	err := r.db.QueryRow(ctx, query, email).
		Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Role, &user.FirstName, &user.LastName, &user.TournamentID, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (*model.User, error) {
	query := `
		SELECT id, email, password_hash, role, COALESCE(first_name, ''), COALESCE(last_name, ''), tournament_id, created_at, updated_at
		FROM users
		WHERE id = $1
	`
	user := &model.User{}
	err := r.db.QueryRow(ctx, query, id).
		Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Role, &user.FirstName, &user.LastName, &user.TournamentID, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepository) UpdateRole(ctx context.Context, userID, role string) error {
	query := `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`
	result, err := r.db.Exec(ctx, query, role, userID)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return errors.New("user not found")
	}
	return nil
}

func (r *UserRepository) GetAll(ctx context.Context, role string) ([]model.User, error) {
	query := `
		SELECT id, email, role, COALESCE(first_name, ''), COALESCE(last_name, ''), tournament_id, created_at, updated_at
		FROM users
	`
	var args []interface{}
	if role != "" {
		query += " WHERE role = $1"
		args = append(args, role)
	}
	query += " ORDER BY created_at DESC"

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := []model.User{}
	for rows.Next() {
		var u model.User
		err := rows.Scan(&u.ID, &u.Email, &u.Role, &u.FirstName, &u.LastName, &u.TournamentID, &u.CreatedAt, &u.UpdatedAt)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}
