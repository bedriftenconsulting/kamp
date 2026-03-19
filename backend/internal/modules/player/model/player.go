package model

import "time"

type Player struct {
	ID              string    `json:"id"`
	FirstName       string    `json:"first_name"`
	LastName        string    `json:"last_name"`
	DateOfBirth     time.Time `json:"date_of_birth"` // ✅ FIXED
	Nationality     string    `json:"nationality"`
	Ranking         int       `json:"ranking"`
	Bio             string    `json:"bio"`
	ProfileImageURL string    `json:"profile_image_url"`
	CreatedAt       time.Time `json:"created_at"`
}
