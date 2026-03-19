package handler

import (
	"net/http"

	"kamp/internal/modules/tournament/model"
	"kamp/internal/modules/tournament/service"

	"github.com/gin-gonic/gin"
)

type TournamentHandler struct {
	service *service.TournamentService
}

func NewTournamentHandler(service *service.TournamentService) *TournamentHandler {
	return &TournamentHandler{service: service}
}

func (h *TournamentHandler) CreateTournament(c *gin.Context) {
	var input model.Tournament

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.service.CreateTournament(c, &input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, input)
}

func (h *TournamentHandler) GetTournaments(c *gin.Context) {
	tournaments, err := h.service.GetTournaments(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tournaments)
}
