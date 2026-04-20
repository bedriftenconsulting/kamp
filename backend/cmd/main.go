package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"kamp/internal/config"
	authHandler "kamp/internal/modules/auth/handler"
	authMiddleware "kamp/internal/modules/auth/middleware"
	authRepo "kamp/internal/modules/auth/repository"
	authService "kamp/internal/modules/auth/service"
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
	if db != nil {
	defer db.Close()
}
	// defer db.Close()

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
	scoringSvc := scoringService.NewScoringService(scoringRepo, matchRepo, tournamentRepo)
	scoringHdl := scoringHandler.NewScoringHandler(scoringSvc)

	groupRepo := groupRepo.NewGroupRepository(db)
	groupSvc := groupService.NewGroupService(groupRepo)
	groupHdl := groupHandler.NewGroupHandler(groupSvc)

	authRepo := authRepo.NewUserRepository(db)
	authSvc := authService.NewAuthService(authRepo, cfg.JWTSecret)
	authHdl := authHandler.NewAuthHandler(authSvc)

	// =============================
	// API Routes
	// =============================

	api := r.Group("/api/v1")
	{
		api.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "pong"})
		})

		// Public Auth Routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHdl.Register)
			auth.POST("/login", authHdl.Login)
		}

		protected := api.Group("")
		protected.Use(authMiddleware.AuthMiddleware(cfg.JWTSecret))
		{
			protected.GET("/auth/profile", authHdl.GetProfile)

			// Super Admin Only
			admin := protected.Group("/admin")
			admin.Use(authMiddleware.RequireRole("admin"))
			{
				admin.GET("/users", authHdl.ListUsers)
				admin.POST("/users/umpire", authHdl.CreateUmpire)
				admin.POST("/users/director", authHdl.CreateDirector)
				admin.PATCH("/users/:id/role", authHdl.UpdateUserRole)
				admin.POST("/tournaments", tournamentHdl.CreateTournament)
				admin.DELETE("/tournaments/:id", tournamentHdl.DeleteTournament)
				admin.DELETE("/groups/:id", groupHdl.DeleteGroup)
			}

			// Tournament Director or Admin
			tournamentDirector := protected.Group("/tournaments/:id")
			tournamentDirector.Use(authMiddleware.RequireTournamentAccess(db))
			{
				tournamentDirector.PUT("", tournamentHdl.UpdateTournament)
				tournamentDirector.PUT("/rules", tournamentHdl.UpsertRules)
				tournamentDirector.POST("/bracket", matchHdl.GenerateBracket)
				
				// Group Management (associated with tournament)
				// Note: Ideally we'd have /tournaments/:id/groups, but current schema is /groups/:id
				// For now, directors can manage groups if we add RequireGroupAccess... 
				// but let's stick to the prompt's focus on tournaments for now.
			}

			// Umpire or Admin Access to Match Scoring
			matchScoring := protected.Group("/matches/:id")
			matchScoring.Use(authMiddleware.RequireMatchAccess(db))
			{
				matchScoring.POST("/point", scoringHdl.AddPoint)
				matchScoring.POST("/complete", matchHdl.CompleteMatch)
			}

			// Staff or Admin (Match/Player/Group context)
			staff := protected.Group("")
			staff.Use(authMiddleware.RequireRole("admin", "director", "umpire"))
			{
				// General Match Management
				staff.POST("/matches", matchHdl.CreateMatch)
				staff.PUT("/matches/:id", matchHdl.UpdateMatch)
				staff.DELETE("/matches/:id", matchHdl.DeleteMatch)

				// Group Management
				staff.POST("/groups", groupHdl.CreateGroup)
				staff.PUT("/groups/:id/players", groupHdl.SetPlayers)
				staff.POST("/groups/:id/lock", groupHdl.LockGroup)
				staff.PUT("/groups/:id/matches/:matchId/result", groupHdl.SaveResult)
			}
		}

		// Public Tournament Data
		api.GET("/tournaments", tournamentHdl.GetTournaments)
		api.GET("/tournaments/:id", tournamentHdl.GetTournaments) // Need GetByID
		api.GET("/tournaments/:id/rules", tournamentHdl.GetRules)

		// Public Player Data
		api.POST("/players", playerHdl.CreatePlayer) // Allow players to register? Or restrict? 
		api.POST("/teams", playerHdl.CreateTeam)
		api.GET("/players", playerHdl.GetPlayers)
		api.PUT("/players/:id", playerHdl.UpdatePlayer)
		api.DELETE("/players/:id", playerHdl.DeletePlayer)

		// Public Match Data
		api.GET("/matches", matchHdl.GetMatches)
		api.GET("/matches/:id/state", scoringHdl.GetMatchState)

		// Public Groups Data
		api.GET("/groups", groupHdl.GetGroups)
		api.GET("/groups/qualifiers", groupHdl.GetTournamentQualifiers)
		api.GET("/groups/:id/players", groupHdl.GetGroupPlayers)
		api.GET("/groups/:id/matches", groupHdl.GetMatches)
		api.GET("/groups/:id/standings", groupHdl.GetStandings)
	}

	// ✅ Start WebSocket listener
	go realtime.HandleMessages()

	// ✅ Start Tournament & Cleanup Background Task
	go func() {
		cleanupTicker := time.NewTicker(24 * time.Hour)
		expiryTicker := time.NewTicker(1 * time.Hour)

		// Initial run on startup
		log.Println("🧹 First tournament cleanup & expiry run...")
		_ = tournamentRepo.CleanupOldTournaments(context.Background())
		_ = tournamentRepo.UpdateExpiredTournaments(context.Background())

		for {
			select {
			case <-cleanupTicker.C:
				log.Println("🧹 Periodic tournament cleanup run...")
				if err := tournamentRepo.CleanupOldTournaments(context.Background()); err != nil {
					log.Printf("❌ Cleanup error: %v", err)
				}
			case <-expiryTicker.C:
				log.Println("⏲️  Periodic tournament expiry check...")
				if err := tournamentRepo.UpdateExpiredTournaments(context.Background()); err != nil {
					log.Printf("❌ Expiry check error: %v", err)
				}
			}
		}
	}()

	// Start server
	r.Run(":" + cfg.Port)
}
