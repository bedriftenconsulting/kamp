package config

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewDB(cfg *Config) *pgxpool.Pool {
	dsn := strings.TrimSpace(cfg.DatabaseURL)
	if dsn == "" {
		dsn = fmt.Sprintf(
			"postgres://%s:%s@%s:%s/%s?sslmode=%s",
			cfg.DBUser,
			cfg.DBPassword,
			cfg.DBHost,
			cfg.DBPort,
			cfg.DBName,
			cfg.DBSSLMode,
		)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	db, err := pgxpool.New(ctx, dsn)
	if err != nil {
		log.Printf("⚠️ DB connection failed: %v", err)
	}

	// db, err := pgxpool.New(ctx, dsn)
	// if err != nil {
	// 	log.Fatalf("Unable to connect to database: %v", err)
	// }

	err = db.Ping(ctx)
	if err != nil {
		log.Fatalf("Database ping failed: %v", err)
	}

	log.Println("✅ Connected to PostgreSQL")

	return db
}
