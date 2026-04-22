package service

import (
	"context"
	"errors"
	"kamp/internal/modules/auth/model"
	"kamp/internal/modules/auth/repository"
	"kamp/internal/modules/auth/utils"

	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	repo      *repository.UserRepository
	jwtSecret string
}

func NewAuthService(repo *repository.UserRepository, jwtSecret string) *AuthService {
	return &AuthService{
		repo:      repo,
		jwtSecret: jwtSecret,
	}
}

func (s *AuthService) Register(ctx context.Context, req model.RegisterRequest) (*model.User, error) {
	existing, _ := s.repo.GetByEmail(ctx, req.Email)
	if existing != nil {
		return nil, errors.New("user already exists")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &model.User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Role:         "user",
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) CreateUmpire(ctx context.Context, req model.CreateUmpireRequest) (*model.User, error) {
	existing, _ := s.repo.GetByEmail(ctx, req.Email)
	if existing != nil {
		return nil, errors.New("email already in use")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &model.User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Role:         "umpire",
	}

	if err := s.repo.CreateUmpire(ctx, user, req.TournamentID); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) CreateDirector(ctx context.Context, req model.CreateDirectorRequest) (*model.User, error) {
	existing, _ := s.repo.GetByEmail(ctx, req.Email)
	if existing != nil {
		return nil, errors.New("email already in use")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &model.User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Role:         "director",
	}

	if err := s.repo.CreateDirector(ctx, user, req.TournamentID); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) Login(ctx context.Context, req model.LoginRequest) (*model.LoginResponse, error) {
	user, err := s.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	token, err := utils.GenerateToken(user.ID, user.Role, s.jwtSecret)
	if err != nil {
		return nil, err
	}

	return &model.LoginResponse{
		Token: token,
		User:  *user,
	}, nil
}

func (s *AuthService) GetProfile(ctx context.Context, userID string) (*model.User, error) {
	return s.repo.GetByID(ctx, userID)
}

func (s *AuthService) UpdateUserRole(ctx context.Context, userID, role string) error {
	if role != "user" && role != "umpire" && role != "admin" && role != "director" {
		return errors.New("invalid role")
	}
	return s.repo.UpdateRole(ctx, userID, role)
}

func (s *AuthService) DeleteUser(ctx context.Context, userID string) error {
	return s.repo.Delete(ctx, userID)
}

func (s *AuthService) ListUsers(ctx context.Context, role string) ([]model.User, error) {
	return s.repo.GetAll(ctx, role)
}
