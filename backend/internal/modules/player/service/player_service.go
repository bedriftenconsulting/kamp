package service

import (
	"context"

	"kamp/internal/modules/player/model"
	"kamp/internal/modules/player/repository"
)

type PlayerService struct {
	repo *repository.PlayerRepository
}

func NewPlayerService(repo *repository.PlayerRepository) *PlayerService {
	return &PlayerService{repo: repo}
}

func (s *PlayerService) CreatePlayer(ctx context.Context, p *model.Player) error {
	return s.repo.Create(ctx, p)
}

func (s *PlayerService) CreateTeam(ctx context.Context, p *model.Player, player1ID, player2ID string) error {
	return s.repo.CreateTeam(ctx, p, player1ID, player2ID)
}

func (s *PlayerService) GetPlayers(ctx context.Context, tournamentID string) ([]model.Player, error) {
	return s.repo.GetAll(ctx, tournamentID)
}

func (s *PlayerService) UpdatePlayer(ctx context.Context, p *model.Player) error {
	return s.repo.Update(ctx, p)
}

func (s *PlayerService) DeletePlayer(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
