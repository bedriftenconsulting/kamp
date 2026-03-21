package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

const migrationTable = "app_schema_migrations"

func RunMigrations(db *pgxpool.Pool) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := ensureMigrationTable(ctx, db); err != nil {
		return err
	}

	migrationDir, err := resolveMigrationDir()
	if err != nil {
		return err
	}

	entries, err := os.ReadDir(migrationDir)
	if err != nil {
		return fmt.Errorf("read migrations directory: %w", err)
	}

	files := make([]string, 0)
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		name := e.Name()
		if strings.HasSuffix(name, ".up.sql") {
			files = append(files, name)
		}
	}
	sort.Strings(files)

	for _, file := range files {
		var exists bool
		if err := db.QueryRow(ctx, fmt.Sprintf(`SELECT EXISTS(SELECT 1 FROM %s WHERE version = $1)`, migrationTable), file).Scan(&exists); err != nil {
			return fmt.Errorf("check migration %s: %w", file, err)
		}
		if exists {
			continue
		}

		// Baseline support: if the initial schema already exists in DB but migration tracking
		// was introduced later, mark 000001 as applied instead of failing on "already exists".
		if strings.HasPrefix(file, "000001_") {
			var initSchemaPresent bool
			if err := db.QueryRow(ctx, `SELECT to_regclass('public.roles') IS NOT NULL`).Scan(&initSchemaPresent); err != nil {
				return fmt.Errorf("check init schema baseline for %s: %w", file, err)
			}
			if initSchemaPresent {
				if _, err := db.Exec(ctx, fmt.Sprintf(`INSERT INTO %s (version) VALUES ($1) ON CONFLICT (version) DO NOTHING`, migrationTable), file); err != nil {
					return fmt.Errorf("record baseline migration %s: %w", file, err)
				}
				log.Printf("⏭️  Baseline detected (roles table exists), marked migration as applied: %s", file)
				continue
			}
		}

		path := filepath.Join(migrationDir, file)
		sqlBytes, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", file, err)
		}

		tx, err := db.Begin(ctx)
		if err != nil {
			return fmt.Errorf("begin migration tx for %s: %w", file, err)
		}

		if _, err := tx.Exec(ctx, string(sqlBytes)); err != nil {
			tx.Rollback(ctx)
			return fmt.Errorf("apply migration %s: %w", file, err)
		}

		if _, err := tx.Exec(ctx, fmt.Sprintf(`INSERT INTO %s (version) VALUES ($1)`, migrationTable), file); err != nil {
			tx.Rollback(ctx)
			return fmt.Errorf("record migration %s: %w", file, err)
		}

		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("commit migration %s: %w", file, err)
		}

		log.Printf("✅ Applied migration: %s", file)
	}

	return nil
}

func ensureMigrationTable(ctx context.Context, db *pgxpool.Pool) error {
	if _, err := db.Exec(ctx, fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS %s (
			version TEXT PRIMARY KEY,
			applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`, migrationTable)); err != nil {
		return fmt.Errorf("create schema_migrations table: %w", err)
	}

	var dataType string
	if err := db.QueryRow(ctx, `
		SELECT data_type
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = $1
			AND column_name = 'version'
	`, migrationTable).Scan(&dataType); err != nil {
		return fmt.Errorf("inspect %s.version column: %w", migrationTable, err)
	}

	if dataType != "text" && dataType != "character varying" {
		if _, err := db.Exec(ctx, fmt.Sprintf(
			`ALTER TABLE %s ALTER COLUMN version TYPE TEXT USING version::TEXT`,
			migrationTable,
		)); err != nil {
			return fmt.Errorf("normalize %s.version to text: %w", migrationTable, err)
		}
		log.Printf("⚙️ Normalized %s.version column type from %s to text", migrationTable, dataType)
	}

	return nil
}

func resolveMigrationDir() (string, error) {
	candidates := []string{
		"internal/database/migrations",
		"backend/internal/database/migrations",
	}

	for _, c := range candidates {
		if info, err := os.Stat(c); err == nil && info.IsDir() {
			return c, nil
		}
	}

	return "", fmt.Errorf("migrations directory not found (checked: %v)", candidates)
}
