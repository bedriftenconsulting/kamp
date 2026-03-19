package service

import (
	"context"

	"kamp/internal/modules/tournament/model"
	"kamp/internal/modules/tournament/repository"
)

type TournamentService struct {
	repo *repository.TournamentRepository
}

func NewTournamentService(repo *repository.TournamentRepository) *TournamentService {
	return &TournamentService{repo: repo}
}

func (s *TournamentService) CreateTournament(ctx context.Context, t *model.Tournament) error {
	if t.Status == "" {
		t.Status = "scheduled"
	}
	return s.repo.Create(ctx, t)
}

func (s *TournamentService) GetTournaments(ctx context.Context) ([]model.Tournament, error) {
	return s.repo.GetAll(ctx)
}
