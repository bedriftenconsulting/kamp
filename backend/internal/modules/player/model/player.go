package model

import "time"

//This is used for:

//Business logic
//Database operations
type Player struct {
	ID              string    `json:"id"`
	FirstName       string    `json:"first_name"`
	LastName        string    `json:"last_name"`
	DateOfBirth     time.Time `json:"date_of_birth"`
	Nationality     string    `json:"nationality"`
	TournamentID    string    `json:"tournament_id"`
	TournamentName  string    `json:"tournament_name"`
	Gender          string    `json:"gender"`
	Age             int       `json:"age"`
	TennisLevel     string    `json:"tennis_level"`
	Ranking         int       `json:"ranking"`
	Bio             string    `json:"bio"`
	ProfileImageURL string    `json:"profile_image_url"`
	IsTeam          bool      `json:"is_team"`
	Player1ID       string    `json:"player1_id,omitempty"` // For team creation API
	Player2ID       string    `json:"player2_id,omitempty"` // For team creation API
	TeamMembers     []Player  `json:"team_members,omitempty"` // For returning nested players
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
