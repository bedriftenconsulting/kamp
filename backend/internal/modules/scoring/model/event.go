package model

import "time"

type MatchEvent struct {
	ID        string    `json:"id"`
	MatchID   string    `json:"match_id"`
	SetID     *string   `json:"set_id"`
	GameID    *string   `json:"game_id"`
	EventType string    `json:"event_type"`
	PlayerID  *string   `json:"player_id"`
	Point     string    `json:"point_value"`
	CreatedAt time.Time `json:"created_at"`
}
