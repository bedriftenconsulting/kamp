package handler

import (
	"net/http"
	"strings"
	"time"

	"kamp/internal/modules/player/model"
	"kamp/internal/modules/player/service"

	"github.com/gin-gonic/gin"
)

type PlayerHandler struct {
	service *service.PlayerService
}

type playerRequest struct {
	ID              string `json:"id"`
	FirstName       string `json:"first_name" binding:"required"`
	LastName        string `json:"last_name" binding:"required"`
	DateOfBirth     string `json:"date_of_birth"`
	Nationality     string `json:"nationality"`
	Gender          string `json:"gender"`
	Age             int    `json:"age"`
	TennisLevel     string `json:"tennis_level"`
	Ranking         int    `json:"ranking"`
	Bio             string `json:"bio"`
	ProfileImageURL string `json:"profile_image_url"`
}

func NewPlayerHandler(service *service.PlayerService) *PlayerHandler {
	return &PlayerHandler{service: service}
}

func (h *PlayerHandler) CreatePlayer(c *gin.Context) {
	var input playerRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	player, err := buildPlayerFromRequest(input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.CreatePlayer(c, player); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, player)
}

func (h *PlayerHandler) GetPlayers(c *gin.Context) {
	players, err := h.service.GetPlayers(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if players == nil {
		players = make([]model.Player, 0)
	}

	c.JSON(http.StatusOK, players)
}

func (h *PlayerHandler) UpdatePlayer(c *gin.Context) {
	id := c.Param("id")
	if strings.TrimSpace(id) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "player id is required"})
		return
	}

	var input playerRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.ID = id

	player, err := buildPlayerFromRequest(input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdatePlayer(c, player); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, player)
}

func (h *PlayerHandler) DeletePlayer(c *gin.Context) {
	id := c.Param("id")
	if strings.TrimSpace(id) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "player id is required"})
		return
	}

	if err := h.service.DeletePlayer(c, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "player deleted"})
}

func buildPlayerFromRequest(input playerRequest) (*model.Player, error) {
	dob, err := parseFlexibleDate(input.DateOfBirth)
	if err != nil {
		return nil, err
	}

	return &model.Player{
		ID:              input.ID,
		FirstName:       input.FirstName,
		LastName:        input.LastName,
		DateOfBirth:     dob,
		Nationality:     input.Nationality,
		Gender:          input.Gender,
		Age:             input.Age,
		TennisLevel:     input.TennisLevel,
		Ranking:         input.Ranking,
		Bio:             input.Bio,
		ProfileImageURL: input.ProfileImageURL,
	}, nil
}

func parseFlexibleDate(v string) (time.Time, error) {
	if strings.TrimSpace(v) == "" {
		return time.Time{}, nil
	}

	if t, err := time.Parse("2006-01-02", v); err == nil {
		return t, nil
	}

	return time.Parse(time.RFC3339, v)
}
