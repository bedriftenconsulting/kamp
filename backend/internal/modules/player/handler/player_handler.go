package handler

import (
	"fmt"
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
//this struct is used forReceiving JSON from the client (curl, frontend, etc.)
type playerRequest struct {
	ID              string `json:"id"`
	FirstName       string `json:"first_name" binding:"required"`
	LastName        string `json:"last_name" binding:"required"`
	DateOfBirth     string `json:"date_of_birth"`
	Nationality     string `json:"nationality"`
	TournamentID    string `json:"tournament_id"`
	TournamentName  string `json:"tournament_name"`
	Gender          string `json:"gender"`
	Age             int    `json:"age"`
	TennisLevel     string `json:"tennis_level"`
	Ranking         int    `json:"ranking"`
	Bio             string `json:"bio"`
	ProfileImageURL string `json:"profile_image_url"`
}

//this is constructor for player handler
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

type teamRequest struct {
	TournamentID   string `json:"tournament_id"`
	Player1ID      string `json:"player1_id" binding:"required"`
	Player2ID      string `json:"player2_id" binding:"required"`
	Player1Name    string `json:"player1_name" binding:"required"`
	Player2Name    string `json:"player2_name" binding:"required"`
	Gender         string `json:"gender"`
	TennisLevel    string `json:"tennis_level"`
}

func (h *PlayerHandler) CreateTeam(c *gin.Context) {
	var input teamRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	teamName := input.Player1Name + " / " + input.Player2Name
	
	player := &model.Player{
		FirstName:    teamName,
		LastName:     "",
		TournamentID: input.TournamentID,
		Gender:       input.Gender,
		TennisLevel:  input.TennisLevel,
		IsTeam:       true,
	}

	if err := h.service.CreateTeam(c, player, input.Player1ID, input.Player2ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, player)
}

func (h *PlayerHandler) GetPlayers(c *gin.Context) {
	tournamentID := c.Query("tournament_id")
	players, err := h.service.GetPlayers(c, tournamentID)
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
		TournamentID:    input.TournamentID,
		TournamentName:  input.TournamentName,
		Gender:          input.Gender,
		Age:             input.Age,
		TennisLevel:     input.TennisLevel,
		Ranking:         input.Ranking,
		Bio:             input.Bio,
		ProfileImageURL: input.ProfileImageURL,
	}, nil
}

func parseFlexibleDate(v string) (time.Time, error) {
	v = strings.TrimSpace(v)
	if v == "" {
		return time.Time{}, nil
	}

	// Strip time portion if present (e.g. 2003-04-02T00:00:00Z)
	if len(v) > 10 && v[10] == 'T' {
		v = v[:10]
	}

	formats := []string{
		"2006-01-02",   // ISO date
		"2006/01/02",   // ISO with slashes
		"1/2/2006",     // M/D/YYYY  (US)
		"01/02/2006",   // MM/DD/YYYY (US)
		"1/2/06",       // M/D/YY  (US, 2-digit year)
		"01/02/06",     // MM/DD/YY (US, 2-digit year)
		time.RFC3339,
	}

	for _, f := range formats {
		if t, err := time.Parse(f, v); err == nil {
			return t, nil
		}
	}

	return time.Time{}, fmt.Errorf("invalid date %q — use MM/DD/YYYY or YYYY-MM-DD", v)
}
