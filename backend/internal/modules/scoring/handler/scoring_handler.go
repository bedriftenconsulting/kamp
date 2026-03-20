package handler

import (
	"net/http"

	"kamp/internal/modules/scoring/service"

	realtime "kamp/internal/modules/realtime"

	"github.com/gin-gonic/gin"
)

type ScoringHandler struct {
	service *service.ScoringService
}

func NewScoringHandler(service *service.ScoringService) *ScoringHandler {
	return &ScoringHandler{service: service}
}

func (h *ScoringHandler) AddPoint(c *gin.Context) {
	matchID := c.Param("id")

	var body struct {
		Player int `json:"player"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	state, err := h.service.AddPoint(c, matchID, body.Player)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 🔥 Broadcast ONLY to this match
	realtime.Broadcast(matchID, map[string]interface{}{
		"type":     "score_update",
		"match_id": matchID,
		"state":    state,
	})

	c.JSON(http.StatusOK, state)
}

func (h *ScoringHandler) GetMatchState(c *gin.Context) {
	matchID := c.Param("id")

	state, err := h.service.GetMatchState(c, matchID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, state)
}
