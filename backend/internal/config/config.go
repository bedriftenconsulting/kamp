package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	DatabaseURL        string
	DBHost             string
	DBPort             string
	DBUser             string
	DBPassword         string
	DBName             string
	DBSSLMode          string
	CORSAllowedOrigins []string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		err = godotenv.Load("../.env")
	}
	if err != nil {
		log.Println("No .env file found, using system env")
	}

	return &Config{
		// Render injects PORT. SERVER_PORT kept as fallback for local/development parity.
		Port: resolvePort(),

		// Preferred connection string for hosted environments (Render, Railway, etc.).
		DatabaseURL: strings.TrimSpace(getEnv("DATABASE_URL", "")),

		// Field-based fallback for local development.
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "admin"),
		DBPassword: getEnv("DB_PASSWORD", "admin"),
		DBName:     getEnv("DB_NAME", "kampdb"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),

		// Comma-separated origins (supports wildcard when used with AllowWildcard in CORS config).
		CORSAllowedOrigins: resolveCORSAllowedOrigins(),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func resolvePort() string {
	port := strings.TrimSpace(getEnv("PORT", ""))
	if port == "" {
		port = strings.TrimSpace(getEnv("SERVER_PORT", "8080"))
	}

	// Accept forms like ":10000", "0.0.0.0:10000", or "10000" and normalize to plain "10000".
	if i := strings.LastIndex(port, ":"); i != -1 {
		port = port[i+1:]
	}

	if port == "" {
		return "8080"
	}

	return port
}

func resolveCORSAllowedOrigins() []string {
	raw := strings.TrimSpace(getEnv("CORS_ALLOWED_ORIGINS", ""))
	if raw == "" {
		return []string{
			"http://localhost:3000",
			"http://localhost:5173",
			"http://localhost:8080",
			"https://*.vercel.app",
		}
	}

	parts := strings.Split(raw, ",")
	origins := make([]string, 0, len(parts))
	for _, part := range parts {
		origin := strings.TrimSpace(part)
		if origin != "" {
			origins = append(origins, origin)
		}
	}

	if len(origins) == 0 {
		return []string{"http://localhost:5173", "https://*.vercel.app"}
	}

	return origins
}
