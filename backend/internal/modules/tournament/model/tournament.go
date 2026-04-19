package model

import "time"

// Tournament represents a tennis tournament stored in the database.
// The BannerImage and AccentColor fields were added (migration 000010) to allow
// each tournament to have its own visual identity on the public homepage:
//
//   - BannerImage: a base64-encoded data URL of the hero background image
//     (e.g. "data:image/png;base64,..."). Stored as TEXT in PostgreSQL so
//     it can round-trip as a plain string without any encoding on the server.
//
//   - AccentColor: a CSS hex colour string (e.g. "#e91e8c") that overrides
//     the site-wide highlight / "pink" colour while this tournament is active.
//     The frontend injects it as the --t-accent CSS custom property on <html>.
type Tournament struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Location    string     `json:"location"`
	StartDate   *time.Time `json:"start_date"`
	EndDate     *time.Time `json:"end_date"`
	Status      string     `json:"status"`
	CreatedBy   *string    `json:"created_by,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	Surface     string     `json:"surface"`
	BannerImage string     `json:"banner_image"` // base64 data URL, stored in DB
	AccentColor string     `json:"accent_color"` // hex colour, e.g. "#e91e8c"
	DirectorID  *string    `json:"director_id,omitempty"`
}
