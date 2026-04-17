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

func (s *TournamentService) UpdateTournament(ctx context.Context, t *model.Tournament) error {
	if t.Status == "" {
		t.Status = "scheduled"
	}
	return s.repo.Update(ctx, t)
}

func (s *TournamentService) DeleteTournament(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *TournamentService) GetRules(ctx context.Context, tournamentID string) (*model.TournamentRules, error) {
	return s.repo.GetRules(ctx, tournamentID)
}

func (s *TournamentService) UpsertRules(ctx context.Context, rules *model.TournamentRules) error {
	return s.repo.UpsertRules(ctx, rules)
}
