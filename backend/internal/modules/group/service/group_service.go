package service

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"kamp/internal/modules/group/model"
	"kamp/internal/modules/group/repository"
)

type GroupService struct {
	repo *repository.GroupRepository
}

func NewGroupService(repo *repository.GroupRepository) *GroupService {
	return &GroupService{repo: repo}
}

var designationRegex = regexp.MustCompile(`^[A-Za-z]+$`)

func normalizeLevel(level string) (string, error) {
	s := strings.TrimSpace(strings.ToLower(level))
	switch s {
	case "beginner":
		return "Beginner", nil
	case "intermediate":
		return "Intermediate", nil
	case "advanced":
		return "Advanced", nil
	default:
		return "", fmt.Errorf("invalid tennis_level %q (allowed: Beginner, Intermediate, Advanced)", level)
	}
}

func normalizeGender(gender string) (string, error) {
	s := strings.TrimSpace(strings.ToLower(gender))
	switch s {
	case "male", "man", "men":
		return "Men", nil
	case "female", "woman", "women":
		return "Women", nil
	default:
		return "", fmt.Errorf("invalid gender %q (allowed: Men, Women)", gender)
	}
}

func (s *GroupService) CreateGroup(ctx context.Context, g *model.Group) error {
	if !designationRegex.MatchString(strings.TrimSpace(g.Designation)) {
		return fmt.Errorf("designation must be alphabetical (e.g., A, B, C)")
	}

	level, err := normalizeLevel(g.TennisLevel)
	if err != nil {
		return err
	}
	gender, err := normalizeGender(g.Gender)
	if err != nil {
		return err
	}
	g.TennisLevel = level
	g.Gender = gender
	g.Designation = strings.ToUpper(strings.TrimSpace(g.Designation))

	if g.MaxPlayers < 2 {
		return fmt.Errorf("max_players must be at least 2")
	}
	if g.QualifiersCount < 1 || g.QualifiersCount > g.MaxPlayers {
		return fmt.Errorf("qualifiers_count must be between 1 and max_players")
	}

	return s.repo.CreateGroup(ctx, g)
}

func (s *GroupService) ListGroups(ctx context.Context) ([]model.Group, error) {
	return s.repo.ListGroups(ctx)
}

func (s *GroupService) SetGroupPlayers(ctx context.Context, groupID string, playerIDs []string) error {
	g, err := s.repo.GetGroupByID(ctx, groupID)
	if err != nil {
		return err
	}
	if g == nil {
		return fmt.Errorf("group not found")
	}
	if g.IsLocked {
		return fmt.Errorf("group is locked")
	}

	if len(playerIDs) > g.MaxPlayers {
		return fmt.Errorf("group player limit exceeded: max %d", g.MaxPlayers)
	}

	if err := s.repo.ValidatePlayersLevelAndGender(ctx, playerIDs, g.TennisLevel, g.Gender); err != nil {
		return err
	}

	return s.repo.SetGroupPlayers(ctx, groupID, playerIDs)
}

func (s *GroupService) LockGroup(ctx context.Context, groupID string) error {
	g, err := s.repo.GetGroupByID(ctx, groupID)
	if err != nil {
		return err
	}
	if g == nil {
		return fmt.Errorf("group not found")
	}
	if g.IsLocked {
		return nil
	}
	if g.PlayersCount != g.MaxPlayers {
		return fmt.Errorf("group must have exactly %d players before locking", g.MaxPlayers)
	}

	playerIDs, err := s.repo.GetGroupPlayerIDs(ctx, groupID)
	if err != nil {
		return err
	}
	if len(playerIDs) != g.MaxPlayers {
		return fmt.Errorf("group player assignments mismatch")
	}

	if err := s.repo.ClearGroupMatches(ctx, groupID); err != nil {
		return err
	}

	for i := 0; i < len(playerIDs); i++ {
		for j := i + 1; j < len(playerIDs); j++ {
			mainMatchID, err := s.repo.CreateMainMatchFromGroup(ctx, g, playerIDs[i], playerIDs[j])
			if err != nil {
				return err
			}
			if err := s.repo.CreateGroupMatch(ctx, groupID, playerIDs[i], playerIDs[j], mainMatchID); err != nil {
				return err
			}
		}
	}

	return s.repo.LockGroup(ctx, groupID)
}

func (s *GroupService) GetGroupMatches(ctx context.Context, groupID string) ([]model.GroupMatch, error) {
	return s.repo.GetGroupMatches(ctx, groupID)
}

func (s *GroupService) SaveMatchResult(ctx context.Context, groupID, matchID string, p1Score, p2Score int) error {
	if p1Score < 0 || p2Score < 0 {
		return fmt.Errorf("scores cannot be negative")
	}
	if p1Score == p2Score {
		return fmt.Errorf("draw is not allowed for qualification scoring")
	}
	return s.repo.SaveMatchResult(ctx, groupID, matchID, p1Score, p2Score)
}

func (s *GroupService) GetGroupPlayerIDs(ctx context.Context, groupID string) ([]string, error) {
	g, err := s.repo.GetGroupByID(ctx, groupID)
	if err != nil {
		return nil, err
	}
	if g == nil {
		return nil, fmt.Errorf("group not found")
	}

	return s.repo.GetGroupPlayerIDs(ctx, groupID)
}

func (s *GroupService) GetStandings(ctx context.Context, groupID string) ([]model.GroupStanding, error) {
	g, err := s.repo.GetGroupByID(ctx, groupID)
	if err != nil {
		return nil, err
	}
	if g == nil {
		return nil, fmt.Errorf("group not found")
	}

	return s.repo.GetStandings(ctx, groupID, g.QualifiersCount)
}

func (s *GroupService) DeleteGroup(ctx context.Context, groupID string) error {
	g, err := s.repo.GetGroupByID(ctx, groupID)
	if err != nil {
		return err
	}
	if g == nil {
		return fmt.Errorf("group not found")
	}

	return s.repo.DeleteGroup(ctx, groupID)
}
