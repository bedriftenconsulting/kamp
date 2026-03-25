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

	requiredSets := 2 // Best of 3

	// 1. Match Completion Protection
	if s1 == requiredSets || s2 == requiredSets {
		return state, nil
	}

	newP1, newP2 := p1, p2
	gameWinner := 0
	setWinner := 0

	// 🔥 Detect tiebreak (6-6)
	isTiebreak := (g1 == 6 && g2 == 6)

	// 2. Point Update & Game Win Detection
	if isTiebreak {
		// Tiebreak Logic
		if player == 1 {
			newP1 = incrementNumeric(p1)
		} else {
			newP2 = incrementNumeric(p2)
		}

		p1Int := atoi(newP1)
		p2Int := atoi(newP2)

		if (p1Int >= 7 || p2Int >= 7) && abs(p1Int-p2Int) >= 2 {
			if p1Int > p2Int {
				setWinner = 1
			} else {
				setWinner = 2
			}
		}
	} else {
		// Normal Tennis Scoring
		player1Scored := (player == 1)
		newP1, newP2 = calculateNextPoint(p1, p2, player1Scored)

		if newP1 == "0" && newP2 == "0" {
			if player == 1 {
				gameWinner = 1
			} else {
				gameWinner = 2
			}
		}
	}

	// 3. Update Games
	if gameWinner == 1 {
		g1++
	} else if gameWinner == 2 {
		g2++
	}

	// 4. Determine Set Winner (from normal games)
	if !isTiebreak {
		if g1 >= 6 && g1-g2 >= 2 {
			setWinner = 1
		} else if g2 >= 6 && g2-g1 >= 2 {
			setWinner = 2
		}
	}

	// 5. Update Sets
	if setWinner == 1 {
		s1++
		g1, g2 = 0, 0
		newP1, newP2 = "0", "0"
	} else if setWinner == 2 {
		s2++
		g1, g2 = 0, 0
		newP1, newP2 = "0", "0"
	}

	// 6. Determine Match Winner
	matchFinished := false
	winnerNum := 0

	if s1 == requiredSets {
		matchFinished = true
		winnerNum = 1
	} else if s2 == requiredSets {
		matchFinished = true
		winnerNum = 2
	}

	// Save event
	if err := s.repo.CreateEvent(ctx, matchID, "POINT", nil, ""); err != nil {
		return nil, err
	}

	// Update state
	if err := s.repo.UpdateFullState(ctx, matchID, newP1, newP2, g1, g2, s1, s2); err != nil {
		return nil, err
	}

	// 🏁 Finish match — resolve actual player UUID
	if matchFinished {
		p1ID, p2ID, err := s.matchRepo.GetPlayerIDs(ctx, matchID)
		if err == nil {
			winnerID := p1ID
			if winnerNum == 2 {
				winnerID = p2ID
			}
			_ = s.matchRepo.FinishMatch(ctx, matchID, winnerID)
		}
	}

	// Return state with match_finished flag
	finalState, err := s.repo.GetMatchState(ctx, matchID)
	if err != nil {
		return nil, err
	}
	finalState["match_finished"] = matchFinished
	if winnerNum == 1 {
		finalState["winner"] = "player1"
	} else if winnerNum == 2 {
		finalState["winner"] = "player2"
	}
	return finalState, nil
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
