package model

import "time"

type Group struct {
	ID              string    `json:"id"`
	TournamentID    *string   `json:"tournament_id"`
	Designation     string    `json:"designation"`
	Gender          string    `json:"gender"`
	GroupType       string    `json:"group_type"`
	MaxPlayers      int       `json:"max_players"`
	QualifiersCount int       `json:"qualifiers_count"`
	IsLocked        bool      `json:"is_locked"`
	PlayersCount    int       `json:"players_count"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type GroupMatch struct {
	ID          string    `json:"id"`
	GroupID     string    `json:"group_id"`
	Player1ID   string    `json:"player1_id"`
	Player2ID   string    `json:"player2_id"`
	Player1Name string    `json:"player1_name"`
	Player2Name string    `json:"player2_name"`
	Player1Score int      `json:"player1_score"`
	Player2Score int      `json:"player2_score"`
	WinnerID    *string   `json:"winner_id"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type GroupStanding struct {
	PlayerID      string `json:"player_id"`
	PlayerName    string `json:"player_name"`
	Wins          int    `json:"wins"`
	Losses        int    `json:"losses"`
	ScoreFor      int    `json:"score_for"`
	ScoreAgainst  int    `json:"score_against"`
	ScoreDiff     int    `json:"score_diff"`
	Points        int    `json:"points"`
	Rank          int    `json:"rank"`
	IsQualified   bool   `json:"is_qualified"`
}
