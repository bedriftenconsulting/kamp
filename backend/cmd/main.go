package main

import (
	"net/http"

	"kamp/internal/config"
	matchHandler "kamp/internal/modules/match/handler"
	matchRepo "kamp/internal/modules/match/repository"
	matchService "kamp/internal/modules/match/service"
	playerHandler "kamp/internal/modules/player/handler"
	playerRepo "kamp/internal/modules/player/repository"
	playerService "kamp/internal/modules/player/service"
	realtime "kamp/internal/modules/realtime"
	scoringHandler "kamp/internal/modules/scoring/handler"
	scoringRepo "kamp/internal/modules/scoring/repository"
	scoringService "kamp/internal/modules/scoring/service"
	tournamentHandler "kamp/internal/modules/tournament/handler"
	tournamentRepo "kamp/internal/modules/tournament/repository"
	tournamentService "kamp/internal/modules/tournament/service"

	"github.com/gin-contrib/cors"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load config
	cfg := config.LoadConfig()

	// Connect DB
	db := config.NewDB(cfg)
	defer db.Close()

	// Initialize router
	r := gin.Default()

	// ✅ Health check
	r.GET("/health", func(c *gin.Context) {
		err := db.Ping(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": "db error",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"db":     "connected",
		})
	})

	// ✅ WebSocket route (FIXED)
	r.GET("/ws", func(c *gin.Context) {
		realtime.HandleConnections(c.Writer, c.Request)
	})

	// ✅ ENABLE CORS (FIX)
	r.Use(cors.Default())

	// =============================
	// Initialize modules (CLEAN)
	// =============================

	tournamentRepo := tournamentRepo.NewTournamentRepository(db)
	tournamentSvc := tournamentService.NewTournamentService(tournamentRepo)
	tournamentHdl := tournamentHandler.NewTournamentHandler(tournamentSvc)

	playerRepo := playerRepo.NewPlayerRepository(db)
	playerSvc := playerService.NewPlayerService(playerRepo)
	playerHdl := playerHandler.NewPlayerHandler(playerSvc)

	matchRepo := matchRepo.NewMatchRepository(db)
	matchSvc := matchService.NewMatchService(matchRepo)
	matchHdl := matchHandler.NewMatchHandler(matchSvc)

	scoringRepo := scoringRepo.NewScoringRepository(db)
	scoringSvc := scoringService.NewScoringService(scoringRepo, matchRepo)
	scoringHdl := scoringHandler.NewScoringHandler(scoringSvc)

	// =============================
	// API Routes
	// =============================

	api := r.Group("/api/v1")
	{
		api.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "pong"})
		})

		// Tournament
		api.POST("/tournaments", tournamentHdl.CreateTournament)
		api.GET("/tournaments", tournamentHdl.GetTournaments)

		// Player
		api.POST("/players", playerHdl.CreatePlayer)
		api.GET("/players", playerHdl.GetPlayers)
		api.PUT("/players/:id", playerHdl.UpdatePlayer)
		api.DELETE("/players/:id", playerHdl.DeletePlayer)

		// Match
		api.POST("/matches", matchHdl.CreateMatch)
		api.GET("/matches", matchHdl.GetMatches)
		api.PUT("/matches/:id", matchHdl.UpdateMatch)
		api.DELETE("/matches/:id", matchHdl.DeleteMatch)
		api.POST("/matches/:id/complete", matchHdl.CompleteMatch)

		// Scoring
		api.POST("/matches/:id/point", scoringHdl.AddPoint)
	}

	// ✅ Start WebSocket listener
	go realtime.HandleMessages()

	// Start server
	r.Run(":" + cfg.Port)
}
