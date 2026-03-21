package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"kamp/internal/config"
	groupHandler "kamp/internal/modules/group/handler"
	groupRepo "kamp/internal/modules/group/repository"
	groupService "kamp/internal/modules/group/service"
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
	debugHTTP := strings.EqualFold(os.Getenv("DEBUG_HTTP"), "true")

	log.Printf("🚀 Starting kamp-backend (port=%s, gin_mode=%s, debug_http=%t)", cfg.Port, gin.Mode(), debugHTTP)
	log.Printf("🌐 CORS allowed origins: %v", cfg.CORSAllowedOrigins)

	// Connect DB
	db := config.NewDB(cfg)
	defer db.Close()

	// Run DB migrations only when explicitly enabled.
	// Example: RUN_MIGRATIONS=true ./app
	if strings.EqualFold(os.Getenv("RUN_MIGRATIONS"), "true") {
		if err := config.RunMigrations(db); err != nil {
			panic(err)
		}

		log.Println("========================================")
		log.Println("✅✅✅ DATABASE MIGRATIONS COMPLETE ✅✅✅")
		log.Println("========================================")
	} else {
		log.Println("⏭️  Skipping migrations (set RUN_MIGRATIONS=true to run them)")
	}

	// Initialize router
	r := gin.Default()

	if debugHTTP {
		// Temporary request-level diagnostics. Toggle off by setting DEBUG_HTTP=false.
		r.Use(func(c *gin.Context) {
			start := time.Now()
			c.Next()
			log.Printf(
				"[DEBUG_HTTP] %s %s -> %d (%s) ip=%s ua=%q errors=%q",
				c.Request.Method,
				c.Request.URL.Path,
				c.Writer.Status(),
				time.Since(start),
				c.ClientIP(),
				c.Request.UserAgent(),
				c.Errors.String(),
			)
		})
	}

	// ✅ ENABLE CORS (Render/Vercel + local)
	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSAllowedOrigins,
		AllowWildcard:    true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Content-Length", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	}))

	// ✅ Root route (avoid 404 on service URL)
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service": "kamp-backend",
			"status":  "ok",
			"health":  "/health",
		})
	})
	r.HEAD("/", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

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

	groupRepo := groupRepo.NewGroupRepository(db)
	groupSvc := groupService.NewGroupService(groupRepo)
	groupHdl := groupHandler.NewGroupHandler(groupSvc)

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
		api.PUT("/tournaments/:id", tournamentHdl.UpdateTournament)
		api.DELETE("/tournaments/:id", tournamentHdl.DeleteTournament)

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
		api.GET("/matches/:id/state", scoringHdl.GetMatchState)

		// Groups (Round Robin)
		api.POST("/groups", groupHdl.CreateGroup)
		api.GET("/groups", groupHdl.GetGroups)
		api.PUT("/groups/:id/players", groupHdl.SetPlayers)
		api.GET("/groups/:id/players", groupHdl.GetGroupPlayers)
		api.POST("/groups/:id/lock", groupHdl.LockGroup)
		api.GET("/groups/:id/matches", groupHdl.GetMatches)
		api.PUT("/groups/:id/matches/:matchId/result", groupHdl.SaveResult)
		api.GET("/groups/:id/standings", groupHdl.GetStandings)
	}

	// ✅ Start WebSocket listener
	go realtime.HandleMessages()

	// Start server
	r.Run(":" + cfg.Port)
}
