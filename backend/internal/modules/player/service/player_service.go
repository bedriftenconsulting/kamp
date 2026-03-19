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

func (s *PlayerService) GetPlayers(ctx context.Context) ([]model.Player, error) {
	return s.repo.GetAll(ctx)
}

func (s *PlayerService) UpdatePlayer(ctx context.Context, p *model.Player) error {
	return s.repo.Update(ctx, p)
}

func (s *PlayerService) DeletePlayer(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
