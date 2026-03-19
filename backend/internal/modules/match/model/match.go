package model

import "time"

type Match struct {
	ID            string     `json:"id"`
	TournamentID  string     `json:"tournament_id"`
	Player1ID     *string    `json:"player1_id"`
	Player2ID     *string    `json:"player2_id"`
	CourtID       *string    `json:"court_id"`
	Round         string     `json:"round"`
	ScheduledTime *time.Time `json:"scheduled_time"`
	Status        string     `json:"status"`
	WinnerID      *string    `json:"winner_id"`
	UmpireID      *string    `json:"umpire_id"`
	CreatedAt     time.Time  `json:"created_at"`

	Player1Name string `json:"player1_name"`
	Player2Name string `json:"player2_name"`
}
