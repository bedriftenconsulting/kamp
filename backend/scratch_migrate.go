package main

import (
	"log"

	"kamp/internal/config"
)

func main() {
	cfg := config.LoadConfig()
	db := config.NewDB(cfg)
	defer db.Close()

	if err := config.RunMigrations(db); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	log.Println("Migrations applied successfully!")
}
