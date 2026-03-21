package handler

import (
	"net/http"
	"strings"

	"kamp/internal/modules/group/model"
	"kamp/internal/modules/group/service"

	"github.com/gin-gonic/gin"
)

type GroupHandler struct {
	service *service.GroupService
}

func NewGroupHandler(service *service.GroupService) *GroupHandler {
	return &GroupHandler{service: service}
}

type setPlayersRequest struct {
	PlayerIDs []string `json:"player_ids"`
}

type saveResultRequest struct {
	Player1Score int `json:"player1_score"`
	Player2Score int `json:"player2_score"`
}

func (h *GroupHandler) CreateGroup(c *gin.Context) {
	var input model.Group
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.CreateGroup(c, &input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, input)
}

func (h *GroupHandler) GetGroups(c *gin.Context) {
	groups, err := h.service.ListGroups(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if groups == nil {
		groups = make([]model.Group, 0)
	}
	c.JSON(http.StatusOK, groups)
}

func (h *GroupHandler) SetPlayers(c *gin.Context) {
	groupID := strings.TrimSpace(c.Param("id"))
	if groupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "group id is required"})
		return
	}

	var req setPlayersRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.SetGroupPlayers(c, groupID, req.PlayerIDs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "group players updated"})
}

func (h *GroupHandler) LockGroup(c *gin.Context) {
	groupID := strings.TrimSpace(c.Param("id"))
	if groupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "group id is required"})
		return
	}

	if err := h.service.LockGroup(c, groupID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "group locked and round robin generated"})
}

func (h *GroupHandler) GetGroupPlayers(c *gin.Context) {
	groupID := strings.TrimSpace(c.Param("id"))
	if groupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "group id is required"})
		return
	}

	playerIDs, err := h.service.GetGroupPlayerIDs(c, groupID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if playerIDs == nil {
		playerIDs = make([]string, 0)
	}
	c.JSON(http.StatusOK, gin.H{"player_ids": playerIDs})
}

func (h *GroupHandler) GetMatches(c *gin.Context) {
	groupID := strings.TrimSpace(c.Param("id"))
	if groupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "group id is required"})
		return
	}

	matches, err := h.service.GetGroupMatches(c, groupID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if matches == nil {
		matches = make([]model.GroupMatch, 0)
	}
	c.JSON(http.StatusOK, matches)
}

func (h *GroupHandler) SaveResult(c *gin.Context) {
	groupID := strings.TrimSpace(c.Param("id"))
	matchID := strings.TrimSpace(c.Param("matchId"))
	if groupID == "" || matchID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "group id and match id are required"})
		return
	}

	var req saveResultRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.SaveMatchResult(c, groupID, matchID, req.Player1Score, req.Player2Score); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "match result saved"})
}

func (h *GroupHandler) GetStandings(c *gin.Context) {
	groupID := strings.TrimSpace(c.Param("id"))
	if groupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "group id is required"})
		return
	}

	standings, err := h.service.GetStandings(c, groupID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if standings == nil {
		standings = make([]model.GroupStanding, 0)
	}
	c.JSON(http.StatusOK, standings)
}

func (h *GroupHandler) DeleteGroup(c *gin.Context) {
	groupID := strings.TrimSpace(c.Param("id"))
	if groupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "group id is required"})
		return
	}

	if err := h.service.DeleteGroup(c, groupID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "group deleted"})
}
