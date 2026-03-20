package model

import "time"

type Tournament struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	Location  string     `json:"location"`
	StartDate *time.Time `json:"start_date"`
	EndDate   *time.Time `json:"end_date"`
	Status    string     `json:"status"`
	CreatedBy *string    `json:"created_by,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	Surface   string     `json:"surface"`
}
