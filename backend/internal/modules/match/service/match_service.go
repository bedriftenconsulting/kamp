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
	if err := validateMatchPlayers(m); err != nil {
		return err
	}
	return s.repo.Create(ctx, m)
}

func (s *MatchService) GetMatches(ctx context.Context, tournamentID string) ([]model.Match, error) {
	return s.repo.GetAll(ctx, tournamentID)
}

func (s *MatchService) GetMatchByID(ctx context.Context, matchID string) (*model.Match, error) {
	return s.repo.GetByID(ctx, matchID)
}

func (s *MatchService) UpdateMatch(ctx context.Context, m *model.Match) error {
	if m.Status == "" {
		m.Status = "scheduled"
	}
	if err := validateMatchPlayers(m); err != nil {
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

	err := s.repo.Complete(
		ctx,
		matchID,
		winnerID,
		input.Player1Sets,
		input.Player2Sets,
		input.Player1Games,
		input.Player2Games,
	)
	if err != nil {
		return err
	}

	// Auto-advance bracket logic
	if winnerID != nil {
		currentMatch, err := s.repo.GetByID(ctx, matchID)
		if err == nil && currentMatch.NextMatchID != nil && currentMatch.BracketPosition != nil {
			nextMatch, err := s.repo.GetByID(ctx, *currentMatch.NextMatchID)
			if err == nil && nextMatch != nil {
				// Slot into Player 1 or Player 2 depending on current match's position.
				// Even position (0, 2, 4...) -> Player 1 of next match
				// Odd position (1, 3, 5...) -> Player 2 of next match
				if *currentMatch.BracketPosition%2 == 0 {
					nextMatch.Player1ID = winnerID
				} else {
					nextMatch.Player2ID = winnerID
				}
				s.repo.Update(ctx, nextMatch)
			}
		}
	}

	return nil
}

func validateMatchPlayers(m *model.Match) error {
	bracketRounds := map[string]bool{
		"Final": true, "Semifinal": true, "Quarterfinal": true,
		"Round of 16": true, "Round of 32": true, "Round of 64": true,
	}

	if bracketRounds[m.Round] {
		// Bracket matches can have missing players (TBD)
		if m.Player1ID != nil && m.Player2ID != nil && *m.Player1ID == *m.Player2ID && *m.Player1ID != "" {
			return fmt.Errorf("player1_id and player2_id must be different")
		}
		return nil
	}

	if m.Player1ID == nil || m.Player2ID == nil {
		return fmt.Errorf("both player1_id and player2_id are required")
	}
	if *m.Player1ID == "" || *m.Player2ID == "" {
		return fmt.Errorf("both player1_id and player2_id are required")
	}
	if *m.Player1ID == *m.Player2ID {
		return fmt.Errorf("player1_id and player2_id must be different")
	}
	return nil
}

func (s *MatchService) GenerateBracket(ctx context.Context, tournamentID string, playerIDs []string) error {
	// 1. Clear existing bracket matches to ensure idempotency and fix duplicates
	if err := s.repo.DeleteBracketMatches(ctx, tournamentID); err != nil {
		return fmt.Errorf("failed to clear existing bracket: %v", err)
	}

	n := len(playerIDs)

	if n < 2 || (n&(n-1)) != 0 {
		return fmt.Errorf("number of players must be a power of 2 (2, 4, 8, 16, 32, 64)")
	}

	roundNames := map[int]string{
		1:  "Final",
		2:  "Semifinal",
		4:  "Quarterfinal",
		8:  "Round of 16",
		16: "Round of 32",
		32: "Round of 64",
	}

	var nextRoundMatchIDs []string

	for matchesInRound := 1; matchesInRound <= n/2; matchesInRound *= 2 {
		rName := roundNames[matchesInRound]
		if rName == "" {
			rName = fmt.Sprintf("Round of %d", matchesInRound*2)
		}

		var currentRoundIDs []string
		for i := 0; i < matchesInRound; i++ {
			m := &model.Match{
				TournamentID: &tournamentID,
				Round:        rName,
				Status:       "scheduled",
			}
			pos := i
			m.BracketPosition = &pos

			// Assign next match ID if we're not the Final
			if matchesInRound > 1 {
				nextMatchIndex := i / 2
				nextID := nextRoundMatchIDs[nextMatchIndex]
				m.NextMatchID = &nextID
			}

			// If it's the very first round (matchesInRound == n/2)
			if matchesInRound == n/2 {
				p1 := playerIDs[i*2]
				p2 := playerIDs[i*2+1]
				m.Player1ID = &p1
				m.Player2ID = &p2
			}

			if err := s.repo.Create(ctx, m); err != nil {
				return err
			}
			currentRoundIDs = append(currentRoundIDs, m.ID)
		}
		nextRoundMatchIDs = currentRoundIDs
	}

	return nil
}
