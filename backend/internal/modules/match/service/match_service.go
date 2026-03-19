package service

import (
	"context"

	"kamp/internal/modules/match/model"
	"kamp/internal/modules/match/repository"
)

type MatchService struct {
	repo *repository.MatchRepository
}

func NewMatchService(repo *repository.MatchRepository) *MatchService {
	return &MatchService{repo: repo}
}

func (s *MatchService) CreateMatch(ctx context.Context, m *model.Match) error {
	if m.Status == "" {
		m.Status = "scheduled"
	}
	return s.repo.Create(ctx, m)
}

func (s *MatchService) GetMatches(ctx context.Context) ([]model.Match, error) {
	return s.repo.GetAll(ctx)
}
