package service

import (
	"context"
	"fmt"

	"kamp/internal/modules/match/model"
	"kamp/internal/modules/match/repository"
)

type MatchService struct {
	repo *repository.MatchRepository
}

type CompleteMatchInput struct {
	Player1Sets  int
	Player2Sets  int
	Player1Games int
	Player2Games int
}

func NewMatchService(repo *repository.MatchRepository) *MatchService {
	return &MatchService{repo: repo}
}

func (s *MatchService) CreateMatch(ctx context.Context, m *model.Match) error {
	if m.Status == "" {
		m.Status = "scheduled" 
	}
	if err := validatePlayers(m.Player1ID, m.Player2ID); err != nil {
		return err
	}
	return s.repo.Create(ctx, m)
}

func (s *MatchService) GetMatches(ctx context.Context, tournamentID string) ([]model.Match, error) {
	return s.repo.GetAll(ctx, tournamentID)
}

func (s *MatchService) UpdateMatch(ctx context.Context, m *model.Match) error {
	if m.Status == "" {
		m.Status = "scheduled"
	}
	if err := validatePlayers(m.Player1ID, m.Player2ID); err != nil {
		return err
	}
	return s.repo.Update(ctx, m)
}

func (s *MatchService) DeleteMatch(ctx context.Context, matchID string) error {
	return s.repo.Delete(ctx, matchID)
}

func (s *MatchService) CompleteMatch(ctx context.Context, matchID string, input CompleteMatchInput, player1ID, player2ID *string) error {
	var winnerID *string
	if input.Player1Sets > input.Player2Sets {
		winnerID = player1ID
	} else if input.Player2Sets > input.Player1Sets {
		winnerID = player2ID
	}

	return s.repo.Complete(
		ctx,
		matchID,
		winnerID,
		input.Player1Sets,
		input.Player2Sets,
		input.Player1Games,
		input.Player2Games,
	)
}

func validatePlayers(player1ID, player2ID *string) error {
	if player1ID == nil || player2ID == nil {
		return fmt.Errorf("both player1_id and player2_id are required")
	}
	if *player1ID == "" || *player2ID == "" {
		return fmt.Errorf("both player1_id and player2_id are required")
	}
	if *player1ID == *player2ID {
		return fmt.Errorf("player1_id and player2_id must be different")
	}
	return nil
}
