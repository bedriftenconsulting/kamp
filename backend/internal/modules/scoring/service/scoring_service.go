package service

import (
	"context"
	"fmt"

	matchRepo "kamp/internal/modules/match/repository"
	ScoringRepo "kamp/internal/modules/scoring/repository"
)

type ScoringService struct {
	repo      *ScoringRepo.ScoringRepository
	matchRepo *matchRepo.MatchRepository
}

func NewScoringService(
	repo *ScoringRepo.ScoringRepository,
	matchRepo *matchRepo.MatchRepository,
) *ScoringService {
	return &ScoringService{
		repo:      repo,
		matchRepo: matchRepo,
	}
}

func (s *ScoringService) AddPoint(ctx context.Context, matchID string, player int) (map[string]interface{}, error) {
	if err := s.repo.EnsureMatchState(ctx, matchID); err != nil {
		return nil, err
	}

	state, err := s.repo.GetMatchState(ctx, matchID)
	if err != nil {
		return nil, err
	}

	p1 := getString(state["player1_points"])
	p2 := getString(state["player2_points"])

	g1 := getInt(state["player1_games"])
	g2 := getInt(state["player2_games"])

	s1 := getInt(state["player1_sets"])
	s2 := getInt(state["player2_sets"])

	newP1, newP2 := p1, p2

	// 🔥 Detect tiebreak
	isTiebreak := (g1 == 6 && g2 == 6)

	if isTiebreak {
		// Simple numeric scoring
		if player == 1 {
			newP1 = incrementNumeric(p1)
		} else {
			newP2 = incrementNumeric(p2)
		}

		// Tiebreak win condition
		p1Int := atoi(newP1)
		p2Int := atoi(newP2)

		if (p1Int >= 7 || p2Int >= 7) && abs(p1Int-p2Int) >= 2 {
			if p1Int > p2Int {
				s1++
			} else {
				s2++
			}
			g1, g2 = 0, 0
			newP1, newP2 = "0", "0"
		}

	} else {
		// Normal tennis scoring
		if player == 1 {
			newP1, newP2 = calculateNextPoint(p1, p2, true)
		} else {
			newP1, newP2 = calculateNextPoint(p1, p2, false)
		}

		// Game win
		if newP1 == "0" && newP2 == "0" {
			if player == 1 {
				g1++
			} else {
				g2++
			}
		}
	}

	// 🎯 Set win
	if g1 >= 6 && g1-g2 >= 2 {
		s1++
		g1, g2 = 0, 0
	}

	if g2 >= 6 && g2-g1 >= 2 {
		s2++
		g1, g2 = 0, 0
	}

	// 🏆 Match win (best of 3)
	matchFinished := false
	var winner string

	if s1 == 2 {
		matchFinished = true
		winner = "player1"
	}

	if s2 == 2 {
		matchFinished = true
		winner = "player2"
	}

	// Save event
	err = s.repo.CreateEvent(ctx, matchID, "POINT", nil, "")
	if err != nil {
		return nil, err
	}

	// Update state
	err = s.repo.UpdateFullState(ctx, matchID, newP1, newP2, g1, g2, s1, s2)
	if err != nil {
		return nil, err
	}

	// 🏁 Finish match
	if matchFinished {
		// TODO: Replace with actual player IDs
		_ = s.matchRepo.FinishMatch(ctx, matchID, winner)
	}

	return s.repo.GetMatchState(ctx, matchID)
}

func (s *ScoringService) GetMatchState(ctx context.Context, matchID string) (map[string]interface{}, error) {
	if err := s.repo.EnsureMatchState(ctx, matchID); err != nil {
		return nil, err
	}

	return s.repo.GetMatchState(ctx, matchID)
}

func calculateNextPoint(p1, p2 string, player1Scored bool) (string, string) {

	points := []string{"0", "15", "30", "40"}

	// Helper to get next point
	next := func(p string) string {
		for i, v := range points {
			if v == p && i < len(points)-1 {
				return points[i+1]
			}
		}
		return p
	}

	// DEUCE logic
	if p1 == "40" && p2 == "40" {
		if player1Scored {
			return "AD", "40"
		}
		return "40", "AD"
	}

	// Advantage logic
	if p1 == "AD" {
		if player1Scored {
			return "0", "0" // game win → reset
		}
		return "40", "40"
	}

	if p2 == "AD" {
		if !player1Scored {
			return "0", "0"
		}
		return "40", "40"
	}

	// Normal scoring
	if player1Scored {
		if p1 == "40" {
			return "0", "0" // game win
		}
		return next(p1), p2
	}

	if p2 == "40" {
		return "0", "0"
	}

	return p1, next(p2)
}

func incrementNumeric(p string) string {
	n := atoi(p)
	return itoa(n + 1)
}

func atoi(s string) int {
	var n int
	fmt.Sscanf(s, "%d", &n)
	return n
}

func itoa(i int) string {
	return fmt.Sprintf("%d", i)
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func getInt(value interface{}) int {
	if value == nil {
		return 0
	}

	switch v := value.(type) {
	case int:
		return v
	case int32:
		return int(v)
	case int64:
		return int(v)
	default:
		return 0
	}
}

func getString(value interface{}) string {
	if value == nil {
		return "0"
	}

	if v, ok := value.(string); ok {
		return v
	}

	return "0"
}
