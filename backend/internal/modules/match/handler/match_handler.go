package handler

import (
	"net/http"

	"kamp/internal/modules/match/model"
	"kamp/internal/modules/match/service"

	"github.com/gin-gonic/gin"
)

type MatchHandler struct {
	service *service.MatchService
}

func NewMatchHandler(service *service.MatchService) *MatchHandler {
	return &MatchHandler{service: service}
}

func (h *MatchHandler) CreateMatch(c *gin.Context) {
	var input model.Match

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.service.CreateMatch(c, &input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, input)
}

func (h *MatchHandler) GetMatches(c *gin.Context) {
	matches, err := h.service.GetMatches(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, matches)
}
