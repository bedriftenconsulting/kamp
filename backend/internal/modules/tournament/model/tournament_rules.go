package model

import "time"

type TournamentRules struct {
	TournamentID       string    `json:"tournament_id"`
	ScoringFormat      string    `json:"scoring_format"`
	MaxPoints          int       `json:"max_points"`
	TieBreakTrigger    int       `json:"tie_break_trigger"`
	TieBreakMaxPoints  int       `json:"tie_break_max_points"`
	WinByTwo           bool      `json:"win_by_two"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}
