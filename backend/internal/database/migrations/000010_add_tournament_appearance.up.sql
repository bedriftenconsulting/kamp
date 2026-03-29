-- Migration: 000010_add_tournament_appearance.up.sql
--
-- Adds banner_image and accent_color columns to the tournaments table.
--
-- banner_image  : stores the base64-encoded PNG/JPG uploaded by the admin.
--                 Using TEXT (not BYTEA) because it arrives from the browser as
--                 a data URL string (e.g. "data:image/png;base64,...").
--
-- accent_color  : stores the chosen hex colour string (e.g. "#e91e8c").
--                 Used by the homepage to override the site-wide highlight colour
--                 for this specific tournament.

ALTER TABLE tournaments
    ADD COLUMN IF NOT EXISTS banner_image TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT NULL;
