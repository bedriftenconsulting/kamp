package handler

import (
	"net/http"
	"strings"
	"time"

	"kamp/internal/modules/match/model"
	"kamp/internal/modules/match/service"

	"github.com/gin-gonic/gin"
)

type MatchHandler struct {
	service *service.MatchService
}

type matchRequest struct {
	TournamentID  string `json:"tournament_id"`
	Player1ID     string `json:"player1_id" binding:"required"`
	Player2ID     string `json:"player2_id" binding:"required"`
	CourtID       string `json:"court_id"`
	Round         string `json:"round" binding:"required"`
	ScheduledTime string `json:"scheduled_time"`
	Status        string `json:"status"`
}

type completeMatchRequest struct {
	Player1ID    string `json:"player1_id"`
	Player2ID    string `json:"player2_id"`
	Player1Sets  int    `json:"player1_sets"`
	Player2Sets  int    `json:"player2_sets"`
	Player1Games int    `json:"player1_games"`
	Player2Games int    `json:"player2_games"`
}

func NewMatchHandler(service *service.MatchService) *MatchHandler {
	return &MatchHandler{service: service}
}

func (h *MatchHandler) CreateMatch(c *gin.Context) {
	var input matchRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	match, err := buildMatchFromRequest(input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.service.CreateMatch(c, match)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, match)
}

func (h *MatchHandler) GetMatches(c *gin.Context) {
	matches, err := h.service.GetMatches(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, matches)
}

func (h *MatchHandler) UpdateMatch(c *gin.Context) {
	matchID := c.Param("id")
	if strings.TrimSpace(matchID) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "match id is required"})
		return
	}

	var input matchRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	match, err := buildMatchFromRequest(input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	match.ID = matchID

	if err := h.service.UpdateMatch(c, match); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, match)
}

func (h *MatchHandler) DeleteMatch(c *gin.Context) {
	matchID := c.Param("id")
	if strings.TrimSpace(matchID) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "match id is required"})
		return
	}

	if err := h.service.DeleteMatch(c, matchID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "match deleted"})
}

func (h *MatchHandler) CompleteMatch(c *gin.Context) {
	matchID := c.Param("id")
	if strings.TrimSpace(matchID) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "match id is required"})
		return
	}

	var input completeMatchRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	player1ID := optionalString(input.Player1ID)
	player2ID := optionalString(input.Player2ID)

	err := h.service.CompleteMatch(c, matchID, service.CompleteMatchInput{
		Player1Sets:  input.Player1Sets,
		Player2Sets:  input.Player2Sets,
		Player1Games: input.Player1Games,
		Player2Games: input.Player2Games,
	}, player1ID, player2ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "match completed"})
}

func buildMatchFromRequest(input matchRequest) (*model.Match, error) {
	status := input.Status
	if status == "" {
		status = "scheduled"
	}

	match := &model.Match{
		TournamentID: optionalString(input.TournamentID),
		Player1ID:    optionalString(input.Player1ID),
		Player2ID:    optionalString(input.Player2ID),
		CourtID:      optionalString(input.CourtID),
		Round:        input.Round,
		Status:       status,
	}

	if strings.TrimSpace(input.ScheduledTime) != "" {
		t, err := parseFlexibleTime(input.ScheduledTime)
		if err != nil {
			return nil, err
		}
		match.ScheduledTime = &t
	}

	return match, nil
}

func optionalString(v string) *string {
	v = strings.TrimSpace(v)
	if v == "" {
		return nil
	}
	return &v
}

func parseFlexibleTime(v string) (time.Time, error) {
	if t, err := time.Parse(time.RFC3339, v); err == nil {
		return t, nil
	}

	// supports `datetime-local` format from browser inputs
	if t, err := time.Parse("2006-01-02T15:04", v); err == nil {
		return t, nil
	}

	return time.Parse("2006-01-02 15:04:05", v)
}
