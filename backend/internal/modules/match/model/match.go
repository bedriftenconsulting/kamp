package model

import "time"

type Match struct {
	ID            string     `json:"id"`
	TournamentID  *string    `json:"tournament_id"`
	Player1ID     *string    `json:"player1_id"`
	Player2ID     *string    `json:"player2_id"`
	CourtID       *string    `json:"court_id"`
	Round         string     `json:"round"`
	ScheduledTime *time.Time `json:"scheduled_time"`
	Status        string     `json:"status"`
	WinnerID      *string    `json:"winner_id"`
	UmpireID      *string    `json:"umpire_id"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`

	Player1Name string `json:"player1_name"`
	Player2Name string `json:"player2_name"`
	WinnerName  string `json:"winner_name"`
	Player1Score  *int    `json:"player1_score,omitempty"`
	Player2Score  *int    `json:"player2_score,omitempty"`
	Player1Games  *int    `json:"player1_games,omitempty"`
	Player2Games  *int    `json:"player2_games,omitempty"`
	Player1Points *string `json:"player1_points,omitempty"`
	Player2Points *string `json:"player2_points,omitempty"`
}
