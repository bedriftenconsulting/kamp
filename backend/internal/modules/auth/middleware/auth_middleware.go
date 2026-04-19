package middleware

import (
	"kamp/internal/modules/auth/utils"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
			c.Abort()
			return
		}

		claims, err := utils.ParseToken(parts[1], secret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Set context values
		c.Set("user_id", claims.UserID)
		c.Set("role", claims.Role)

		c.Next()
	}
}

func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		roleStr := userRole.(string)
		for _, role := range roles {
			if roleStr == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to access this resource"})
		c.Abort()
	}
}

func RequireTournamentAccess(db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		role := c.GetString("role")
		tournamentID := c.Param("id")

		if role == "admin" {
			c.Next()
			return
		}

		if role != "director" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Only admins or directors can manage tournaments"})
			c.Abort()
			return
		}

		// Check ownership
		var directorID string
		err := db.QueryRow(c.Request.Context(), "SELECT COALESCE(director_id::text, '') FROM tournaments WHERE id = $1", tournamentID).Scan(&directorID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Tournament not found"})
			c.Abort()
			return
		}

		if directorID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "You are not the director of this tournament"})
			c.Abort()
			return
		}

		c.Next()
	}
}

func RequireMatchAccess(db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		role := c.GetString("role")
		matchID := c.Param("id")

		if role == "admin" {
			c.Next()
			return
		}

		// Umpires and Directors can have match access
		var umpireID, tournamentID string
		err := db.QueryRow(c.Request.Context(), "SELECT COALESCE(umpire_id::text, ''), tournament_id::text FROM matches WHERE id = $1", matchID).Scan(&umpireID, &tournamentID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Match not found"})
			c.Abort()
			return
		}

		// Umpire check: allow if assigned to the match OR if umpire has tournament-wide access
		if role == "umpire" {
			if umpireID == userID {
				c.Next()
				return
			}
			// Check if this umpire is assigned to the tournament (tournament-scoped credential)
			var userTournamentID string
			_ = db.QueryRow(c.Request.Context(),
				"SELECT COALESCE(tournament_id::text, '') FROM users WHERE id = $1", userID,
			).Scan(&userTournamentID)
			if userTournamentID != "" && userTournamentID == tournamentID {
				c.Next()
				return
			}
			c.JSON(http.StatusForbidden, gin.H{"error": "You are not assigned to this match"})
			c.Abort()
			return
		}

		// Director check
		if role == "director" {
			var directorID string
			err := db.QueryRow(c.Request.Context(), "SELECT COALESCE(director_id::text, '') FROM tournaments WHERE id = $1", tournamentID).Scan(&directorID)
			if err == nil && directorID == userID {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized access to match"})
		c.Abort()
	}
}
